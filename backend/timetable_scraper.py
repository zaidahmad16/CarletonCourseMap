"""
Scrapes Carleton Central timetable for instructor names per course per term.
Populates the course_instructors table.

Usage: python3 timetable_scraper.py
"""

import os, re, time, requests
from psycopg2.extras import execute_values
from db import get_connection
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://central.carleton.ca/prod"
TERMS = [
    ("202630", "Fall 2026"),
    ("202710", "Winter 2027"),
]

# pulls all undergrad subject codes from the timetable search page
def get_subject_codes(session: requests.Session, term_code: str, session_id: str) -> list[str]:
    resp = session.post(f"{BASE_URL}/bwysched.p_search_fields", data={
        "wsea_code": "EXT",
        "term_code": term_code,
        "session_id": session_id,
    })
    return re.findall(r'<option value="([A-Z]{2,5})"', resp.text)


def get_session_id(session: requests.Session, term_code: str) -> str:
    resp = session.get(f"{BASE_URL}/bwysched.p_select_term?wsea_code=EXT")
    sid = re.search(r'session_id" value="(\d+)"', resp.text)
    if not sid:
        raise RuntimeError("Could not get session_id")
    session.post(f"{BASE_URL}/bwysched.p_search_fields", data={
        "wsea_code": "EXT",
        "term_code": term_code,
        "session_id": sid.group(1),
    })
    return sid.group(1)


INVALID_INSTRUCTOR_NAMES = frozenset({
    'tba', 'staff', 'lecture', 'tutorial', 'lab', 'seminar', 'yes', 'no', 'open', 'closed'
})


def parse_instructors(html: str, subj: str, term_label: str) -> list[tuple]:
    results = []
    seen = set()
    for row in re.split(r'<tr\b', html):
        code_m = re.search(rf'{re.escape(subj)}\s+(\d{{4}}[A-Z]?)</font>', row)
        type_m = re.search(r'<td[^>]*>(Lecture|Seminar)</td>', row)
        if not code_m or not type_m:
            continue
        # instructor name sits in the last plain-text td with no link inside it
        plain_tds = re.findall(r'<td[^>]*>\s*([A-Za-z][^<\n]{2,50}?)\s*</td>', row)
        if not plain_tds:
            continue
        instructor = plain_tds[-1].strip()
        if not instructor or '&nbsp;' in instructor or instructor.lower() in INVALID_INSTRUCTOR_NAMES:
            continue
        code = f"{subj} {code_m.group(1)}"
        key = (code, term_label, instructor)
        if key not in seen:
            seen.add(key)
            results.append(key)
    return results


def scrape_subject(session: requests.Session, term_code: str, term_label: str,
                   session_id: str, subj: str) -> list[tuple]:
    # requests drops duplicate keys in dicts, so we use a list of tuples instead
    payload = [
        ("wsea_code", "EXT"), ("term_code", term_code), ("session_id", session_id),
        ("ws_numb", ""), ("sel_aud", "dummy"), ("sel_subj", "dummy"),
        ("sel_camp", "dummy"), ("sel_sess", "dummy"), ("sel_attr", "dummy"),
        ("sel_levl", "dummy"), ("sel_schd", "dummy"), ("sel_insm", "dummy"),
        ("sel_link", "dummy"), ("sel_wait", "dummy"), ("sel_day", "dummy"),
        ("sel_begin_hh", "dummy"), ("sel_begin_mi", "dummy"),
        ("sel_begin_am_pm", "dummy"), ("sel_end_hh", "dummy"),
        ("sel_end_mi", "dummy"), ("sel_end_am_pm", "dummy"),
        ("sel_instruct", "dummy"), ("sel_special", "dummy"),
        ("sel_resd", "dummy"), ("sel_breadth", "dummy"),
        ("sel_subj", subj), ("sel_number", ""),
        ("sel_day", "m"), ("sel_day", "t"), ("sel_day", "w"),
        ("sel_day", "r"), ("sel_day", "f"), ("sel_day", "s"),
        ("sel_begin_hh", "0"), ("sel_begin_mi", "0"), ("sel_begin_am_pm", "a"),
        ("sel_end_hh", "23"), ("sel_end_mi", "59"), ("sel_end_am_pm", "p"),
        ("sel_levl", "UG"),
    ]
    resp = session.post(f"{BASE_URL}/bwysched.p_course_search", data=payload)
    return parse_instructors(resp.text, subj, term_label)


def create_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS course_instructors (
                id SERIAL PRIMARY KEY,
                course_code TEXT NOT NULL,
                term TEXT NOT NULL,
                instructor_name TEXT NOT NULL,
                UNIQUE(course_code, term, instructor_name)
            )
        """)
    conn.commit()


def upsert_rows(conn, rows: list[tuple]):
    if not rows:
        return
    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO course_instructors (course_code, term, instructor_name)
            VALUES %s
            ON CONFLICT (course_code, term, instructor_name) DO NOTHING
        """, rows)
    conn.commit()


def main():
    conn = get_connection()
    create_table(conn)

    http = requests.Session()
    http.headers.update({"User-Agent": "CarletonCourseMap/1.0 (student project)"})

    total = 0
    for term_code, term_label in TERMS:
        print(f"\n=== {term_label} ===")
        session_id = get_session_id(http, term_code)
        subjects = get_subject_codes(http, term_code, session_id)
        print(f"Found {len(subjects)} subjects")

        for subj in subjects:
            try:
                rows = scrape_subject(http, term_code, term_label, session_id, subj)
                if rows:
                    upsert_rows(conn, rows)
                    print(f"  {subj}: {len(rows)} sections")
                    total += len(rows)
                time.sleep(0.4)  # don't hammer Carleton Central
            except Exception as e:
                print(f"  {subj}: ERROR {e}")

    conn.close()
    print(f"\nDone. {total} total rows inserted.")


if __name__ == "__main__":
    main()
