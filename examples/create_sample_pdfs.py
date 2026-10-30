"""Regenerate the fictitious example resumes as local PDFs."""
import json
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from xml.sax.saxutils import escape


BASE = Path(__file__).resolve().parent
SOURCE = BASE.parents[0] / "Prototype" / "Prototype" / "unified" / "resume_examples.json"
if not SOURCE.is_file():
    SOURCE = BASE.parent / "app" / "unified" / "resume_examples.json"
OUTPUT = BASE / "resumes"
OUTPUT.mkdir(parents=True, exist_ok=True)

for item in json.loads(SOURCE.read_text(encoding="utf-8")):
    path = OUTPUT / f"{item['id']}.pdf"
    styles = getSampleStyleSheet()
    story = [Paragraph(escape(item["name"]), styles["Title"]),
             Paragraph(escape(item["role_hint"]), styles["Heading2"]), Spacer(1, 10)]
    for line in item["resume_text"].splitlines()[1:]:
        story.append(Paragraph(escape(line), styles["Normal"]))
        story.append(Spacer(1, 8))
    SimpleDocTemplate(str(path), pagesize=A4).build(story)
    print(path)
