from pathlib import Path

import psycopg2

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / "Frontend" / ".env.local"
MIGRATIONS = [
    ROOT / "Backend" / "supabase" / "migrations" / "20260912000000_document_ocr_image_formats.sql",
    ROOT / "Backend" / "supabase" / "migrations" / "20260912193500_face_and_behavior.sql",
    ROOT / "Backend" / "supabase" / "migrations" / "20260912210000_attendance_and_violation_review.sql",
]


def database_url() -> str:
    raw = ENV_PATH.read_text(encoding="utf-8")
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped.startswith("DATABASE_URL="):
            continue
        value = stripped.split("=", 1)[1].strip().strip('"').strip("'")
        if not value:
            raise SystemExit("DATABASE_URL is empty; apply the SQL files in the Supabase SQL editor")
        return value
    raise SystemExit("DATABASE_URL missing")


def main() -> None:
    conn = psycopg2.connect(database_url())
    conn.autocommit = True
    cur = conn.cursor()
    for path in MIGRATIONS:
        try:
            cur.execute(path.read_text(encoding="utf-8"))
            print(f"OK {path.name}")
        except Exception as exc:
            msg = str(exc).split("\n")[0]
            lowered = msg.lower()
            if any(token in lowered for token in ("already exists", "duplicate")):
                print(f"SKIP {path.name}: {msg}")
                continue
            print(f"FAIL {path.name}: {msg}")
            raise
    cur.close()
    conn.close()
    print("DONE")


if __name__ == "__main__":
    main()
