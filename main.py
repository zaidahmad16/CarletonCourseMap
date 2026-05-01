import json
import re
import time
import requests
from bs4 import BeautifulSoup, NavigableString

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

        courses.append({
            "code": code,
            "name": course_name,
            "credit": credit,
            "description": description,
        })

    free_electives = scrape_free_electives(soup)

    print(f"  {name}: {len(courses)} courses, {len(free_electives)} free elective entries")
    return {"name": name, "url": url, "courses": courses, "free_electives": free_electives}


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


def main():
    results = []
    for name, url in PROGRAMS.items():
        print(f"Scraping: {name}")
        data = scrape_program(name, url)
        results.append(data)
        time.sleep(0.5)

    with open("courses.json", "w") as f:
        json.dump(results, f, indent=2)

    total = sum(len(p["courses"]) for p in results)
    print(f"\nDone. {total} courses across {len(results)} programs saved to courses.json")


if __name__ == "__main__":
    main()
