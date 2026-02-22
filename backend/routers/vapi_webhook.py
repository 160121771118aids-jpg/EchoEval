import asyncio
import json
import re
from fastapi import APIRouter, Request
from services.analysis import analyze_transcript
from services.coaching import generate_feedback
from services.evaluation import run_deep_evaluation
from services.streak import update_streak
from services.supabase_client import supabase_admin
from config import OPENAI_API_KEY

router = APIRouter()

COACHING_SYSTEM_PROMPT = """You are Alexa, an expert communication coach with 15+ years of experience training professionals to communicate with clarity, confidence, and executive presence.

CONVERSATION FLOW:

1. GREETING (already sent via firstMessage). Wait for the user's response.

2. WARMUP CHECK:
   - After they respond to your greeting, ask: "Before we jump in — want to do a quick 30-second warmup, or go straight to practice?"
   - If they want a warmup: Ask them a casual question like "Tell me about something you're working on right now" or "What's one win you had this week?" Listen, give ONE quick observation about how they communicated (not the content), then say "Nice — you're warmed up. Now, what topic do you want to practice today?"
   - If they want to skip: Go straight to "What topic or situation do you want to practice today?"

3. TOPIC COLLECTION:
   - The user will tell you what they want to practice (e.g., "giving feedback", "pitching an idea", "saying no to my boss")
   - Acknowledge their topic, then say: "OK, go ahead — talk to me like you would in that real situation. Aim for about 60 seconds."

4. LISTEN TO RESPONSE:
   - Let them speak fully. Do NOT interrupt.

5. DELIVER FEEDBACK (structured):
   a) ONE STRENGTH — Be specific. Reference what they actually said.
   b) EXECUTIVE PRESENCE CHECK — Call out specific issues:
      - Hedging language ("I think", "maybe", "sort of", "kind of")
      - Filler words ("um", "uh", "like", "you know")
      - Over-contextualizing before stating a position
      - Not leading with the conclusion/recommendation
   c) ONE MICRO-SKILL — The single highest-impact thing to improve. Be precise.
   d) MODEL ANSWER — 2-3 sentences showing how a confident leader would phrase the key point.

6. LOOP:
   - After feedback, ask: "Want to retry the same topic, try something new, or are you done for today?"
   - If retry: "Alright, same topic — give it another shot."
   - If new topic: "What do you want to practice next?" → go to step 3
   - If done: Say goodbye warmly and end the call.

COMMUNICATION PRINCIPLES YOU EVALUATE:
- Lead with the recommendation/conclusion (bottom-line up front)
- Avoid hedging language — every hedge erodes trust
- Minimize filler words — silence is better than "um"
- Be concise — every word should earn its place
- Sound confident, not aggressive
- Structure thoughts clearly: situation → recommendation → reasoning
- Speak like an owner, not a contributor

COACHING STYLE:
- Supportive, direct, and honest
- Never generic or motivational fluff
- Feedback must be specific, concrete, and situational
- Call out confidence leaks explicitly, even when content quality is high
- You're a coach, not a critic — but you don't soften feedback unnecessarily
- Keep each response tight — no long monologues
- Sound like a trusted colleague, not a teacher

END CALL — THIS IS CRITICAL, FOLLOW EXACTLY:
- You MUST end the call immediately (with a brief 1-sentence goodbye) whenever the user signals they are finished. This includes ANY of these phrases or similar intent:
  "I'm done", "I am done", "done for today", "that's it", "that's all", "I'm good", "all good", "no more", "nothing else", "bye", "goodbye", "see you", "stop", "end", "end session", "end the session", "let's stop", "I want to stop", "I'm finished", "wrap up", "gotta go", "thanks that's all", "no thanks"
- Do NOT ask follow-up questions after the user says they're done. Do NOT offer another round. Just say goodbye and end the call.
- When ending, say something brief like "Great session! Talk soon." and immediately call the endCall function.
- If in doubt whether the user wants to end — END THE CALL. It is always better to end than to keep going when the user wants to leave.
"""

COACHING_FIRST_MESSAGE = "Hey! I'm Alexa, your communication coach. How are you doing today?"


@router.post("/webhook")
async def vapi_webhook(request: Request):
    body = await request.json()
    # VAPI payload can be nested under "message" or at the top level
    message_type = body.get("message", {}).get("type", "") or body.get("type", "")

    if message_type == "assistant-request":
        return handle_assistant_request(body)

    if message_type == "end-of-call-report":
        await handle_end_of_call(body)
        return {"status": "ok"}

    if message_type == "function-call":
        return handle_function_call(body)

    return {"status": "ok"}


def handle_assistant_request(body: dict) -> dict:
    """Return assistant configuration when VAPI requests it."""
    assistant_config = {
        "assistant": {
            "model": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "messages": [{"role": "system", "content": COACHING_SYSTEM_PROMPT}],
            },
            "voice": {
                "provider": "11labs",
                "voiceId": "21m00Tcm4TlvDq8ikWAM",  # Rachel — calm, professional female
            },
            "firstMessage": COACHING_FIRST_MESSAGE,
            "firstMessageMode": "assistant-speaks-first",
            "endCallFunctionEnabled": True,
            "maxDurationSeconds": 300,
            "recordingEnabled": True,
            "serverUrl": None,  # prevent recursive webhook calls
        }
    }

    print(f"[VAPI] assistant-request → unified coaching session")
    return assistant_config


async def handle_end_of_call(body: dict):
    """Process end-of-call report: analyze transcript, generate feedback, store results."""
    # VAPI payload can be at body.message (wrapped) or body (direct)
    message = body.get("message", body)
    call = message.get("call", {})

    # Search multiple paths for metadata — VAPI nests it in call.assistant.metadata
    metadata = call.get("metadata", {})
    if not metadata.get("user_id"):
        metadata = call.get("assistant", {}).get("metadata", {})
    if not metadata.get("user_id"):
        metadata = message.get("metadata", {})
    if not metadata.get("user_id"):
        metadata = call.get("assistantOverrides", {}).get("metadata", {})

    user_id = metadata.get("user_id")
    session_id = metadata.get("session_id")

    print(f"[VAPI] user_id={user_id}, session_id={session_id}")

    transcript = message.get("transcript", "")
    duration = message.get("durationSeconds")

    # Extract structured transcript from VAPI
    # VAPI sends: message.messages (structured list) and message.transcript (flat string)
    # artifact.messagesOpenAIFormatted has {role, content} format (ideal)
    # artifact.messages has {role, message} format
    artifact = message.get("artifact", {})
    structured_messages = artifact.get("messagesOpenAIFormatted", []) or message.get("messages", [])

    full_transcript = None
    user_turns = []

    if isinstance(structured_messages, list) and structured_messages:
        # Build full_transcript from structured messages, skip system messages
        full_transcript = []
        for msg in structured_messages:
            role = msg.get("role", "")
            content = msg.get("content", "") or msg.get("message", "")
            if role in ("assistant", "user", "bot"):
                normalized_role = "assistant" if role in ("assistant", "bot") else "user"
                full_transcript.append({"role": normalized_role, "content": content})
                if normalized_role == "user":
                    user_turns.append(content)
        user_text = " ".join(user_turns)
        print(f"[VAPI] Parsed {len(full_transcript)} structured turns, {len(user_turns)} user turns")
    elif isinstance(transcript, str) and transcript:
        # Fallback: parse flat string "AI: ... User: ..."
        user_text = ""
        full_transcript = []
        parts = re.split(r'(?:^|\n)(AI|User):\s*', transcript)
        # parts = ['', 'AI', 'message...', 'User', 'message...', ...]
        i = 1
        while i < len(parts) - 1:
            role_label = parts[i].strip()
            content = parts[i + 1].strip()
            role = "assistant" if role_label == "AI" else "user"
            full_transcript.append({"role": role, "content": content})
            if role == "user":
                user_turns.append(content)
            i += 2
        user_text = " ".join(user_turns)
        print(f"[VAPI] Parsed flat transcript into {len(full_transcript)} turns, {len(user_turns)} user turns")
    else:
        user_text = str(transcript) if transcript else ""
        print(f"[VAPI] No structured transcript available, raw text length: {len(user_text)}")

    # Extract audio URL (try multiple paths)
    audio_url = (
        message.get("stereoRecordingUrl")
        or message.get("recordingUrl")
        or artifact.get("stereoRecordingUrl")
        or artifact.get("recordingUrl")
    )
    print(f"[VAPI] audio_url: {audio_url}")

    if not user_id or not session_id:
        print(f"[VAPI] METADATA NOT FOUND. call keys: {list(call.keys())}")
        print(f"[VAPI] Full body keys: {list(body.keys())}")
        print(f"[VAPI] call object: {json.dumps(call, default=str)[:1000]}")
        return

    # Extract scenario name from VAPI summary or first user turn
    scenario = None
    summary = message.get("summary") or message.get("analysis", {}).get("summary")
    if summary:
        # Take first sentence of summary, cap at 100 chars
        first_sentence = summary.split(".")[0].strip()
        scenario = first_sentence[:100] if first_sentence else None
    if not scenario and user_turns:
        scenario = user_turns[0][:100]

    # Update session with transcript, full transcript, audio URL, and duration
    try:
        supabase_admin.table("sessions").update({
            "transcript": user_text,
            "full_transcript": full_transcript,
            "audio_url": audio_url,
            "duration_seconds": int(duration) if duration else None,
            "scenario": scenario,
        }).eq("id", session_id).execute()
    except Exception as e:
        print(f"[VAPI] Failed to update session {session_id}: {e}")

    # Analyze transcript
    analysis = analyze_transcript(user_text, int(duration) if duration else None)

    # Generate AI feedback
    try:
        feedback = await generate_feedback(user_text, analysis)
    except Exception as e:
        print(f"[VAPI] generate_feedback failed: {e}")
        feedback = {
            "strengths": ["You showed up and practiced — that's the most important thing."],
            "micro_skill": "Try leading with your main point next time.",
            "model_answer": None,
        }

    # Store feedback
    try:
        supabase_admin.table("feedback").insert({
            "session_id": session_id,
            "user_id": user_id,
            "strengths": feedback.get("strengths", []),
            "micro_skill": feedback.get("micro_skill"),
            "model_answer": feedback.get("model_answer"),
            "hedging_count": analysis["hedging_count"],
            "filler_count": analysis["filler_count"],
            "recommendation_first": analysis["recommendation_first"],
            "conciseness_score": analysis["conciseness_score"],
        }).execute()
    except Exception as e:
        print(f"[VAPI] Failed to insert feedback for session {session_id}: {e}")

    # Update streak
    try:
        await update_streak(user_id)
    except Exception as e:
        print(f"[VAPI] Failed to update streak for user {user_id}: {e}")

    # Kick off deep evaluation in background
    if full_transcript:
        asyncio.create_task(
            run_deep_evaluation(session_id, user_id, full_transcript, user_text, audio_url)
        )
        print(f"[VAPI] Deep evaluation kicked off for session {session_id}")


def handle_function_call(body: dict) -> dict:
    """Handle custom function calls during VAPI conversation."""
    message = body.get("message", {})
    function_call = message.get("functionCall", {})
    name = function_call.get("name", "")

    if name == "endSession":
        return {"result": "Session ended. Great practice!"}

    return {"result": "Function not found."}
