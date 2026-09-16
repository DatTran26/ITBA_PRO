import os
import sqlite3
import json
import logging
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger("attendance_service")

class AttendanceService:
    def __init__(self):
        self.db_path = settings.DB_PATH
        self.qdrant_client = None
        self.collection_name = settings.QDRANT_COLLECTION
        self._ensure_db_dir()
        self._init_sqlite()
        self._try_init_qdrant()

    def _ensure_db_dir(self):
        db_dir = os.path.dirname(os.path.abspath(self.db_path))
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    def _init_sqlite(self):
        """Kh?i t?o SQLite DB n?i b? luu tr? nhân viên, vector 512-D và l?ch s? di?m danh"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # B?ng nhân viên
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_code TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT,
                department TEXT,
                avatar_base64 TEXT,
                embedding_json TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            );
        """)

        # B?ng l?ch s? di?m danh
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                employee_code TEXT NOT NULL,
                full_name TEXT NOT NULL,
                checkin_time TEXT NOT NULL,
                similarity_score REAL NOT NULL,
                liveness_score REAL NOT NULL,
                device_id TEXT,
                status TEXT DEFAULT 'SUCCESS',
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            );
        """)
        conn.commit()
        conn.close()
        logger.info(f"Ðã kh?i t?o co s? d? li?u SQLite t?i {self.db_path}")

    def _try_init_qdrant(self):
        """Th? k?t n?i v?i Qdrant Vector DB n?u service dang ch?y"""
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http.models import Distance, VectorParams
            client = QdrantClient(url=settings.QDRANT_URL, timeout=2.0)

            collections = [c.name for c in client.get_collections().collections]
            if self.collection_name not in collections:
                client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=512, distance=Distance.COSINE)
                )
            self.qdrant_client = client
            logger.info("K?t n?i thành công t?i Qdrant Vector DB.")
        except Exception as e:
            logger.debug(f"Qdrant chua s?n sàng ({e}). S? d?ng công c? tính toán Vector tích h?p s?n SQLite + NumPy.")
            self.qdrant_client = None

    def save_employee(
        self,
        employee_code: str,
        full_name: str,
        department: str,
        email: str,
        embedding: List[float],
        avatar_base64: str = ""
    ) -> Dict[str, Any]:
        """Luu ho?c c?p nh?t thông tin nhân viên kèm vector 512 chi?u"""
        now = datetime.now().isoformat()
        emb_json = json.dumps(embedding)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM employees WHERE employee_code = ?", (employee_code,))
        row = cursor.fetchone()

        if row:
            emp_id = row[0]
            cursor.execute("""
                UPDATE employees
                SET full_name = ?, department = ?, email = ?, avatar_base64 = ?, embedding_json = ?, is_active = 1
                WHERE id = ?
            """, (full_name, department, email, avatar_base64, emb_json, emp_id))
        else:
            cursor.execute("""
                INSERT INTO employees (employee_code, full_name, department, email, avatar_base64, embedding_json, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (employee_code, full_name, department, email, avatar_base64, emb_json, now))
            emp_id = cursor.lastrowid

        conn.commit()
        conn.close()

        if self.qdrant_client:
            try:
                from qdrant_client.http.models import PointStruct
                self.qdrant_client.upsert(
                    collection_name=self.collection_name,
                    points=[
                        PointStruct(
                            id=emp_id,
                            vector=embedding,
                            payload={
                                "employee_code": employee_code,
                                "full_name": full_name,
                                "department": department
                            }
                        )
                    ]
                )
            except Exception as err:
                logger.warning(f"L?i d?ng b? vector sang Qdrant: {err}")

        return {
            "id": emp_id,
            "employee_code": employee_code,
            "full_name": full_name,
            "department": department
        }

    def search_face_1_to_n(
        self,
        query_embedding: List[float],
        threshold: float = 0.65
    ) -> Optional[Dict[str, Any]]:
        """
        Tìm ki?m 1:N d?i chi?u khuôn m?t v?i t?t c? nhân viên trong h? th?ng.
        Tr? v? nhân viên có d? tuong d?ng Cosine cao nh?t vu?t ngu?ng threshold.
        """
        query_vec = np.array(query_embedding, dtype=np.float32)

        # 1. Tìm ki?m b?ng Qdrant n?u kh? d?ng
        if self.qdrant_client:
            try:
                search_result = self.qdrant_client.search(
                    collection_name=self.collection_name,
                    query_vector=query_embedding,
                    limit=1,
                    score_threshold=threshold
                )
                if search_result:
                    top_match = search_result[0]
                    return {
                        "id": top_match.id,
                        "employee_code": top_match.payload.get("employee_code"),
                        "full_name": top_match.payload.get("full_name"),
                        "department": top_match.payload.get("department"),
                        "similarity": round(float(top_match.score), 4)
                    }
            except Exception as e:
                logger.warning(f"Tìm ki?m Qdrant th?t b?i, chuy?n sang b? tìm ki?m SQLite: {e}")

        # 2. Tìm ki?m Cosine Similarity tr?c ti?p b?ng NumPy (siêu t?c, < 2ms)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, employee_code, full_name, department, avatar_base64, embedding_json FROM employees WHERE is_active = 1")
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return None

        best_match = None
        highest_sim = -1.0

        for r in rows:
            emp_id, emp_code, full_name, dept, avatar_b64, emb_str = r
            emp_vec = np.array(json.loads(emb_str), dtype=np.float32)
            sim = float(np.dot(query_vec, emp_vec))

            if sim > highest_sim:
                highest_sim = sim
                best_match = {
                    "id": emp_id,
                    "employee_code": emp_code,
                    "full_name": full_name,
                    "department": dept,
                    "avatar_base64": avatar_b64,
                    "similarity": round(sim, 4)
                }

        if best_match and highest_sim >= threshold:
            return best_match

        return {
            "matched": False,
            "highest_similarity": round(highest_sim, 4) if highest_sim > -1 else 0.0,
            "message": "Không tìm th?y khuôn m?t trùng kh?p trong danh sách nhân viên."
        } if highest_sim > -1 else None

    def log_attendance(
        self,
        employee_id: int,
        employee_code: str,
        full_name: str,
        similarity_score: float,
        liveness_score: float,
        device_id: str = "CAM_01",
        status: str = "SUCCESS"
    ) -> Dict[str, Any]:
        """Ghi nh?n b?n ghi di?m danh vào co s? d? li?u"""
        now = datetime.now().isoformat()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO attendance_logs (employee_id, employee_code, full_name, checkin_time, similarity_score, liveness_score, device_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (employee_id, employee_code, full_name, now, similarity_score, liveness_score, device_id, status))
        log_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            "log_id": log_id,
            "employee_code": employee_code,
            "full_name": full_name,
            "checkin_time": now,
            "similarity_score": similarity_score,
            "liveness_score": liveness_score,
            "status": status
        }

    def get_employees(self) -> List[Dict[str, Any]]:
        """L?y danh sách t?t c? nhân viên dã dang ký khuôn m?t"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, employee_code, full_name, department, email, avatar_base64, created_at FROM employees WHERE is_active = 1")
        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": r[0],
                "employee_code": r[1],
                "full_name": r[2],
                "department": r[3],
                "email": r[4],
                "avatar_base64": r[5],
                "created_at": r[6]
            }
            for r in rows
        ]

    def get_attendance_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """L?y danh sách các l?n di?m danh g?n nh?t"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, employee_id, employee_code, full_name, checkin_time, similarity_score, liveness_score, device_id, status
            FROM attendance_logs
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "id": r[0],
                "employee_id": r[1],
                "employee_code": r[2],
                "full_name": r[3],
                "checkin_time": r[4],
                "similarity_score": r[5],
                "liveness_score": r[6],
                "device_id": r[7],
                "status": r[8]
            }
            for r in rows
        ]

    def get_attendance_summary(self) -> Dict[str, Any]:
        """Th?ng kê t?ng quan ch?m công trong ngày"""
        today_prefix = datetime.now().strftime("%Y-%m-%d")
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM employees WHERE is_active = 1")
        total_employees = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(DISTINCT employee_id)
            FROM attendance_logs
            WHERE checkin_time LIKE ? AND status = 'SUCCESS'
        """, (f"{today_prefix}%",))
        checked_in_today = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM attendance_logs
            WHERE checkin_time LIKE ? AND status = 'SPOOF_DETECTED'
        """, (f"{today_prefix}%",))
        spoof_attempts_today = cursor.fetchone()[0]

        conn.close()
        return {
            "total_employees": total_employees,
            "checked_in_today": checked_in_today,
            "missing_today": max(0, total_employees - checked_in_today),
            "spoof_attempts_today": spoof_attempts_today
        }

attendance_service = AttendanceService()