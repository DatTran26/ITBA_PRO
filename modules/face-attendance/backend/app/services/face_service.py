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
        """Khởi tạo FaceAnalysis với buffalo_sc (nhẹ, nhanh, 512-D ArcFace)"""
        try:
            import insightface
            from insightface.app import FaceAnalysis

            logger.info(f"Đang khởi tạo InsightFace FaceAnalysis ({settings.INSIGHTFACE_MODEL})...")
            app = FaceAnalysis(name=settings.INSIGHTFACE_MODEL, providers=["CPUExecutionProvider"])
            app.prepare(ctx_id=0, det_size=(640, 640))
            self.app = app
            logger.info("InsightFace FaceAnalysis khởi tạo thành công.")
        except Exception as e:
            logger.warning(f"Chưa thể load InsightFace ngay: {e}. Sẽ thử lại khi có request.")
            self.app = None

    def ensure_model_loaded(self):
        if self.app is None:
            self._init_app()
        if self.app is None:
            raise RuntimeError("InsightFace model chưa được tải. Hãy đảm bảo đã cài onnxruntime và insightface.")

    def decode_image_bytes(self, file_bytes: bytes, filename: str) -> np.ndarray:
        """Đọc và giải mã dữ liệu ảnh từ buffer, hỗ trợ cả file PDF (trang 1) và file ảnh thông thường"""
        if filename.lower().endswith(".pdf"):
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                if len(doc) == 0:
                    raise ValueError("File PDF rỗng.")
                page = doc.load_page(0)
                pix = page.get_pixmap(dpi=150)
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
                if pix.n == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
                else:
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                return img
            except Exception as err:
                logger.error(f"Lỗi đọc file PDF: {err}")
                raise ValueError(f"Không thể giải mã file PDF: {str(err)}")
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
                    raise ValueError(f"Không thể giải mã định dạng ảnh ({ex}).")
            return img

    def extract_cv_face(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Trích xuất khuôn mặt chính diện lớn nhất từ file CV (ảnh hoặc PDF).
        Trả về vector 512 chiều, tọa độ bounding box và ảnh avatar cắt sẵn.
        """
        self.ensure_model_loaded()
        img = self.decode_image_bytes(file_bytes, filename)

        faces = self.app.get(img)
        if not faces or len(faces) == 0:
            raise ValueError("Không phát hiện khuôn mặt nào trong tài liệu đã tải lên.")

        # Lấy khuôn mặt có diện tích bbox lớn nhất
        target_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

        # Chuẩn hóa L2 cho embedding 512 chiều để tính Cosine Similarity
        raw_emb = target_face.embedding
        norm = np.linalg.norm(raw_emb)
        normalized_emb = (raw_emb / norm).tolist() if norm > 0 else raw_emb.tolist()

        # Bounding box [x1, y1, x2, y2]
        h, w, _ = img.shape
        x1, y1, x2, y2 = [int(max(0, v)) for v in target_face.bbox]
        x2, y2 = min(w, x2), min(h, y2)

        # Cắt avatar có viền đệm nhẹ (padding 15%)
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
        """Trích xuất khuôn mặt và vector từ frame camera thời gian thực"""
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
        """Tính Cosine Similarity giữa 2 vector đặc trưng đã chuẩn hóa L2"""
        e1 = np.asarray(emb1, dtype=np.float32)
        e2 = np.asarray(emb2, dtype=np.float32)
        return float(np.dot(e1, e2))

face_service = FaceService()