"""
PostgreSQL Database Module for ChurnAI
Handles connection pooling, table creation, and all DB operations.
Uses psycopg2 with connection pooling for PostgreSQL / Neon.
"""

import os
import psycopg2
import psycopg2.pool
import psycopg2.extras
from contextlib import contextmanager

# Load env
try:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
except FileNotFoundError:
    pass

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/churnai_db")
JWT_SECRET = os.getenv("JWT_SECRET", "churnai_secret_key_2026")

# ─── Connection Pool ──────────────────────────────────────────

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        try:
            _pool = psycopg2.pool.SimpleConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=DATABASE_URL,
            )
            print("✅ PostgreSQL connection pool created")
        except psycopg2.Error as e:
            print(f"❌ PostgreSQL connection error: {e}")
            raise
    return _pool


@contextmanager
def get_db():
    """Get a database connection from the pool."""
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)


# ─── Table Creation ───────────────────────────────────────────

TABLES = [
    ("users", """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            active_category VARCHAR(50) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """),
    ("user_categories", """
        CREATE TABLE IF NOT EXISTS user_categories (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            category_name VARCHAR(50) NOT NULL,
            model_type VARCHAR(30) DEFAULT 'random_forest',
            schema_json TEXT,
            description VARCHAR(255) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, category_name),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """),
    ("uploads", """
        CREATE TABLE IF NOT EXISTS uploads (
            id SERIAL PRIMARY KEY,
            process_code VARCHAR(12) UNIQUE NOT NULL,
            user_id INT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL,
            row_count INT DEFAULT 0,
            column_count INT DEFAULT 0,
            headers_json TEXT,
            file_path VARCHAR(500),
            file_size_kb REAL DEFAULT 0,
            status VARCHAR(20) DEFAULT 'uploaded'
                CHECK (status IN ('uploaded','validating','processing','completed','failed')),
            status_message TEXT,
            validation_errors TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """),
    ("results", """
        CREATE TABLE IF NOT EXISTS results (
            id SERIAL PRIMARY KEY,
            process_code VARCHAR(12) NOT NULL,
            upload_id INT NOT NULL,
            user_id INT NOT NULL,
            total_records INT DEFAULT 0,
            predicted_churn INT DEFAULT 0,
            predicted_stay INT DEFAULT 0,
            churn_rate REAL DEFAULT 0,
            result_file_path VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """),
]


def init_tables():
    """Create all tables if they don't exist."""
    with get_db() as conn:
        cursor = conn.cursor()
        for name, ddl in TABLES:
            cursor.execute(ddl)
            print(f"  ✓ Table `{name}` ready")
        conn.commit()
        cursor.close()
    print("✅ Database initialized")


# ─── Helper: dict cursor ─────────────────────────────────────

def _dict_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


# ─── User Operations ─────────────────────────────────────────

def create_user(username: str, email: str, password_hash: str, name: str, category: str = None) -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, name, active_category) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (username, email, password_hash, name, category),
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        return user_id


def get_user_by_email(email: str) -> dict | None:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        row = cursor.fetchone()
        cursor.close()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict | None:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        cursor.execute("SELECT id, username, email, name, active_category, created_at FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        cursor.close()
        return dict(row) if row else None


def update_user_category(user_id: int, category: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET active_category = %s WHERE id = %s", (category, user_id))
        conn.commit()
        cursor.close()


# ─── Category Operations ─────────────────────────────────────

def add_user_category(user_id: int, category_name: str, model_type: str = "random_forest",
                      schema_json: str = None, description: str = "") -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO user_categories (user_id, category_name, model_type, schema_json, description)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (user_id, category_name)
               DO UPDATE SET model_type = EXCLUDED.model_type, schema_json = EXCLUDED.schema_json, description = EXCLUDED.description
               RETURNING id""",
            (user_id, category_name, model_type, schema_json, description),
        )
        cat_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        return cat_id


def get_user_categories(user_id: int) -> list:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        cursor.execute("SELECT * FROM user_categories WHERE user_id = %s ORDER BY created_at", (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        return [dict(r) for r in rows]


def get_category_schema(user_id: int, category_name: str) -> dict | None:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        cursor.execute(
            "SELECT * FROM user_categories WHERE user_id = %s AND category_name = %s",
            (user_id, category_name),
        )
        row = cursor.fetchone()
        cursor.close()
        return dict(row) if row else None


# ─── Upload Operations ───────────────────────────────────────

def create_upload(process_code: str, user_id: int, file_name: str, original_name: str,
                  category: str, row_count: int, column_count: int, headers_json: str,
                  file_path: str, file_size_kb: float) -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO uploads (process_code, user_id, file_name, original_name, category,
               row_count, column_count, headers_json, file_path, file_size_kb)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (process_code, user_id, file_name, original_name, category,
             row_count, column_count, headers_json, file_path, file_size_kb),
        )
        upload_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        return upload_id


def update_upload_status(process_code: str, status: str, message: str = None, errors: str = None):
    with get_db() as conn:
        cursor = conn.cursor()
        if status == "completed":
            cursor.execute(
                "UPDATE uploads SET status = %s, status_message = %s, validation_errors = %s, completed_at = NOW() WHERE process_code = %s",
                (status, message, errors, process_code),
            )
        else:
            cursor.execute(
                "UPDATE uploads SET status = %s, status_message = %s, validation_errors = %s WHERE process_code = %s",
                (status, message, errors, process_code),
            )
        conn.commit()
        cursor.close()


def get_uploads_by_user(user_id: int, category: str = None) -> list:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        if category:
            cursor.execute(
                "SELECT * FROM uploads WHERE user_id = %s AND category = %s ORDER BY uploaded_at DESC",
                (user_id, category),
            )
        else:
            cursor.execute(
                "SELECT * FROM uploads WHERE user_id = %s ORDER BY uploaded_at DESC",
                (user_id,),
            )
        rows = cursor.fetchall()
        cursor.close()
        return [dict(r) for r in rows]


def get_upload_by_code(process_code: str) -> dict | None:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        cursor.execute("SELECT * FROM uploads WHERE process_code = %s", (process_code,))
        row = cursor.fetchone()
        cursor.close()
        return dict(row) if row else None


def delete_upload(process_code: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM uploads WHERE process_code = %s", (process_code,))
        conn.commit()
        cursor.close()


# ─── Results Operations ──────────────────────────────────────

def create_result(process_code: str, upload_id: int, user_id: int, total_records: int,
                  predicted_churn: int, predicted_stay: int, churn_rate: float,
                  result_file_path: str) -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO results (process_code, upload_id, user_id, total_records,
               predicted_churn, predicted_stay, churn_rate, result_file_path)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (process_code, upload_id, user_id, total_records,
             predicted_churn, predicted_stay, churn_rate, result_file_path),
        )
        result_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        return result_id


def get_results_by_user(user_id: int, category: str = None) -> list:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        if category:
            cursor.execute(
                """SELECT r.*, u.file_name, u.original_name, u.category
                   FROM results r JOIN uploads u ON r.upload_id = u.id
                   WHERE r.user_id = %s AND u.category = %s ORDER BY r.created_at DESC""",
                (user_id, category),
            )
        else:
            cursor.execute(
                """SELECT r.*, u.file_name, u.original_name, u.category
                   FROM results r JOIN uploads u ON r.upload_id = u.id
                   WHERE r.user_id = %s ORDER BY r.created_at DESC""",
                (user_id,),
            )
        rows = cursor.fetchall()
        cursor.close()
        return [dict(r) for r in rows]


def get_result_by_code(process_code: str) -> dict | None:
    with get_db() as conn:
        cursor = _dict_cursor(conn)
        cursor.execute(
            """SELECT r.*, u.file_name, u.original_name, u.category
               FROM results r JOIN uploads u ON r.upload_id = u.id
               WHERE r.process_code = %s""",
            (process_code,),
        )
        row = cursor.fetchone()
        cursor.close()
        return dict(row) if row else None
