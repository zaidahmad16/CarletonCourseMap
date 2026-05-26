import html
import json
import os
import re
import time
import requests
from parsel import Selector

_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")

PROGRAMS = {
    "African Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/africanstudies/",
    "Anthropology": "https://calendar.carleton.ca/undergrad/undergradprograms/anthropology/",
    "Applied Linguistics and Discourse Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/appliedlinguisticsanddiscoursestudies/",
    "Architectural Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/architecturalstudies/",
    "Art History": "https://calendar.carleton.ca/undergrad/undergradprograms/arthistory/",
    "History and Theory of Architecture": "https://calendar.carleton.ca/undergrad/undergradprograms/historyandtheoryofarchitecture/",
    "Biochemistry": "https://calendar.carleton.ca/undergrad/undergradprograms/biochemistry/",
    "Biology": "https://calendar.carleton.ca/undergrad/undergradprograms/biology/",
    "Biotechnology": "https://calendar.carleton.ca/undergrad/undergradprograms/biotechnology/",
    "Business": "https://calendar.carleton.ca/undergrad/undergradprograms/business/",
    "Chemistry": "https://calendar.carleton.ca/undergrad/undergradprograms/chemistry/",
    "Childhood and Youth Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/childhoodandyouthstudies/",
    "Cognitive Science": "https://calendar.carleton.ca/undergrad/undergradprograms/cognitivescience/",
    "Communication and Media Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/communicationstudies/",
    "Computer Science": "https://calendar.carleton.ca/undergrad/undergradprograms/computerscience/",
    "Criminology and Criminal Justice": "https://calendar.carleton.ca/undergrad/undergradprograms/criminologyandcriminaljustice/",
    "Cybersecurity": "https://calendar.carleton.ca/undergrad/undergradprograms/computerscience/#Cybersecurity__BCyber_Honours",
    "Data Science": "https://calendar.carleton.ca/undergrad/undergradprograms/datascience/",
    "Earth Sciences": "https://calendar.carleton.ca/undergrad/undergradprograms/earthsciences/",
    "Economics": "https://calendar.carleton.ca/undergrad/undergradprograms/economics/",
    "Engineering": "https://calendar.carleton.ca/undergrad/undergradprograms/engineering/",
    "English": "https://calendar.carleton.ca/undergrad/undergradprograms/english/",
    "Environmental Science": "https://calendar.carleton.ca/undergrad/undergradprograms/environmentalscience/",
    "Environmental Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/environmentalstudies/",
    "European and Russian Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/europeanandrussianstudies/",
    "Film Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/filmstudies/",
    "Food Science": "https://calendar.carleton.ca/undergrad/undergradprograms/foodscience/",
    "French": "https://calendar.carleton.ca/undergrad/undergradprograms/french/",
    "Geography": "https://calendar.carleton.ca/undergrad/undergradprograms/geography/",
    "Geomatics": "https://calendar.carleton.ca/undergrad/undergradprograms/geomatics/",
    "Global and International Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/gins/",
    "Health Sciences": "https://calendar.carleton.ca/undergrad/undergradprograms/healthsciences/",
    "History": "https://calendar.carleton.ca/undergrad/undergradprograms/history/",
    "Humanities": "https://calendar.carleton.ca/undergrad/undergradprograms/humanities/",
    "Indigenous Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/indigenousstudies/",
    "Industrial Design": "https://calendar.carleton.ca/undergrad/undergradprograms/industrialdesign/",
    "Information Technology": "https://calendar.carleton.ca/undergrad/undergradprograms/informationtechnology/",
    "International Business": "https://calendar.carleton.ca/undergrad/undergradprograms/business/#Bachelor_of_International_Business__Honours",
    "Journalism": "https://calendar.carleton.ca/undergrad/undergradprograms/journalism/",
    "Journalism and Humanities": "https://calendar.carleton.ca/undergrad/undergradprograms/journalismandhumanities/",
    "Law": "https://calendar.carleton.ca/undergrad/undergradprograms/law/",
    "Linguistics (B.A.)": "https://calendar.carleton.ca/undergrad/undergradprograms/linguistics-ba/",
    "Linguistics (B.Sc.)": "https://calendar.carleton.ca/undergrad/undergradprograms/linguistics-bsc/",
    "Mathematics and Statistics": "https://calendar.carleton.ca/undergrad/undergradprograms/mathematicsandstatistics/",
    "Media Production and Design": "https://calendar.carleton.ca/undergrad/undergradprograms/mediaproductionanddesign/",
    "Music": "https://calendar.carleton.ca/undergrad/undergradprograms/music/",
    "Nanoscience": "https://calendar.carleton.ca/undergrad/undergradprograms/nanoscience/",
    "Neuroscience": "https://calendar.carleton.ca/undergrad/undergradprograms/neuroscience/",
    "Nursing": "https://calendar.carleton.ca/undergrad/undergradprograms/nursing/",
    "Philosophy": "https://calendar.carleton.ca/undergrad/undergradprograms/philosophy/",
    "Physics": "https://calendar.carleton.ca/undergrad/undergradprograms/physics/",
    "Political Science": "https://calendar.carleton.ca/undergrad/undergradprograms/politicalscience/",
    "Psychology": "https://calendar.carleton.ca/undergrad/undergradprograms/psychology/",
    "Social Work": "https://calendar.carleton.ca/undergrad/undergradprograms/socialwork/",
    "Sociology": "https://calendar.carleton.ca/undergrad/undergradprograms/sociology/",
}

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; CarletonCourseMapBot/1.0)"}

COURSE_RE       = re.compile(r'\b([A-Z]{3,4}\s+\d{4}[A-Z]?)\b')
CREDIT_RE       = re.compile(r'(\d+\.?\d*)\s+credit', re.IGNORECASE)
CREDIT_BRACKET  = re.compile(r'\[([0-9.]+)\]')
NUMBERED_PREFIX = re.compile(r'^\s*[A-Z0-9]+\.\s+')
CHOOSE_RE       = re.compile(
    r'choose|select|one of|from the following|complete\s+\d|credits?\s+from|at least\s+\d',
    re.IGNORECASE,
)


def _clean(text):
    return html.unescape(text.replace("\xa0", " ")).strip()


def _row_classes(row):
    return set(row.attrib.get("class", "").split())


def _credits_from_text(text):
    m = CREDIT_RE.search(text)
    return float(m.group(1)) if m else None


# ── Course catalogue scraping ─────────────────────────────────────────────────

def scrape_program(name, url):
    base_url = url.split("#")[0]
    try:
        response = requests.get(base_url, headers=HEADERS, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"  ERROR fetching {name}: {e}")
        return {"name": name, "url": url, "courses": [], "error": str(e)}

    sel = Selector(text=response.text)
    courses = []

    for block in sel.css(".courseblock"):
        code = _clean(block.css(".courseblockcode::text").get(""))
        if not code:
            continue

        title_sel = block.css(".courseblocktitle")

        # course name = text node(s) after the first <br> inside the title
        title_html = title_sel.get("")
        after_br = title_html.split("<br>", 1)[-1] if "<br>" in title_html else ""
        course_name = _clean(re.sub(r"<[^>]+>", " ", after_br))

        credit_m = re.search(r"\[([0-9.]+)\s+credit", title_sel.css("::text").get(""))
        credit = credit_m.group(1) if credit_m else ""

        # description = text after <strong> and before first <div>
        block_html = block.get() or ""
        desc = ""
        m = re.search(r"</strong>(.*?)(?:<div|$)", block_html, re.DOTALL)
        if m:
            desc = _clean(re.sub(r"<[^>]+>", " ", m.group(1)))

        prerequisites = ""
        offerings = []
        year_standing = None
        concurrent_prerequisites = []

        additional = block.css(".coursedescadditional")
        if additional:
            # split on <br> tags to get individual lines
            add_html = additional.get("")
            raw_lines = re.split(r"<br\s*/?>", add_html, flags=re.IGNORECASE)
            for raw in raw_lines:
                line = _clean(re.sub(r"<[^>]+>", " ", raw))
                line = re.sub(r"\s{2,}", " ", line).strip()
                if not line:
                    continue
                ll = line.lower()

                if ll.startswith("prerequisite"):
                    prerequisites = re.sub(r"^prerequisite\(s\):\s*", "", line, flags=re.IGNORECASE).strip()
                elif re.match(r"(also\s+)?offered", ll):
                    term_text = re.sub(r"^(also\s+)?offered[\w\s]*:\s*", "", line, flags=re.IGNORECASE)
                    for token in re.split(r"[,/;]", term_text):
                        token = token.strip().lower()
                        if "fall" in token:
                            offerings.append("fall")
                        if "winter" in token:
                            offerings.append("winter")
                        if "summer" in token:
                            offerings.append("summer")

        if prerequisites:
            ys = re.search(r"\b(second|third|fourth|2nd|3rd|4th)[- ]year\s+standing", prerequisites, re.IGNORECASE)
            if ys:
                word = ys.group(1).lower()
                year_standing = {"second": 2, "2nd": 2, "third": 3, "3rd": 3, "fourth": 4, "4th": 4}[word]

            concurrent_raw = re.findall(
                r'([A-Z]{3,4}\s+\d{4}[A-Z]?)\s+(?:may\s+be\s+taken\s+concurrently|concurrently)',
                prerequisites,
            ) + re.findall(
                r'concurrent(?:ly)?\s+with\s+((?:[A-Z]{3,4}\s+\d{4}[A-Z]?(?:\s*(?:and|or|,)\s*)?)+)',
                prerequisites,
            )
            for item in concurrent_raw:
                concurrent_prerequisites.extend(COURSE_RE.findall(item))
            concurrent_prerequisites = list(dict.fromkeys(concurrent_prerequisites))

        courses.append({
            "code": code,
            "name": course_name,
            "credit": credit,
            "description": desc,
            "prerequisites": prerequisites,
            "offerings": offerings,
            "year_standing": year_standing,
            "concurrent_prerequisites": concurrent_prerequisites,
        })

    free_electives = scrape_free_electives(sel)
    programs = scrape_program_requirements(sel)

    print(f"  {name}: {len(courses)} courses, {len(free_electives)} free elective entries, {len(programs)} degree/stream programs")
    return {"name": name, "url": url, "courses": courses, "free_electives": free_electives, "programs": programs}


# ── Program requirements scraping ─────────────────────────────────────────────

def _parse_sc_courselist(table_sel):
    """Parse a single sc_courselist table (parsel Selector) into requirement dicts."""
    requirements = []
    section_type = "required"
    current_type  = "required"

    choose_buffer  = []
    choose_credits = None
    choose_desc    = ""

    def flush_choose():
        nonlocal current_type
        if choose_buffer:
            requirements.append({
                "type": "choose",
                "courses": list(choose_buffer),
                "credits": choose_credits,
                "description": choose_desc,
            })
        choose_buffer.clear()
        current_type = section_type

    for row in table_sel.css("tr"):
        classes = _row_classes(row)

        if "listsum" in classes:
            continue
        if not row.css("td"):
            continue

        # ── Section header ────────────────────────────────────────────────────
        if "areaheader" in classes:
            flush_choose()
            text  = _clean(" ".join(row.css("::text").getall()))
            lower = text.lower()

            cred = _credits_from_text(text)

            if CHOOSE_RE.search(lower):
                section_type = current_type = "choose"
                choose_credits = cred
                choose_desc    = NUMBERED_PREFIX.sub("", text).strip()
            elif "elective" in lower:
                section_type = current_type = "elective"
            else:
                section_type = current_type = "required"
            continue

        # ── Credit value from hourscol ────────────────────────────────────────
        credits_text = row.css("td.hourscol::text").get("").strip()
        try:
            credits = float(credits_text)
        except ValueError:
            credits = None

        code_td = row.css("td.codecol")

        # ── Row with a course code cell ───────────────────────────────────────
        if code_td:
            code_text = _clean(" ".join(code_td.css("::text").getall()))
            courses   = COURSE_RE.findall(code_text)

            # title td = first td that isn't codecol or hourscol
            title_td = row.xpath(
                'td[not(contains(@class,"codecol")) and not(contains(@class,"hourscol"))][1]'
            )
            description = _clean(" ".join(title_td.css("::text").getall())) if title_td else ""

            # credit may be encoded as [0.5] in the code cell
            m = CREDIT_BRACKET.search(code_text)
            if m:
                try:
                    credits = float(m.group(1))
                except ValueError:
                    pass

            if not courses:
                continue

            row_type = "choose" if "orclass" in classes else current_type

            if row_type == "choose":
                choose_buffer.extend(courses)
            else:
                flush_choose()
                requirements.append({
                    "type": row_type,
                    "courses": courses,
                    "credits": credits,
                    "description": description,
                })

        # ── Description-only row (no codecol) ────────────────────────────────
        else:
            desc_td = row.xpath('td[not(contains(@class,"hourscol"))][1]')
            text = _clean(" ".join(desc_td.css("::text").getall())) if desc_td else ""

            if not text:
                continue

            lower = text.lower()
            is_choose_hdr = bool(CHOOSE_RE.search(lower) or re.search(r"\bchoose\b|\bselect\b", lower))

            # pure section sub-label ending with ":" — flush and skip
            if text.strip().endswith(":") and not is_choose_hdr:
                flush_choose()
                continue

            courses    = COURSE_RE.findall(text)

            # skip pure annotation rows — but not choose sub-headers or rows with embedded
            # course codes inside an active choose/elective section
            if row.css(".courselistcomment") and not row.css("td.areaheader") \
                    and not is_choose_hdr and not (current_type != "required" and courses):
                continue

            if credits is None:
                credits = _credits_from_text(lower)
            clean_text = NUMBERED_PREFIX.sub("", text).strip()

            if is_choose_hdr:
                if courses:
                    choose_buffer.extend(courses)
                else:
                    # description-only choose sub-header ("1.0 credit from:") —
                    # flush current block and start a new one
                    flush_choose()
                    current_type   = "choose"
                    choose_credits = credits
                    choose_desc    = clean_text
            elif current_type != "required" and courses:
                # description row that embeds course codes inside a choose/elective section
                choose_buffer.extend(courses)
            else:
                flush_choose()
                row_type = "elective" if "elective" in lower else "elective"
                requirements.append({
                    "type": row_type,
                    "courses": courses,
                    "credits": credits,
                    "description": clean_text,
                })

    flush_choose()
    return requirements


def scrape_program_requirements(sel):
    """Extract structured degree/stream requirements from all sc_courselist tables."""
    programs     = []
    degree_index = {}

    for table in sel.css("table.sc_courselist"):
        # Nearest preceding plain h3/h4 (no toggle/red class) = degree heading.
        # preceding:: axis is in document order so last element = nearest.
        degree = ""
        headings = table.xpath(
            "preceding::*[self::h3 or self::h4]"
            "[not(contains(@class,'toggle'))]"
            "[not(contains(@class,'red'))]"
        )
        for heading in reversed(list(headings)):
            text = _clean(" ".join(heading.css("::text").getall()))
            if text:
                degree = text
                break

        if not degree:
            continue

        # skip pure note tables (courselistcomment first row, no areaheader, no course rows)
        first_row = table.css("tr:first-child")
        if first_row.css(".courselistcomment") and not table.css("tr.areaheader") and not table.css("td.codecol"):
            continue

        requirements = _parse_sc_courselist(table)
        if not requirements:
            continue

        if degree in degree_index:
            programs[degree_index[degree]]["requirements"].extend(requirements)
        else:
            degree_index[degree] = len(programs)
            programs.append({"degree": degree, "requirements": requirements})

    return programs


def scrape_free_electives(sel):
    entries = []

    for h3 in sel.css("h3.toggle"):
        if "free elective" not in h3.css("::text").get("").lower():
            continue
        desc_parts = []
        for sib in h3.xpath("following-sibling::*"):
            if sib.root.tag in ("h3", "h2", "h1"):
                break
            t = _clean(" ".join(sib.css("::text").getall()))
            if t:
                desc_parts.append(t)
        if desc_parts:
            text = " ".join(desc_parts)
            if not any(e["text"] == text for e in entries):
                entries.append({"type": "definition", "text": text})

    seen = set()
    for row in sel.css("table.sc_courselist tr"):
        text = _clean(" ".join(row.css("::text").getall()))
        if "free elective" not in text.lower():
            continue

        credits = row.css("td.hourscol::text").get("").strip()

        # nearest preceding h3 with text
        degree = ""
        for h in row.xpath("preceding::h3[1]"):
            degree = _clean(" ".join(h.css("::text").getall()))

        key = (degree, text)
        if key in seen:
            continue
        seen.add(key)

        entries.append({
            "type": "requirement",
            "degree": degree,
            "credits": credits,
            "text": text,
        })

    return entries


# ── Offerings scraping (class schedule) ──────────────────────────────────────

_SCHEDULE_BASE  = "https://central.carleton.ca/prod/bwckctlg.p_disp_listcrse"
_COURSE_CODE_RE = re.compile(r"\b([A-Z]{2,4} \d{4}[A-Z]?)\b")


def _get_term_codes():
    resp = requests.get(
        "https://central.carleton.ca/prod/bwysched.p_select_term?wsea_code=EXT",
        headers=HEADERS, timeout=15,
    )
    sel = Selector(text=resp.text)
    fall_code = winter_code = None
    for opt in sel.css("select[name=term_code] option"):
        val  = opt.attrib.get("value", "")
        text = opt.css("::text").get("").lower()
        if not val:
            continue
        if "fall" in text and fall_code is None:
            fall_code = val
        elif "winter" in text and winter_code is None:
            winter_code = val
    return fall_code, winter_code


def _fetch_subject_offerings(term_code, subject):
    try:
        resp = requests.get(
            _SCHEDULE_BASE,
            params={"term_in": term_code, "subj_in": subject, "crse_in": "%", "schd_in": "%"},
            headers=HEADERS,
            timeout=30,
        )
        resp.raise_for_status()
    except requests.RequestException:
        return set()
    sel   = Selector(text=resp.text)
    codes = set()
    for th in sel.css("th.ddtitle"):
        m = _COURSE_CODE_RE.search(th.css("::text").get(""))
        if m:
            codes.add(m.group(1))
    return codes


def scrape_offerings(all_programs):
    subjects = set()
    for program in all_programs:
        for course in program.get("courses", []):
            m = _COURSE_CODE_RE.match(course.get("code", ""))
            if m:
                subjects.add(m.group(1).split()[0])

    fall_code, winter_code = _get_term_codes()
    if not fall_code or not winter_code:
        print("  WARNING: could not determine fall/winter term codes; skipping offerings")
        return {}

    print(f"  Offerings: fall={fall_code}, winter={winter_code}, {len(subjects)} subjects to fetch")

    fall_offered:   set = set()
    winter_offered: set = set()

    for i, subj in enumerate(sorted(subjects), 1):
        fall_offered   |= _fetch_subject_offerings(fall_code, subj)
        winter_offered |= _fetch_subject_offerings(winter_code, subj)
        if i % 10 == 0:
            print(f"    {i}/{len(subjects)} subjects done")
        time.sleep(0.3)

    offerings: dict = {}
    for code in fall_offered | winter_offered:
        terms = []
        if code in fall_offered:
            terms.append("fall")
        if code in winter_offered:
            terms.append("winter")
        offerings[code] = terms

    print(f"  Offerings fetched: {len(offerings)} courses with fall/winter data")
    return offerings


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    os.makedirs(_DATA_DIR, exist_ok=True)

    # For departments that share a URL with another dept, keep only matching programs
    _PROGRAM_KEEP = {
        "Cybersecurity":        lambda d: "cybersecurity" in d.lower(),
        "International Business": lambda d: "international business" in d.lower(),
    }

    results = []
    for name, url in PROGRAMS.items():
        print(f"Scraping: {name}")
        data = scrape_program(name, url)
        if name in _PROGRAM_KEEP:
            keep = _PROGRAM_KEEP[name]
            data["programs"] = [p for p in data.get("programs", []) if keep(p.get("degree", ""))]
        results.append(data)

        slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        with open(os.path.join(_DATA_DIR, f"{slug}.json"), "w") as f:
            json.dump(data, f, indent=2)

        time.sleep(0.5)

    print("\nFetching semester offerings from class schedule...")
    offerings = scrape_offerings(results)

    for program in results:
        for course in program.get("courses", []):
            code = course.get("code", "")
            course["offerings"] = offerings.get(code, [])

    for program in results:
        name = program["name"]
        slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        with open(os.path.join(_DATA_DIR, f"{slug}.json"), "w") as f:
            json.dump(program, f, indent=2)

    with open(os.path.join(_DATA_DIR, "courses.json"), "w") as f:
        json.dump(results, f, indent=2)

    total          = sum(len(p["courses"]) for p in results)
    with_offerings = sum(1 for p in results for c in p["courses"] if c.get("offerings"))
    print(f"\nDone. {total} courses across {len(results)} programs saved to data/")
    print(f"      {with_offerings} courses have fall/winter offerings data")


if __name__ == "__main__":
    main()
