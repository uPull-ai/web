"""
uPull.ai Academy Q&A backend — local prototype.

Holds the Anthropic API key server-side (never in the browser) and answers
learner questions grounded in the real academy.html course catalog and
case study library, extracted into app_data.py.

Run:
    pip3 install flask flask-cors anthropic --break-system-packages   (Mac: drop --break-system-packages if not needed)
    export ANTHROPIC_API_KEY=sk-ant-...
    python3 app.py

Then open widget.html in a browser (or add the same fetch code into
academy.html) to talk to it at http://localhost:5000/ask
"""
import anthropic
from flask import Flask, request, jsonify
from flask_cors import CORS

from app_data import COURSES, CASE_STUDY_SUMMARIES, CASE_STUDY_FULL

app = Flask(__name__)
CORS(app)  # local prototype only — lock this down before real deployment

client = anthropic.Anthropic()

SYSTEM_PROMPT_BASE = f"""You are the uPull.ai Academy assistant. You help NHS staff and healthcare \
professionals find the right AI-adoption courses, understand real case studies from uPull.ai's \
Academy page (uGrowX pathways: Agentic, Ambient, Clinical, Robotic, Operational, Intrapreneur, and \
Prompt Engineering), and answer general questions about AI in healthcare more broadly.

When a question is about uPull.ai's own courses, case studies, pathways, or CPD credits, answer only \
from the data provided below — never invent a course, provider, or statistic that isn't in it. If a \
learner asks something about uPull.ai's own catalog that this data doesn't cover, say so plainly \
rather than guessing.

For general questions outside that catalog, for example "what is agentic AI" or "how does ambient \
documentation work", you may answer from your own general knowledge. When you do, make that clearly \
visible in the answer, for example "This isn't part of the uPull.ai Academy catalog, but generally...", \
so a learner can always tell official uPull.ai content apart from general information.

Keep answers short and practical: recommend specific course titles and providers by name, mention \
whether a course is free, its CPD hours, and who it's aimed at, when relevant.

COURSE CATALOG (JSON):
{COURSES}

CASE STUDY LIBRARY (summaries only — full detail is provided separately when a learner asks about a \
specific one):
{CASE_STUDY_SUMMARIES}
"""


def find_relevant_case_study(question):
    """Very simple keyword match: if the question plausibly refers to one
    specific case study by title or id, pull its full detail into context
    for this turn only, instead of loading all 30 in full every time."""
    import re
    q = question.lower()
    id_matches = re.findall(r"\bcs0*(\d+)\b", q)
    for num in id_matches:
        cs_id = f"CS{num}"
        if cs_id in CASE_STUDY_FULL:
            return CASE_STUDY_FULL[cs_id]
    best_match, best_score = None, 0
    for cs_id, cs in CASE_STUDY_FULL.items():
        title_words = [w.lower() for w in cs["title"].split() if len(w) > 3]
        score = sum(1 for w in title_words if w in q)
        if score > best_score:
            best_match, best_score = cs, score
    return best_match if best_score >= 2 else None


def get_text(response):
    for block in response.content:
        if block.type == "text":
            return block.text
    return "(no text block found)"


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(force=True)
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "No question provided"}), 400

    system_prompt = SYSTEM_PROMPT_BASE
    matched_cs = find_relevant_case_study(question)
    if matched_cs:
        system_prompt += f"\n\nFULL DETAIL for the case study this question is likely about:\n{matched_cs}"

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=800,
        system=system_prompt,
        messages=[{"role": "user", "content": question}],
    )

    return jsonify({
        "answer": get_text(response),
        "matched_case_study": matched_cs["id"] if matched_cs else None,
        "tokens": {
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens,
        },
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)
