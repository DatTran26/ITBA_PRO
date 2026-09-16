import cv2
import numpy as np
import base64
import logging
from typing import Optional, Tuple, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("face_service")

class FaceService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FaceService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.app = None
        self._initialized = True

    def _init_app(self):
        """Kh?i t?o FaceAnalysis v?i buffalo_sc (nh?, nhanh, 512-D ArcFace)"""
        try:
            import insightface
            from insightface.app import FaceAnalysis

            logger.info(f"Ðang kh?i t?o InsightFace FaceAnalysis ({settings.INSIGHTFACE_MODEL})...")
            app = FaceAnalysis(name=settings.INSIGHTFACE_MODEL, providers=["CPUExecutionProvider"])
            app.prepare(ctx_id=0, det_size=(640, 640))
            self.app = app
            logger.info("InsightFace FaceAnalysis kh?i t?o thành công.")
        except Exception as e:
            logger.warning(f"Chua th? load InsightFace ngay: {e}. S? th? l?i khi có request.")
            self.app = None

    def ensure_model_loaded(self):
        if self.app is None:
            self._init_app()
        if self.app is None:
            raise RuntimeError("InsightFace model chua du?c t?i. Hãy d?m b?o dã cài onnxruntime và insightface.")

    def decode_image_bytes(self, file_bytes: bytes, filename: str) -> np.ndarray:
        """Ð?c và gi?i mã d? li?u ?nh t? buffer, h? tr? c? file PDF (trang 1) và file ?nh thông thu?ng"""
        if filename.lower().endswith(".pdf"):
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                if len(doc) == 0:
                    raise ValueError("File PDF r?ng.")
                page = doc.load_page(0)
                pix = page.get_pixmap(dpi=150)
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
                if pix.n == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
                else:
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                return img
            except Exception as err:
                logger.error(f"L?i d?c file PDF: {err}")
                raise ValueError(f"Không th? gi?i mã file PDF: {str(err)}")
        else:
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                try:
                    from PIL import Image, ImageOps
                    import io
                    pil_img = Image.open(io.BytesIO(file_bytes))
                    pil_img = ImageOps.exif_transpose(pil_img)
                    if pil_img.mode != "RGB":
                        pil_img = pil_img.convert("RGB")
                    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
                except Exception as ex:
                    raise ValueError(f"Không th? gi?i mã d?nh d?ng ?nh ({ex}).")
            return img

    def extract_cv_face(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Trích xu?t khuôn m?t chính di?n l?n nh?t t? file CV (?nh ho?c PDF).
        Tr? v? vector 512 chi?u, t?a d? bounding box và ?nh avatar c?t s?n.
        """
        self.ensure_model_loaded()
        img = self.decode_image_bytes(file_bytes, filename)

        faces = self.app.get(img)
        if not faces or len(faces) == 0:
            raise ValueError("Không phát hi?n khuôn m?t nào trong tài li?u dã t?i lên.")

        # L?y khuôn m?t có di?n tích bbox l?n nh?t
        target_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

        # Chu?n hóa L2 cho embedding 512 chi?u d? tính Cosine Similarity
        raw_emb = target_face.embedding
        norm = np.linalg.norm(raw_emb)
        normalized_emb = (raw_emb / norm).tolist() if norm > 0 else raw_emb.tolist()

        # Bounding box [x1, y1, x2, y2]
        h, w, _ = img.shape
        x1, y1, x2, y2 = [int(max(0, v)) for v in target_face.bbox]
        x2, y2 = min(w, x2), min(h, y2)

        # C?t avatar có vi?n d?m nh? (padding 15%)
        pad_x = int((x2 - x1) * 0.15)
        pad_y = int((y2 - y1) * 0.15)
        crop_x1, crop_y1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
        crop_x2, crop_y2 = min(w, x2 + pad_x), min(h, y2 + pad_y)

        face_crop = img[crop_y1:crop_y2, crop_x1:crop_x2]
        _, buffer = cv2.imencode(".jpg", face_crop, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        avatar_b64 = base64.b64encode(buffer).decode("utf-8")

        landmarks = target_face.kps.tolist() if hasattr(target_face, "kps") and target_face.kps is not None else []

        return {
            "embedding": normalized_emb,
            "bbox": [x1, y1, x2, y2],
            "landmarks": landmarks,
            "avatar_base64": f"data:image/jpeg;base64,{avatar_b64}",
            "face_count": len(faces)
        }

    def extract_face_from_frame(self, img: np.ndarray) -> Optional[Dict[str, Any]]:
        """Trích xu?t khuôn m?t và vector t? frame camera th?i gian th?c"""
        self.ensure_model_loaded()
        faces = self.app.get(img)
        if not faces or len(faces) == 0:
            return None

        main_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

        raw_emb = main_face.embedding
        norm = np.linalg.norm(raw_emb)
        normalized_emb = raw_emb / norm if norm > 0 else raw_emb

        landmarks = main_face.kps.tolist() if hasattr(main_face, "kps") and main_face.kps is not None else []
        landmark_2d = main_face.landmark_2d_106.tolist() if hasattr(main_face, "landmark_2d_106") and main_face.landmark_2d_106 is not None else None

        return {
            "face_object": main_face,
            "embedding": normalized_emb,
            "bbox": [int(v) for v in main_face.bbox],
            "landmarks_5": landmarks,
            "landmarks_106": landmark_2d
        }

    @staticmethod
    def compute_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Tính Cosine Similarity gi?a 2 vector d?c trung dã chu?n hóa L2"""
        e1 = np.asarray(emb1, dtype=np.float32)
        e2 = np.asarray(emb2, dtype=np.float32)
        return float(np.dot(e1, e2))

face_service = FaceService()