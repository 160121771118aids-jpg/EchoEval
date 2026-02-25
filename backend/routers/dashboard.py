from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from services.supabase_client import supabase_admin
from collections import Counter

router = APIRouter()


@router.get("")
async def get_dashboard(user=Depends(get_current_user)):
    # Get streak data
    streak_result = supabase_admin.table("streaks") \
        .select("*") \
        .eq("user_id", user.id) \
        .execute()
    streak = streak_result.data[0] if streak_result.data else {
        "current_streak": 0,
        "longest_streak": 0,
        "last_practice_date": None,
    }

    # Get recent sessions
    sessions_result = supabase_admin.table("sessions") \
        .select("*") \
        .eq("user_id", user.id) \
        .order("created_at", desc=True) \
        .limit(10) \
        .execute()

    total_result = supabase_admin.table("sessions") \
        .select("id", count="exact") \
        .eq("user_id", user.id) \
        .execute()

    # Get all feedback to find top strengths and current micro-skill
    feedback_result = supabase_admin.table("feedback") \
        .select("strengths, micro_skill") \
        .eq("user_id", user.id) \
        .order("created_at", desc=True) \
        .limit(20) \
        .execute()

    # Aggregate strengths
    all_strengths = []
    for fb in feedback_result.data:
        if fb.get("strengths"):
            all_strengths.extend(fb["strengths"])

    # Get most common strengths
    strength_counts = Counter(all_strengths)
    top_strengths = [s for s, _ in strength_counts.most_common(3)]

    # Current micro-skill from most recent feedback
    current_micro_skill = None
    if feedback_result.data:
        current_micro_skill = feedback_result.data[0].get("micro_skill")

    return {
        "total_sessions": total_result.count or 0,
        "current_streak": streak.get("current_streak", 0),
        "longest_streak": streak.get("longest_streak", 0),
        "last_practice_date": streak.get("last_practice_date"),
        "recent_sessions": sessions_result.data,
        "top_strengths": top_strengths,
        "current_micro_skill": current_micro_skill,
    }
