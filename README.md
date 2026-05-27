# CarletonCourseMap

Prerequisite maps for every Carleton undergrad program. Pick a degree, see four years of courses laid out as a graph — what you need, when, and what unlocks what.

**Live:** https://carletoncoursemap.ca/ | **GitHub:** https://github.com/zaidahmad16/CarletonCourseMap

Used by 500+ Carleton students.

---

## What it does

- Prerequisite chains drawn from the actual 2026-2027 calendar
- Courses arranged by year and term, not just listed
- Elective and breadth slots marked so you can see where you have flexibility
- Click any course for the description, credit weight, term offerings, and prerequisites
- Professor info for Fall 2026 / Winter 2027, with RMP ratings, difficulty scores, and recent student reviews
- 240+ programs, including streams and concentrations

No account needed. Just open it.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), ReactFlow, deployed on Vercel |
| Backend | FastAPI, deployed on Fly.io |
| Database | PostgreSQL on Neon |
| Scraper | Python -- Carleton undergraduate calendar + Carleton Central timetable |
| Professor ratings | `ratemyprofessors-client` via a Next.js API route |

---

## How the data gets in

One JSON file per department, built by hand from the undergraduate calendar. Each one lists programs, requirements, credit weights, and layout positions for the graph. A scraper pulls Fall 2026 / Winter 2027 instructor assignments from Carleton Central and writes them to the database. Seeding scripts push everything into Neon.

---

## Coming soon

Elective recommendations. When your program has a free or breadth elective slot, the site will suggest courses that actually fit, like "any MATH 2000-level or above" resolved into a real list with ratings and prereqs attached.

---

## Not affiliated with Carleton University

Student project. Data is from the public 2026-2027 undergraduate calendar. Verify your actual requirements with an advisor and the official calendar at https://calendar.carleton.ca.

---
