from fastapi import FastAPI
import psycopg2
import os

# Load .env
try:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
except FileNotFoundError:
    pass

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/churnai_db")
conn = psycopg2.connect(DATABASE_URL)

@app.get("/users")
def get_users():
    cur = conn.cursor()
    cur.execute("SELECT * FROM users;")
    data = cur.fetchall()
    cur.close()
    return {"users": data}
