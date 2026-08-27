"""
uPull.ai Academy Q&A backend — deployed on Cloud Run as service
"academy-assistant" (europe-west2), called from the widget embedded
directly in academy.html.

Holds the Anthropic API key server-side (never in the browser) and answers
learner questions grounded in the real academy.html course catalog and
case study library, extracted into App_data.py.

Run locally:
    pip3 install flask flask-cors anthropic --break-system-packages   (Mac: drop --break-system-packages if not needed)
    export ANTHROPIC_API_KEY=sk-ant-...
    export FLASK_DEBUG=true   (local dev only — never on Cloud Run)
    python3 App.py

Then talk to it at http://localhost:5000/ask (academy.html's widget script
already points AA_ENDPOINT at the live Cloud Run URL).
"""
import anthropic
import re
import time
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

from App_data import COURSES, CASE_STUDY_SUMMARIES, CASE_STUDY_FULL

app = Flask(__name__)
CORS(app, origins=["https://upull.ai", "https://www.upull.ai"])

client = anthropic.Anthropic()

# Prototype-only in-memory conversation store.  It deliberately expires so a
# learner's conversation does not persist beyond their browser session.  Use
# Redis/Firestore instead when deploying more than one server instance.
CONVERSATIONS = {}
CONVERSATION_TTL_SECONDS = 60 * 60 * 4
MAX_CONVERSATION_TURNS = 12

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

If a learner says they are unsure where to start, give a short orientation and offer these three \
clear next steps: Find my pathway (to choose among the main AI pathways), the Intrapreneur Route \
(to take an AI-enabled idea through change and proof of value), and Prompt Engineering (to improve \
how they use AI assistants). Ask one simple follow-up about their goal if needed.

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


def normalise(value):
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


def find_catalog_filter(question):
    """Recognise course-library filter questions without asking the model.

    Returning a filter lets the page take learners to the complete, already
    filtered library rather than burying a long catalogue in the chat reply.
    """
    q = question.lower()
    level = next((level for level in ("beginner", "intermediate", "advanced")
                  if re.search(rf"\b{level}\b", q)), None)
    provider = next((course["provider"] for course in COURSES
                     if normalise(course["provider"]) in normalise(q)), None)
    asks_for_courses = any(term in q for term in ("course", "courses", "catalog", "library", "show me", "find"))
    if not asks_for_courses or (not level and not provider):
        return None
    matches = [course for course in COURSES
               if (not level or course["level"] == level)
               and (not provider or course["provider"] == provider)]
    return {"level": level, "provider": provider, "count": len(matches)}


def conversation_for(session_id):
    now = time.time()
    expired = [key for key, value in CONVERSATIONS.items()
               if now - value["updated_at"] > CONVERSATION_TTL_SECONDS]
    for key in expired:
        del CONVERSATIONS[key]
    if not session_id or not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", session_id):
        session_id = uuid.uuid4().hex
    return session_id, CONVERSATIONS.setdefault(session_id, {"messages": [], "updated_at": now})


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(force=True)
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "No question provided"}), 400

    session_id, conversation = conversation_for(data.get("session_id"))
    catalog_filter = find_catalog_filter(question)
    if catalog_filter:
        label = " and ".join(value for value in (catalog_filter["level"], catalog_filter["provider"]) if value)
        answer = f"I found {catalog_filter['count']} {label} course(s). Open the filtered Course Library below to see the full list."
        conversation["messages"] = (conversation["messages"] + [
            {"role": "user", "content": question},
            {"role": "assistant", "content": answer},
        ])[-MAX_CONVERSATION_TURNS * 2:]
        conversation["updated_at"] = time.time()
        return jsonify({
            "answer": answer,
            "course_filter": catalog_filter,
            "session_id": session_id,
        })

    system_prompt = SYSTEM_PROMPT_BASE
    matched_cs = find_relevant_case_study(question)
    if matched_cs:
        system_prompt += f"\n\nFULL DETAIL for the case study this question is likely about:\n{matched_cs}"

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=800,
        system=system_prompt,
        messages=conversation["messages"] + [{"role": "user", "content": question}],
    )

    answer = get_text(response)
    conversation["messages"] = (conversation["messages"] + [
        {"role": "user", "content": question},
        {"role": "assistant", "content": answer},
    ])[-MAX_CONVERSATION_TURNS * 2:]
    conversation["updated_at"] = time.time()

    return jsonify({
        "answer": answer,
        "matched_case_study": matched_cs["id"] if matched_cs else None,
        "session_id": session_id,
        "tokens": {
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens,
        },
    })


if __name__ == "__main__":
    # debug=True must never run on a publicly reachable instance (Werkzeug's
    # debugger can execute arbitrary code). Cloud Run also injects its own
    # $PORT — default to 5000 only for local dev.
    import os
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
