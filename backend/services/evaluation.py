import re
import json
import asyncio
import traceback
from openai import OpenAI
from config import OPENAI_API_KEY
from services.supabase_client import supabase_admin

client = OpenAI(api_key=OPENAI_API_KEY)

# Patterns that indicate the assistant is asking for a topic
TOPIC_ASK_PATTERNS = [
    r"what.*(?:topic|situation|scenario).*(?:practice|work on|try)",
    r"what do you want to practice",
    r"what.*want.*(?:practice|work on)",
    r"go ahead",
    r"give it.*(?:shot|try)",
    r"same topic",
    r"what.*next",
    r"try something new",
]


def extract_topics(full_transcript: list[dict]) -> list[dict]:
    """Step 1: Extract topics from the full transcript using regex + GPT-4o-mini."""
    if not full_transcript:
        return []

    # Phase 1: Regex pre-pass to identify topic boundaries
    segments = []
    current_segment_start = None
    current_topic_name = None
    pending_topic_ask = False

    for i, turn in enumerate(full_transcript):
        role = turn.get("role", "")
        content = turn.get("content", "")

        if role == "assistant":
            # Check if assistant is asking for a topic
            content_lower = content.lower()
            for pattern in TOPIC_ASK_PATTERNS:
                if re.search(pattern, content_lower):
                    pending_topic_ask = True
                    break

        elif role == "user" and pending_topic_ask:
            # User's response after a topic ask = topic name
            # Close previous segment if exists
            if current_segment_start is not None:
                segments.append({
                    "raw_name": current_topic_name,
                    "start_idx": current_segment_start,
                    "end_idx": i - 1,
                })

            current_topic_name = content.strip()[:100]
            current_segment_start = i
            pending_topic_ask = False

    # Close final segment
    if current_segment_start is not None:
        segments.append({
            "raw_name": current_topic_name,
            "start_idx": current_segment_start,
            "end_idx": len(full_transcript) - 1,
        })

    if not segments:
        # Fallback: treat entire user speech as one topic
        user_content = " ".join(
            t.get("content", "") for t in full_transcript if t.get("role") == "user"
        )
        if user_content.strip():
            segments = [{
                "raw_name": "General practice",
                "start_idx": 0,
                "end_idx": len(full_transcript) - 1,
            }]
        else:
            return []

    # Phase 2: GPT-4o-mini call to clean up topic labels
    segment_previews = []
    for seg in segments:
        preview_turns = full_transcript[seg["start_idx"]:seg["end_idx"] + 1][:4]
        preview = " | ".join(
            f'{t.get("role", "?")}: {t.get("content", "")[:80]}'
            for t in preview_turns
        )
        segment_previews.append({
            "raw_name": seg["raw_name"],
            "preview": preview,
        })

    prompt = f"""You are cleaning up topic labels from a communication coaching session.

Given these segments, return a JSON array. For each segment:
- "name": A clean, concise topic label (e.g., "Giving feedback to a report", "Pitching a product idea")
- "valid": true if this is an actual practice attempt (not just small talk or greeting), false otherwise

Segments:
{json.dumps(segment_previews)}

Return ONLY valid JSON array, no markdown."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        cleaned = json.loads(content)
    except Exception:
        # Fallback: use raw names
        cleaned = [{"name": seg["raw_name"], "valid": True} for seg in segments]

    # Build final topics with transcript segments
    topics = []
    for i, seg in enumerate(segments):
        if i < len(cleaned) and not cleaned[i].get("valid", True):
            continue

        name = cleaned[i]["name"] if i < len(cleaned) else seg["raw_name"]
        segment_turns = full_transcript[seg["start_idx"]:seg["end_idx"] + 1]

        topics.append({
            "name": name,
            "segment": segment_turns,
            "start_idx": seg["start_idx"],
            "end_idx": seg["end_idx"],
        })

    return topics


def evaluate_voice_metrics(user_text: str, audio_url: str | None) -> dict:
    """Step 2: Evaluate voice/communication metrics from text (audio support stubbed)."""
    if not user_text or not user_text.strip():
        return {
            "grammar": {"score": 0, "positives": [], "to_improve": ["No speech detected"]},
            "fluency": {"score": 0, "positives": [], "to_improve": ["No speech detected"]},
            "filler_words": {"score": 0, "positives": [], "to_improve": ["No speech detected"]},
            "clarity": {"score": 0, "positives": [], "to_improve": ["No speech detected"]},
        }

    prompt = f"""You are an expert communication evaluator. Analyze this speech transcript for communication quality.

Transcript:
---
{user_text[:3000]}
---

Evaluate these metrics (each 0-100, where 100 is excellent):

1. **grammar**: Correctness of sentence structure, subject-verb agreement, tense consistency
2. **fluency**: Smooth delivery, logical flow, natural transitions, no awkward pauses or restarts
3. **filler_words**: Absence of fillers (um, uh, like, you know, so, basically). 100 = no fillers, lower = more fillers
4. **clarity**: Clear expression of ideas, easy to follow, well-organized thoughts

For each metric provide:
- score (0-100)
- positives: 1-2 specific things done well (reference actual speech)
- to_improve: 1-2 concrete suggestions

Return ONLY valid JSON:
{{
  "grammar": {{"score": N, "positives": [...], "to_improve": [...]}},
  "fluency": {{"score": N, "positives": [...], "to_improve": [...]}},
  "filler_words": {{"score": N, "positives": [...], "to_improve": [...]}},
  "clarity": {{"score": N, "positives": [...], "to_improve": [...]}}
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=800,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        return json.loads(content)
    except Exception:
        return {
            "grammar": {"score": 50, "positives": ["Could not fully analyze"], "to_improve": ["Try again for detailed feedback"]},
            "fluency": {"score": 50, "positives": ["Could not fully analyze"], "to_improve": ["Try again for detailed feedback"]},
            "filler_words": {"score": 50, "positives": ["Could not fully analyze"], "to_improve": ["Try again for detailed feedback"]},
            "clarity": {"score": 50, "positives": ["Could not fully analyze"], "to_improve": ["Try again for detailed feedback"]},
        }


def analyze_topics(topics: list[dict]) -> list[dict]:
    """Step 3: Deep per-topic analysis with GPT-4o-mini (all topics batched)."""
    if not topics:
        return []

    # Build topic summaries for the prompt, trimmed to ~1500 chars each
    topic_data = []
    for t in topics:
        segment_text = "\n".join(
            f'{turn.get("role", "?")}: {turn.get("content", "")}'
            for turn in t.get("segment", [])
        )[:1500]
        topic_data.append({
            "name": t["name"],
            "transcript": segment_text,
        })

    prompt = f"""You are an expert communication coach doing deep analysis of practice session topics.

For each topic below, evaluate the user's communication performance. Adapt your rubric based on the topic type:
- Giving feedback → evaluate specificity, actionability, empathy, structure
- Pitching/presenting → evaluate hook, value proposition, CTA, storytelling
- Saying no/difficult conversations → evaluate firmness, alternatives offered, maintaining relationship
- General communication → evaluate structure, clarity, persuasiveness, confidence

Topics to analyze:
{json.dumps(topic_data)}

For EACH topic, return:
- "name": the topic name
- "scores": object with keys: structure, opening_impact, key_message_clarity, persuasiveness, confidence, audience_awareness (each 0-100)
- "went_well": 2-3 items describing what the user did well, with brief transcript quotes
- "to_improve": 2-3 items with concrete improvement suggestions
- "missed_points": 2-4 key elements a strong communicator would have covered
- "rewrite": 3-4 sentence model version of how a confident leader would deliver this

Return ONLY valid JSON array of topic analyses. No markdown."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=2000,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        analyzed = json.loads(content)

        # Merge analysis back into topics
        for i, topic in enumerate(topics):
            if i < len(analyzed):
                topic["scores"] = analyzed[i].get("scores", {})
                topic["went_well"] = analyzed[i].get("went_well", [])
                topic["to_improve"] = analyzed[i].get("to_improve", [])
                topic["missed_points"] = analyzed[i].get("missed_points", [])
                topic["rewrite"] = analyzed[i].get("rewrite", "")

        return topics
    except Exception:
        # Return topics without deep analysis on failure
        for topic in topics:
            topic["scores"] = {}
            topic["went_well"] = []
            topic["to_improve"] = []
            topic["missed_points"] = []
            topic["rewrite"] = ""
        return topics


async def run_deep_evaluation(
    session_id: str,
    user_id: str,
    full_transcript: list[dict],
    user_text: str,
    audio_url: str | None,
):
    """Orchestrator: runs the 3-step deep evaluation pipeline."""
    eval_record = None
    try:
        # Create evaluation record
        result = supabase_admin.table("evaluations").insert({
            "session_id": session_id,
            "user_id": user_id,
            "status": "pending",
            "audio_url": audio_url,
        }).execute()
        eval_record = result.data[0] if result.data else None
        eval_id = eval_record["id"] if eval_record else None

        if not eval_id:
            return

        # Update to processing
        supabase_admin.table("evaluations").update({
            "status": "processing",
            "updated_at": "now()",
        }).eq("id", eval_id).execute()

        # Step 1: Topic extraction (must complete first)
        topics = await asyncio.to_thread(extract_topics, full_transcript)

        # Steps 2+3 in parallel
        voice_future = asyncio.to_thread(evaluate_voice_metrics, user_text, audio_url)
        topics_future = asyncio.to_thread(analyze_topics, topics)

        voice_metrics, analyzed_topics = await asyncio.gather(voice_future, topics_future)

        # Strip segment data from topics before storing (too large for DB)
        topics_for_db = []
        for t in analyzed_topics:
            topics_for_db.append({
                "name": t.get("name"),
                "scores": t.get("scores", {}),
                "went_well": t.get("went_well", []),
                "to_improve": t.get("to_improve", []),
                "missed_points": t.get("missed_points", []),
                "rewrite": t.get("rewrite", ""),
                "start_idx": t.get("start_idx"),
                "end_idx": t.get("end_idx"),
            })

        # Update evaluation to completed
        supabase_admin.table("evaluations").update({
            "status": "completed",
            "topics": topics_for_db,
            "voice_metrics": voice_metrics,
            "updated_at": "now()",
        }).eq("id", eval_id).execute()

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        print(f"[EVAL] Deep evaluation failed for session {session_id}: {error_msg}")

        if eval_record:
            supabase_admin.table("evaluations").update({
                "status": "failed",
                "error_message": str(e)[:500],
                "updated_at": "now()",
            }).eq("id", eval_record["id"]).execute()
