import sys, os, re, logging
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request, HTTPException, Header, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from psycopg2.extras import execute_values
from db import get_connection
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")

def require_admin(x_api_key: str = Header(default=None)):
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfiguration")
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="CarletonCourseMap API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://carletoncoursemap.ca", "https://www.carletoncoursemap.ca"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@limiter.limit("60/minute")
def health(request: Request):
    conn = get_connection()
    try:
        conn.close()
    except Exception as e:
        logger.error("Health check failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"status": "200"}

@app.get("/stats")
@limiter.limit("60/minute")
def get_stats(request: Request):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM departments")
        dept_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM programs")
        prog_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM courses")
        course_count = cur.fetchone()[0]
        cur.close()
        return {"departments": dept_count, "programs": prog_count, "courses": course_count}
    except Exception as e:
        logger.error("GET /stats failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@app.get("/departments")
@limiter.limit("60/minute")
def get_departments(request: Request):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT dept_id, name, url FROM departments ORDER BY name")
        rows = cur.fetchall()
        cur.close()
        return [{"dept_id": r[0], "name": r[1], "url": r[2]} for r in rows]
    except Exception as e:
        logger.error("GET /departments failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()



@app.get("/courses")
@limiter.limit("60/minute")
def get_courses(request: Request, search:str=None, dept:int=None):
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT course_code, name, credit, dept_id, prerequisites,
                   year_standing, concurrent_prerequisites, offerings
            FROM courses WHERE 1=1
        """
        params = []
        if search:
            query += " AND (course_code ILIKE %s OR name ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        if dept:
            query += " AND dept_id = %s"
            params.append(dept)
        query += " ORDER BY course_code LIMIT 50"
        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()
        return [
            {
                "code": r[0],
                "name": r[1],
                "credit": float(r[2]) if r[2] else None,
                "dept_id": r[3],
                "prerequisites": r[4],
                "year_standing": r[5],
                "concurrent_prerequisites": r[6] or [],
                "offerings": r[7] or [],
            }
            for r in rows
        ]
    except Exception as e:
        logger.error("GET /courses failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@app.get("/courses/{code}")
@limiter.limit("60/minute")
def get_course(request: Request, code: str):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.course_code, c.name, c.credit, c.description, c.prerequisites,
                   c.year_standing, c.concurrent_prerequisites, c.offerings, d.name
            FROM courses c
            JOIN departments d USING(dept_id)
            WHERE c.course_code = %s
        """, (code.upper(),))
        row = cur.fetchone()
        cur.close()
        if not row:
            raise HTTPException(status_code=404, detail="Course not found")
        return {
            "code": row[0],
            "name": row[1],
            "credit": float(row[2]) if row[2] else None,
            "description": row[3],
            "prerequisites": row[4],
            "year_standing": row[5],
            "concurrent_prerequisites": row[6] or [],
            "offerings": row[7] or [],
            "department": row[8],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("GET /courses/%s failed: %s", code, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()
    
@app.get("/programs")
@limiter.limit("60/minute")
def get_programs(request: Request, dept:int=None):
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = "SELECT program_id, dept_id, degree FROM programs WHERE 1=1"
        params = []
        if dept:
            query += " AND dept_id = %s"
            params.append(dept)
        query += " ORDER BY degree"
        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()
        return [{"program_id": r[0], "dept_id": r[1], "degree": r[2]} for r in rows]
    except Exception as e:
        logger.error("GET /programs failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@app.get("/programs/{program_id}")
@limiter.limit("60/minute")
def get_program(request: Request, program_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT program_id, dept_id, degree, layout_cols, notes FROM programs WHERE program_id = %s", (program_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Program not found")
        cur.execute("""
            SELECT type, courses, credits, description, layout_col, layout_row
            FROM program_requirements
            WHERE program_id = %s
            ORDER BY req_id
        """, (program_id,))
        reqs = cur.fetchall()
        cur.execute("""
            SELECT source_code, target_code, edge_type
            FROM program_edges
            WHERE program_id = %s
            ORDER BY edge_id
        """, (program_id,))
        edges = cur.fetchall()
        cur.close()
        return {
            "program_id": row[0],
            "dept_id": row[1],
            "degree": row[2],
            "layout_cols": row[3],
            "requirements": [
                {
                    "type": r[0],
                    "courses": r[1],
                    "credits": float(r[2]) if r[2] else None,
                    "description": r[3],
                    "layout_col": r[4],
                    "layout_row": r[5],
                } for r in reqs
            ],
            "edges": [
                {"source": e[0], "target": e[1], "type": e[2]}
                for e in edges
            ],
            "notes": row[4] or [],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("GET /programs/%s failed: %s", program_id, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()


class Edge(BaseModel):
    source: str
    target: str
    type: str = "required"

@app.put("/programs/{program_id}/edges")
@limiter.limit("10/minute")
def update_program_edges(request: Request, program_id: int, edges: List[Edge], _: None = Depends(require_admin)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM program_edges WHERE program_id = %s", (program_id,))
        if edges:
            execute_values(cur, """
                INSERT INTO program_edges (program_id, source_code, target_code, edge_type)
                VALUES %s
            """, [(program_id, e.source, e.target, e.type) for e in edges])
        conn.commit()
        cur.close()
        return {"inserted": len(edges)}
    except Exception as e:
        conn.rollback()
        logger.error("PUT /programs/%s/edges failed: %s", program_id, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()


COURSE_CODE_RE = re.compile(r'^[A-Z]{2,4} \d{4}$')

@app.post("/courses/batch")
@limiter.limit("60/minute")
def get_courses_batch(request: Request, codes: List[str]):
    if len(codes) > 100:
        raise HTTPException(status_code=400, detail="Too many course codes — maximum 100 per request")

    cleaned = [c.strip() for c in codes]
    invalid = [c for c in cleaned if not COURSE_CODE_RE.match(c)]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid course code(s): {', '.join(invalid[:10])}",
        )

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT course_code, name, credit, description, prerequisites,
                   year_standing, offerings, concurrent_prerequisites
            FROM courses WHERE course_code = ANY(%s)
        """, (cleaned,))
        rows = cur.fetchall()
        cur.close()
        return [{"code": r[0], "name": r[1], "credit": r[2], "description": r[3],
                 "year_standing": r[5], "offerings": r[6], "prerequisites": r[4],
                 "concurrent_prerequisites": r[7]} for r in rows]
    except Exception as e:
        logger.error("POST /courses/batch failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

