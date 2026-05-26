import json
import os
import re
import time
import requests
from bs4 import BeautifulSoup, NavigableString

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
    "Greek and Roman Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/greekandromanstudies/",
    "Health Sciences": "https://calendar.carleton.ca/undergrad/undergradprograms/healthsciences/",
    "History": "https://calendar.carleton.ca/undergrad/undergradprograms/history/",
    "Human Rights and Social Justice": "https://calendar.carleton.ca/undergrad/undergradprograms/humanrights/",
    "Humanities": "https://calendar.carleton.ca/undergrad/undergradprograms/humanities/",
    "Indigenous Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/indigenousstudies/",
    "Industrial Design": "https://calendar.carleton.ca/undergrad/undergradprograms/industrialdesign/",
    "Information Technology": "https://calendar.carleton.ca/undergrad/undergradprograms/informationtechnology/",
    "Integrated Science": "https://calendar.carleton.ca/undergrad/undergradprograms/integratedscience/",
    "International Business": "https://calendar.carleton.ca/undergrad/undergradprograms/business/#Bachelor_of_International_Business__Honours",
    "Journalism": "https://calendar.carleton.ca/undergrad/undergradprograms/journalism/",
    "Journalism and Humanities": "https://calendar.carleton.ca/undergrad/undergradprograms/journalismandhumanities/",
    "Latin American and Caribbean Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/latinamericanandcaribbeanstudies/",
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
    "Public Affairs and Policy Management": "https://calendar.carleton.ca/undergrad/undergradprograms/publicaffairsandpolicymanagement/",
    "Religion": "https://calendar.carleton.ca/undergrad/undergradprograms/religion/",
    "Social Work": "https://calendar.carleton.ca/undergrad/undergradprograms/socialwork/",
    "Sociology": "https://calendar.carleton.ca/undergrad/undergradprograms/sociology/",
    "Women's and Gender Studies": "https://calendar.carleton.ca/undergrad/undergradprograms/womensandgenderstudies/",
}

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; CarletonCourseMapBot/1.0)"}


def _br_lines(tag):
    """Split a tag's content into text lines using <br/> as the delimiter."""
    lines = []
    current = []
    for child in tag.children:
        if child.name == "br":
            text = " ".join(current).replace("\xa0", " ").strip()
            if text:
                lines.append(text)
            current = []
        elif hasattr(child, "get_text"):
            t = child.get_text(" ", strip=True).replace("\xa0", " ")
            if t:
                current.append(t)
        elif isinstance(child, NavigableString):
            t = child.strip().replace("\xa0", " ")
            if t:
                current.append(t)
    if current:
        text = " ".join(current).replace("\xa0", " ").strip()
        if text:
            lines.append(text)
    return lines


def scrape_program(name, url):
    base_url = url.split("#")[0]
    try:
        response = requests.get(base_url, headers=HEADERS, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"  ERROR fetching {name}: {e}")
        return {"name": name, "url": url, "courses": [], "error": str(e)}

    soup = BeautifulSoup(response.text, "html.parser")
    courses = []

    for block in soup.select(".courseblock"):
        code_tag = block.select_one(".courseblockcode")
        title_tag = block.select_one(".courseblocktitle")

        if not code_tag or not title_tag:
            continue

        code = code_tag.get_text(strip=True).replace("\xa0", " ")

        # course name is the text node after <br/> inside the title span
        name_parts = []
        after_br = False
        for child in title_tag.children:
            if child.name == "br":
                after_br = True
            elif after_br and isinstance(child, NavigableString):
                text = child.strip()
                if text:
                    name_parts.append(text)
        course_name = " ".join(name_parts)

        # credit is the bracketed value in the title e.g. [0.5 credit]
        credit_match = re.search(r"\[([0-9.]+)\s+credit", title_tag.get_text())
        credit = credit_match.group(1) if credit_match else ""

        # description is the bare text node inside .courseblock after the <strong>
        desc_parts = []
        after_strong = False
        for child in block.children:
            if child.name == "strong":
                after_strong = True
                continue
            if after_strong:
                if child.name == "div":
                    break
                if isinstance(child, NavigableString):
                    text = child.strip()
                    if text:
                        desc_parts.append(text)
        description = " ".join(desc_parts)

        # prerequisites, offerings, year standing, and concurrent prereqs
        # are all in .coursedescadditional
        prerequisites = ""
        offerings = []
        year_standing = None
        concurrent_prerequisites = []

        additional = block.select_one(".coursedescadditional")
        if additional:
            for line in _br_lines(additional):
                ll = line.lower()

                if ll.startswith("prerequisite"):
                    prerequisites = re.sub(r"^prerequisite\(s\):\s*", "", line, flags=re.IGNORECASE).strip()

                # "Also offered:" / "Offered:" / "Also Offered in:" lines
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

        # year standing from prerequisite text
        if prerequisites:
            ys_match = re.search(r"\b(second|third|fourth|2nd|3rd|4th)[- ]year\s+standing", prerequisites, re.IGNORECASE)
            if ys_match:
                word = ys_match.group(1).lower()
                year_standing = {"second": 2, "2nd": 2, "third": 3, "3rd": 3, "fourth": 4, "4th": 4}[word]

        # concurrent prerequisites — course codes that appear in a concurrent clause
        if prerequisites:
            COURSE_RE = re.compile(r'\b([A-Z]{3,4}\s+\d{4}[A-Z]?)\b')
            # find all "concurrently" clauses: "X may be taken concurrently" or "concurrent with X"
            concurrent_raw = re.findall(
                r'([A-Z]{3,4}\s+\d{4}[A-Z]?)\s+(?:may\s+be\s+taken\s+concurrently|concurrently)',
                prerequisites,
            ) + re.findall(
                r'concurrent(?:ly)?\s+with\s+((?:[A-Z]{3,4}\s+\d{4}[A-Z]?(?:\s*(?:and|or|,)\s*)?)+)',
                prerequisites,
            )
            for item in concurrent_raw:
                concurrent_prerequisites.extend(COURSE_RE.findall(item))
            concurrent_prerequisites = list(dict.fromkeys(concurrent_prerequisites))  # deduplicate, preserve order

        courses.append({
            "code": code,
            "name": course_name,
            "credit": credit,
            "description": description,
            "prerequisites": prerequisites,
            "offerings": offerings,
            "year_standing": year_standing,
            "concurrent_prerequisites": concurrent_prerequisites,
        })

    free_electives = scrape_free_electives(soup)
    programs = scrape_program_requirements(soup)

    print(f"  {name}: {len(courses)} courses, {len(free_electives)} free elective entries, {len(programs)} degree/stream programs")
    return {"name": name, "url": url, "courses": courses, "free_electives": free_electives, "programs": programs}


_CHOOSE_HEADER_RE = re.compile(
    r'choose|select|one of|from the following|complete\s+\d|credits?\s+from|at least\s+\d',
    re.IGNORECASE,
)
_HEADER_CREDITS_RE = re.compile(r'(\d+\.?\d*)\s+credit', re.IGNORECASE)


def _parse_sc_courselist(table):
    """Parse a single sc_courselist table into a list of requirement dicts."""
    COURSE_RE = re.compile(r'\b([A-Z]{3,4}\s+\d{4}[A-Z]?)\b')
    CREDIT_BRACKET_RE = re.compile(r'\[([0-9.]+)\]')
    NUMBERED_PREFIX_RE = re.compile(r'^\s*[A-Z0-9]+\.\s+')

    requirements = []
    current_type = "required"
    current_header_text = ""
    current_header_credits = None

    # buffer for accumulating courses within a choose block
    choose_buffer = []
    choose_credits = None
    choose_desc = ""

    def flush_choose():
        """Emit a single choose requirement from the buffer and reset it."""
        if choose_buffer:
            requirements.append({
                "type": "choose",
                "courses": list(choose_buffer),
                "credits": choose_credits,
                "description": choose_desc,
            })
        choose_buffer.clear()

    for row in table.find_all("tr"):
        classes = set(row.get("class") or [])

        if "listsum" in classes:
            continue

        tds = row.find_all("td")
        if not tds:
            continue

        # Section header row — flush any open choose block and set new context
        if "areaheader" in classes:
            flush_choose()
            text = row.get_text(" ", strip=True).replace("\xa0", " ")
            current_header_text = text
            lower = text.lower()

            m = _HEADER_CREDITS_RE.search(text)
            current_header_credits = float(m.group(1)) if m else None

            if _CHOOSE_HEADER_RE.search(lower):
                current_type = "choose"
                choose_credits = current_header_credits
                choose_desc = NUMBERED_PREFIX_RE.sub("", text).strip()
            elif "elective" in lower:
                current_type = "elective"
            else:
                current_type = "required"
            continue

        hours_td = row.select_one("td.hourscol")
        credits_text = hours_td.get_text(strip=True) if hours_td else ""
        try:
            credits = float(credits_text)
        except (ValueError, TypeError):
            credits = None

        code_td = row.select_one("td.codecol")

        if code_td:
            code_text = code_td.get_text(" ", strip=True).replace("\xa0", " ")
            courses = COURSE_RE.findall(code_text)

            name_td = next(
                (td for td in tds
                 if "codecol" not in (td.get("class") or [])
                 and "hourscol" not in (td.get("class") or [])),
                None,
            )
            description = name_td.get_text(" ", strip=True).replace("\xa0", " ") if name_td else ""

            m = CREDIT_BRACKET_RE.search(code_text)
            if m:
                try:
                    credits = float(m.group(1))
                except ValueError:
                    pass

            if not courses:
                continue

            # orclass rows are always "or" alternatives — treat as choose
            row_type = current_type
            if "orclass" in classes:
                row_type = "choose"

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
        else:
            desc_td = next(
                (td for td in tds if "hourscol" not in (td.get("class") or [])),
                tds[0],
            )
            text = desc_td.get_text(" ", strip=True).replace("\xa0", " ")

            if not text.strip():
                continue

            if re.search(r":\s*$", text.strip()):
                continue

            lower = text.lower()
            if "elective" in lower:
                row_type = "elective"
            elif re.search(r"\bchoose\b|\bselect\b", lower) or _CHOOSE_HEADER_RE.search(lower):
                row_type = "choose"
            elif current_type != "required":
                row_type = current_type
            else:
                row_type = "elective"

            if credits is None:
                m = re.search(r'\b(\d+\.?\d*)\s+credit', lower)
                if m:
                    try:
                        credits = float(m.group(1))
                    except ValueError:
                        pass

            courses = COURSE_RE.findall(text)
            clean_text = NUMBERED_PREFIX_RE.sub("", text).strip()

            if row_type == "choose" and courses:
                choose_buffer.extend(courses)
            else:
                flush_choose()
                requirements.append({
                    "type": row_type,
                    "courses": courses,
                    "credits": credits,
                    "description": clean_text,
                })

    flush_choose()
    return requirements


def scrape_program_requirements(soup):
    """Extract structured degree/stream requirements from sc_courselist tables."""
    programs = []
    degree_index = {}  # degree text -> index in programs list

    for table in soup.select("table.sc_courselist"):
        # Walk backward to find the nearest plain h3 (no toggle/red class) = degree heading
        degree = ""
        for prev in table.find_all_previous("h3"):
            prev_classes = set(prev.get("class") or [])
            if not prev_classes & {"toggle", "red"}:
                degree = prev.get_text(" ", strip=True).replace("\xa0", " ").strip()
                break

        if not degree:
            continue  # category or ancillary table — skip

        requirements = _parse_sc_courselist(table)
        if not requirements:
            continue

        if degree in degree_index:
            programs[degree_index[degree]]["requirements"].extend(requirements)
        else:
            degree_index[degree] = len(programs)
            programs.append({"degree": degree, "requirements": requirements})

    return programs


def scrape_free_electives(soup):
    entries = []

    # 1. h3.toggle sections labelled "Free Electives" — describes what qualifies
    for h3 in soup.find_all("h3", class_="toggle"):
        if "free elective" not in h3.get_text(strip=True).lower():
            continue
        desc_parts = []
        for sib in h3.next_siblings:
            if sib.name in ("h3", "h2", "h1"):
                break
            if hasattr(sib, "get_text"):
                text = sib.get_text(" ", strip=True)
                if text:
                    desc_parts.append(text)
        if desc_parts:
            text = " ".join(desc_parts).replace("\xa0", " ")
            if not any(e["text"] == text for e in entries):
                entries.append({"type": "definition", "text": text})

    # 2. sc_courselist table rows that state free elective credit requirements
    seen = set()
    for row in soup.select("table.sc_courselist tr"):
        text = row.get_text(" ", strip=True)
        if "free elective" not in text.lower():
            continue

        # credit amount is in the hourscol td
        hours_td = row.select_one("td.hourscol")
        credits = hours_td.get_text(strip=True) if hours_td else ""

        # nearest preceding degree-title heading (h3 with an id)
        degree = ""
        for prev in row.find_all_previous("h3"):
            prev_text = prev.get_text(" ", strip=True)
            if prev_text:
                degree = prev_text
                break

        key = (degree, text)
        if key in seen:
            continue
        seen.add(key)

        entries.append({
            "type": "requirement",
            "degree": degree,
            "credits": credits,
            "text": text.replace("\xa0", " "),
        })

    return entries


_SCHEDULE_BASE = "https://central.carleton.ca/prod/bwckctlg.p_disp_listcrse"
_COURSE_CODE_RE = re.compile(r"\b([A-Z]{2,4} \d{4}[A-Z]?)\b")


def _get_term_codes():
    """Return (fall_code, winter_code) for the most recent available fall and winter terms."""
    resp = requests.get(
        "https://central.carleton.ca/prod/bwysched.p_select_term?wsea_code=EXT",
        headers=HEADERS, timeout=15,
    )
    soup = BeautifulSoup(resp.text, "html.parser")
    fall_code = winter_code = None
    for opt in soup.select("select[name=term_code] option"):
        val = opt.get("value", "")
        if not val:
            continue
        text = opt.get_text(strip=True).lower()
        if "fall" in text and fall_code is None:
            fall_code = val
        elif "winter" in text and winter_code is None:
            winter_code = val
    return fall_code, winter_code


def _fetch_subject_offerings(term_code, subject):
    """Return set of course codes offered for a given term + subject."""
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
    soup = BeautifulSoup(resp.text, "html.parser")
    codes = set()
    for th in soup.find_all("th", class_="ddtitle"):
        m = _COURSE_CODE_RE.search(th.get_text(strip=True))
        if m:
            codes.add(m.group(1))
    return codes


def scrape_offerings(all_programs):
    """
    Scrape fall/winter offerings from Carleton's class schedule.

    Uses bwckctlg.p_disp_listcrse which is publicly accessible without login.
    Derives subject codes from the already-scraped course data so we only
    query subjects that actually appear in our dataset.

    Returns dict mapping course_code -> list of terms, e.g.
      {"COMP 1405": ["fall", "winter"], "COMP 4905": ["fall"]}
    """
    # Collect all subject codes present in the scraped data
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

    fall_offered: set = set()
    winter_offered: set = set()

    for i, subj in enumerate(sorted(subjects), 1):
        fall_offered |= _fetch_subject_offerings(fall_code, subj)
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


def main():
    os.makedirs(_DATA_DIR, exist_ok=True)

    results = []
    for name, url in PROGRAMS.items():
        print(f"Scraping: {name}")
        data = scrape_program(name, url)
        results.append(data)

        slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        with open(os.path.join(_DATA_DIR, f"{slug}.json"), "w") as f:
            json.dump(data, f, indent=2)

        time.sleep(0.5)

    print("\nFetching semester offerings from class schedule...")
    offerings = scrape_offerings(results)

    # Merge offerings into every course object across all programs
    for program in results:
        for course in program.get("courses", []):
            code = course.get("code", "")
            course["offerings"] = offerings.get(code, [])

    # Re-save individual department files with offerings merged in
    for program in results:
        name = program["name"]
        slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        with open(os.path.join(_DATA_DIR, f"{slug}.json"), "w") as f:
            json.dump(program, f, indent=2)

    with open(os.path.join(_DATA_DIR, "courses.json"), "w") as f:
        json.dump(results, f, indent=2)

    total = sum(len(p["courses"]) for p in results)
    with_offerings = sum(
        1 for p in results for c in p["courses"] if c.get("offerings")
    )
    print(f"\nDone. {total} courses across {len(results)} programs saved to data/")
    print(f"      {with_offerings} courses have fall/winter offerings data")


if __name__ == "__main__":
    main()
