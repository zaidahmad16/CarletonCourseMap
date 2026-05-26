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
    allow_origins=["http://localhost:3000", "https://carletoncoursemap.ca", "https://www.carletoncoursemap.ca", "https://carletoncoursemapfrontend-production.up.railway.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")

def health():
    conn=get_connection()
    conn.close()
    return {"status":"200"}

@app.get("/stats")
def get_stats():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM departments")
    dept_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM programs")
    prog_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM courses")
    course_count = cur.fetchone()[0]
    cur.close()
    conn.close()
    return {"departments": dept_count, "programs": prog_count, "courses": course_count}

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

@app.get("/programs/featured")
def get_featured_programs():
    conn = get_connection()
    cur  = conn.cursor()
    keywords = [
        'Software Engineering',
        'Artificial Intelligence',
        'Computer Science',
        'Business',
        'Psychology',
        'Biology',
    ]
    results  = []
    seen_ids = set()
    for kw in keywords:
        cur.execute("""
            SELECT p.program_id, p.dept_id, p.degree, d.name AS dept_name
            FROM programs p
            JOIN departments d USING(dept_id)
            WHERE p.degree ILIKE %s
            ORDER BY length(p.degree)
            LIMIT 1
        """, (f'%{kw}%',))
        row = cur.fetchone()
        if row and row[0] not in seen_ids:
            seen_ids.add(row[0])
            results.append({
                "program_id": row[0],
                "dept_id":    row[1],
                "degree":     row[2],
                "dept_name":  row[3],
            })
    cur.close()
    conn.close()
    return results[:6]

@app.get("/programs/{program_id}")

def get_programs(program_id: int):

    conn = get_connection()
    try:
        cur = conn.cursor()

        cur.execute("SELECT program_id, dept_id, degree, layout_cols, notes FROM programs WHERE program_id = %s", (program_id,))
        row = cur.fetchone()

        if not row:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Program not found")

        prog_id, dept_id, degree, layout_cols, notes = row

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

        # for concentrations, merge in the base degree requirements so the full
        # program path is visible alongside the concentration-specific courses
        base_reqs  = []
        base_edges = []
        if degree.lower().startswith("concentration in"):
            cur.execute("""
                SELECT program_id, degree FROM programs
                WHERE dept_id = %s
                  AND program_id != %s
                  AND degree ILIKE ANY(ARRAY['%%B.A. Honours%%', '%%B.Sc. Honours%%', '%%B.Eng. Honours%%',
                                             '%%Bachelor%%Honours%%'])
                ORDER BY program_id
                LIMIT 1
            """, (dept_id, program_id))
            base_row = cur.fetchone()
            if base_row:
                base_prog_id = base_row[0]
                # only pull year 1 and 2 courses from the base program — year 3+ are
                # largely electives that the concentration already covers
                cur.execute("""
                    SELECT type, courses, credits, description, layout_col, layout_row
                    FROM program_requirements
                    WHERE program_id = %s
                      AND layout_col < 2
                    ORDER BY req_id
                """, (base_prog_id,))
                base_reqs = cur.fetchall()
                cur.execute("""
                    SELECT source_code, target_code, edge_type
                    FROM program_edges
                    WHERE program_id = %s
                    ORDER BY edge_id
                """, (base_prog_id,))
                base_edges = cur.fetchall()

        cur.close()
    finally:
        conn.close()

    # concentration courses come first so their layout positions take priority;
    # base program courses fill in the remaining slots
    all_reqs  = list(reqs) + [r for r in base_reqs if r not in reqs]
    all_edges = list(edges) + [e for e in base_edges if e not in edges]

    return {
        "program_id": prog_id,
        "dept_id": dept_id,
        "degree": degree,
        "layout_cols": layout_cols,
        "requirements": [
            {
                "type": r[0],
                "courses": r[1],
                "credits": float(r[2]) if r[2] else None,
                "description": r[3],
                "layout_col": r[4],
                "layout_row": r[5],
            } for r in all_reqs
        ],
        "edges": [
            {"source": e[0], "target": e[1], "type": e[2]}
            for e in all_edges
        ],
        "notes": notes or [],
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
    return [{"code": r[0], "name": r[1], "credit": r[2], "description": r[3],
             "year_standing": r[5], "offerings": r[6], "prerequisites": r[4],
             "concurrent_prerequisites": r[7]} for r in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

