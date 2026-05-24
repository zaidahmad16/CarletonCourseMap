import sys, os
DATABASE_URL = os.getenv("DATABASE_URL")
from fastapi.middleware.cors import CORSMiddleware
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from psycopg2.extras import execute_values
from db import get_connection

app = FastAPI(title="CarletonCourseMap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://carletoncoursemap.ca", "https://www.carletoncoursemap.ca"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")

def health():
    conn=get_connection()
    conn.close()
    return {"status":"200"}

@app.get("/departments")
def get_departments():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT dept_id, name, url FROM departments ORDER BY name")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"dept_id": r[0], "name": r[1], "url": r[2]} for r in rows]



@app.get("/courses")

def get_courses(search:str=None,dept:int=None):
    
    conn=get_connection()
    cur=conn.cursor()
    
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
    conn.close()
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

@app.get("/courses/{code}")

def get_course(code: str):
    conn=get_connection()
    cur=conn.cursor()
    cur.execute("""
        SELECT c.course_code, c.name, c.credit, c.description, c.prerequisites,
               c.year_standing, c.concurrent_prerequisites, c.offerings, d.name
        FROM courses c
        JOIN departments d USING(dept_id)
        WHERE c.course_code = %s
    """, (code.upper(),))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="course not found")
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
    
@app.get("/programs")

def get_programs(dept:int=None):
    conn=get_connection()
    cur=conn.cursor()
    
    query="SELECT program_id, dept_id, degree FROM programs WHERE 1=1"
    params=[]
    
    if dept:
        query+=" AND dept_id = %s"
        params.append(dept)
        
    query+=" ORDER BY degree"
    
    cur.execute(query,params)
    rows=cur.fetchall()
    cur.close()
    conn.close()
    return [{"program_id": r[0], "dept_id": r[1], "degree": r[2]} for r in rows]

@app.get("/programs/{program_id}")

def get_programs(program_id: int):
    
    conn=get_connection()
    cur=conn.cursor()
    
    cur.execute("SELECT program_id, dept_id, degree, layout_cols FROM programs WHERE program_id = %s", (program_id,))
    row = cur.fetchone()

    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404,detail="Program not found")

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
    conn.close()

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
    }


class Edge(BaseModel):
    source: str
    target: str
    type: str = "required"

@app.put("/programs/{program_id}/edges")
def update_program_edges(program_id: int, edges: List[Edge]):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM program_edges WHERE program_id = %s", (program_id,))
    if edges:
        execute_values(cur, """
            INSERT INTO program_edges (program_id, source_code, target_code, edge_type)
            VALUES %s
        """, [(program_id, e.source, e.target, e.type) for e in edges])
    conn.commit()
    cur.close()
    conn.close()
    return {"inserted": len(edges)}


@app.post("/courses/batch")
def get_courses_batch(codes: List[str]):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT course_code, name, credit, description, prerequisites,
               year_standing, offerings, concurrent_prerequisites
        FROM courses WHERE course_code = ANY(%s)
    """, (codes,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"code": r[0], "name": r[1], "credit": r[2], "year_standing": r[5],
             "offerings": r[6], "prerequisites": r[4], "concurrent_prerequisites": r[7]} for r in rows]

