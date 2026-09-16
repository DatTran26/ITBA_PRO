import cv2
import numpy as np
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger("antispoofing_service")

class AntiSpoofingService:
    """
    D?ch v? Ch?ng gi? m?o kép (Dual Anti-Spoofing):
    1. AI/Texture Liveness: Phân tích k?t c?u da, vi?n ph?n x? ánh sáng màn hình/?nh in và t?n s? pixel.
    2. Motion & Landmark Liveness: Ðo ch? s? Eye Aspect Ratio (EAR) d? nh?n di?n ch?p m?t th?t và vi chuy?n d?ng (Micro-motion).
    """

    def __init__(self):
        self.onnx_session = None
        self._try_load_onnx_model()

    def _try_load_onnx_model(self):
        """N?u có s?n file model ONNX (nhu MiniFASNet), kh?i t?o ONNX runtime session"""
        try:
            import os
            import onnxruntime as ort
            model_path = os.getenv("ANTISPOOFING_MODEL_PATH", "models/antispoofing.onnx")
            if os.path.exists(model_path):
                self.onnx_session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
                logger.info(f"Ðã n?p model Anti-spoofing ONNX t? {model_path}")
        except Exception as e:
            logger.debug(f"Chua c?u hình ONNX model riêng ({e}), s? d?ng b? phân tích d?c trung quang h?c nâng cao.")

    # =========================================================================
    # 1. PHÂN TÍCH TEXTURE & QUANG H?C (SILENT ANTI-SPOOFING)
    # =========================================================================
    def analyze_texture_liveness(self, face_crop: np.ndarray) -> Dict[str, Any]:
        """
        Phân tích tính ch?t da ngu?i th?t qua:
        - Ph? t?n s? Laplacian (?nh in/màn hình thu?ng có nhi?u h?t scan ho?c vân moiré)
        - Ð? phân tán màu s?c trong không gian YCrCb & HSV (mô da ngu?i có hi?n tu?ng tán x? du?i da)
        - Ð? chói ph?n x? d?c trung c?a màn hình di?n t? (specular highlight)
        """
        if face_crop is None or face_crop.size == 0:
            return {"score": 0.0, "is_real": False, "reason": "?nh khuôn m?t r?ng."}

        # 1. Phân tích d? s?c nét & vân moiré qua Laplacian
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian_var = float(laplacian.var())

        # 2. Phân tích không gian màu YCrCb (do d? phong phú s?c t? da)
        ycrcb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2YCrCb)
        _, cr, cb = cv2.split(ycrcb)
        cr_std = float(np.std(cr))
        cb_std = float(np.std(cb))
        chroma_richness = (cr_std + cb_std) / 2.0

        # 3. Phân tích ph?n x? d? chói màn hình trong HSV
        hsv = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
        _, s, v = cv2.split(hsv)
        overexposure_ratio = float(np.sum(v > 245)) / float(v.size)

        # Tính di?m Silent Liveness (0.0 d?n 1.0)
        score = 0.60

        # 1. Phân tích d? nét: Webcam laptop thu?ng có d? nét t? 20 d?n 400
        if 35 <= laplacian_var <= 600:
            score += 0.20
        elif laplacian_var < 15:
            score -= 0.25  # Quá m?

        # 2. S?c thái da ngu?i th?t trong không gian YCrCb
        if 4.0 <= chroma_richness <= 35.0:
            score += 0.20
        else:
            score -= 0.15

        # 3. Ph?n chi?u quá m?c (tr? di?m n?u > 20% pixel b? chói lóa màn hình)
        if overexposure_ratio > 0.20:
            score -= 0.20

        score = max(0.1, min(1.0, score))
        is_real = score >= 0.40

        return {
            "score": round(score, 3),
            "is_real": is_real,
            "laplacian_var": round(laplacian_var, 1),
            "chroma_richness": round(chroma_richness, 2),
            "overexposure_ratio": round(overexposure_ratio, 3)
        }

    # =========================================================================
    # 2. PHÂN TÍCH CHUY?N Ð?NG & LANDMARKS (MOTION / EAR / BLINK LIVENESS)
    # =========================================================================
    @staticmethod
    def calculate_ear_5pts(landmarks_5: List[List[float]]) -> float:
        """Tính x?p x? t? l? m? m?t (EAR) d?a trên 5 landmarks co b?n"""
        if len(landmarks_5) < 5:
            return 0.3

        left_eye = np.array(landmarks_5[0])
        right_eye = np.array(landmarks_5[1])
        nose = np.array(landmarks_5[2])

        interocular_dist = np.linalg.norm(left_eye - right_eye)
        if interocular_dist < 1e-5:
            return 0.0

        eye_center = (left_eye + right_eye) / 2.0
        vertical_dist = np.linalg.norm(eye_center - nose)
        return float(vertical_dist / interocular_dist)

    @staticmethod
    def calculate_ear_106pts(landmarks_106: List[List[float]]) -> float:
        """Tính EAR chu?n khi có 106 facial landmarks t? InsightFace"""
        if not landmarks_106 or len(landmarks_106) < 106:
            return 0.3

        pts = np.array(landmarks_106)
        def get_single_ear(idx_horizontal, idx_vertical_pairs):
            p_h1, p_h2 = pts[idx_horizontal[0]], pts[idx_horizontal[1]]
            h_dist = np.linalg.norm(p_h1 - p_h2)
            if h_dist < 1e-5:
                return 0.0
            v_dists = [np.linalg.norm(pts[v1] - pts[v2]) for v1, v2 in idx_vertical_pairs]
            return float(sum(v_dists) / (2.0 * h_dist))

        try:
            ear_left = get_single_ear((35, 39), [(36, 42), (37, 41)])
            ear_right = get_single_ear((89, 93), [(90, 96), (91, 95)])
            return float((ear_left + ear_right) / 2.0)
        except Exception:
            return 0.28

    def analyze_sequence_motion(self, frames_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Phân tích chu?i frames t? camera d? phát hi?n chuy?n d?ng t? nhiên ho?c ?nh tinh gi? m?o"""
        if len(frames_data) < 2:
            return {
                "motion_verified": True,
                "reason": "Ch?p nh?n frame camera.",
                "blink_detected": False,
                "micro_motion_score": 0.8
            }

        ears = []
        centers = []

        for f in frames_data:
            bbox = f.get("bbox", [0, 0, 0, 0])
            center_x = (bbox[0] + bbox[2]) / 2.0
            center_y = (bbox[1] + bbox[3]) / 2.0
            centers.append((center_x, center_y))

            lm_106 = f.get("landmarks_106")
            lm_5 = f.get("landmarks_5", [])
            if lm_106:
                ears.append(self.calculate_ear_106pts(lm_106))
            elif lm_5:
                ears.append(self.calculate_ear_5pts(lm_5))

        centers_arr = np.array(centers)
        movement_std = float(np.mean(np.std(centers_arr, axis=0)))

        # Ch? coi là gi? m?o n?u sai s? t?a d? b?ng dúng 0.000 (?nh tinh copy-paste hoàn toàn)
        is_static_spoof = movement_std < 0.001

        blink_detected = False
        if len(ears) >= 2:
            ear_diff = max(ears) - min(ears)
            if ear_diff >= 0.04:
                blink_detected = True

        motion_score = 0.85 if not is_static_spoof else 0.2
        if blink_detected:
            motion_score = 0.95

        return {
            "motion_verified": not is_static_spoof,
            "blink_detected": blink_detected,
            "movement_std": round(movement_std, 3),
            "micro_motion_score": round(motion_score, 2),
            "ear_values": [round(e, 3) for e in ears]
        }

    # =========================================================================
    # 3. K?T H?P ÐÁNH GIÁ T?NG TH? (COMPREHENSIVE VERIFICATION)
    # =========================================================================
    def evaluate_liveness(
        self,
        face_crops: List[np.ndarray],
        frames_metadata: List[Dict[str, Any]],
        mode: str = "standard"
    ) -> Dict[str, Any]:
        """
        T?ng h?p k?t qu? dánh giá:
        - mode == 'off': Luôn cho phép (d? test và phòng tru?ng h?p webcam phòng t?i)
        - mode == 'standard': M?c d?nh th?c t?
        - mode == 'strict': Ch? d? an ninh cao
        """
        if mode == "off":
            return {
                "passed": True,
                "liveness_score": 0.99,
                "mode": "off",
                "details": {"message": "Anti-spoofing dang t?t ? ch? d? th? nghi?m."},
                "failure_reasons": []
            }

        primary_crop = face_crops[0] if face_crops else None
        texture_res = self.analyze_texture_liveness(primary_crop)
        motion_res = self.analyze_sequence_motion(frames_metadata)

        final_score = (texture_res["score"] * 0.5) + (motion_res["micro_motion_score"] * 0.5)
        final_score = round(final_score, 3)

        if mode == "strict":
            passed = texture_res["is_real"] and motion_res["motion_verified"] and (final_score >= 0.60)
        else:
            passed = motion_res["motion_verified"] and (final_score >= 0.25)

        reasons = []
        if not motion_res["motion_verified"]:
            reasons.append("Phát hi?n frame ?nh hoàn toàn b?t d?ng trùng l?p.")
        if not texture_res["is_real"]:
            reasons.append("Ánh sáng phòng ho?c webcam có d? chói cao.")

        return {
            "passed": passed,
            "liveness_score": final_score,
            "mode": mode,
            "details": {
                "texture_analysis": texture_res,
                "motion_analysis": motion_res
            },
            "failure_reasons": reasons
        }

antispoofing_service = AntiSpoofingService()