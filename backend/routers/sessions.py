from fastapi import APIRouter, Depends, HTTPException
from models.schemas import SessionCreate, StartCallRequest
from routers.auth import get_current_user
from services.supabase_client import supabase_admin
from routers.vapi_webhook import COACHING_SYSTEM_PROMPT, COACHING_FIRST_MESSAGE
from config import VAPI_SERVER_URL,VAPI_ASSISTANT_ID

router = APIRouter()


@router.get("")
async def list_sessions(user=Depends(get_current_user)):
    result = supabase_admin.table("sessions") \
        .select("*") \
        .eq("user_id", user.id) \
        .order("created_at", desc=True) \
        .limit(20) \
        .execute()
    return {"sessions": result.data}


@router.get("/{session_id}")
async def get_session(session_id: str, user=Depends(get_current_user)):
    session = supabase_admin.table("sessions") \
        .select("*") \
        .eq("id", session_id) \
        .eq("user_id", user.id) \
        .single() \
        .execute()

    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    feedback = supabase_admin.table("feedback") \
        .select("*") \
        .eq("session_id", session_id) \
        .execute()

    evaluation = supabase_admin.table("evaluations") \
        .select("*") \
        .eq("session_id", session_id) \
        .execute()

    return {
        "session": session.data,
        "feedback": feedback.data[0] if feedback.data else None,
        "evaluation": evaluation.data[0] if evaluation.data else None,
    }


@router.post("/start")
async def start_session(body: StartCallRequest, user=Depends(get_current_user)):
    """Create a new session and return VAPI call config."""
    # Create session record
    session = supabase_admin.table("sessions").insert({
        "user_id": user.id,
        "session_type": "practice",
    }).execute()

    session_data = session.data[0]

    return {
        "session_id": session_data["id"],
        "session_type": "practice",
        "vapi_config": {
            "assistantId": VAPI_ASSISTANT_ID,         # just an ID, no prompt
            "assistantOverrides": {
                "metadata": {
                    "user_id": user.id,
                    "session_id": session_data["id"],
                    "session_type": "practice",
                }
            },
        },
    }


@router.post("/complete-onboarding")
async def complete_onboarding(user=Depends(get_current_user)):
    """Mark onboarding as complete for the user."""
    supabase_admin.table("profiles") \
        .update({"onboarding_complete": True}) \
        .eq("id", user.id) \
        .execute()
    return {"status": "ok"}
