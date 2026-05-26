# CarletonCourseMap

An interactive course map that helps Carleton University students visualize their program requirements and course prerequisites. See your entire four-year program at a glance—understand which courses block what, which semesters are heavy, and how your choices cascade.

**Live site:** https://www.carletoncoursemap.ca

---

## Why This Exists

Planning a degree is harder than it should be. Carleton's calendar lists requirements, but doesn't show the structure. This tool does.

Students shouldn't have to manually trace prerequisites across departments. Advisors shouldn't repeat the same explanations. Course dependencies should be visual, not mental math.

CarletonCourseMap puts the actual course structure in front of you—50+ programs, all visualized the same way.

---

## What You Get

- **See your entire program** - All four years, all requirements, in one interactive map
- **Understand prerequisites** - Click a course to see what you need before taking it
- **Plan ahead** - Know which semesters will be heavy and which courses unlock what
- **Compare programs** - Switch between majors to see how requirements differ
- **Browse 50+ programs** - Computer Science, Biology, Law, Engineering, and more

---

## How It Works

Pick a program. The map shows every course requirement, organized by year and semester. Gray lines connect courses to their prerequisites. That's it—no login, no tracking, no setup. Just open and explore.

---

## Technical Stack

- **Frontend:** React 19 with Next.js, deployed on Railway
- **Backend:** FastAPI with rate limiting, input validation, and API key protection
- **Data:** PostgreSQL on Neon, handling 50+ program structures and 10,000+ courses
- **Visualization:** ReactFlow + Dagre for interactive course dependency diagrams
- **Scraper:** Python with parsel (XPath + CSS) — scrapes the Carleton undergraduate calendar and the Registrar's class schedule for Fall 2026 / Winter 2027 offerings

The backend includes production-grade security: rate limiting, SQL injection protection, CORS restrictions, API authentication, and comprehensive error handling.

---

## Status

Live and in active use. Security and performance are continuously monitored.

---

## License

MIT