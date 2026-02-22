from datetime import date, timedelta
from services.supabase_client import supabase_admin


async def update_streak(user_id: str) -> dict:
    """Update user's streak after a practice session."""
    today = date.today()

    # Get current streak data
    result = supabase_admin.table("streaks").select("*").eq("user_id", user_id).execute()

    if not result.data:
        # First ever session — create streak record
        data = {
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_practice_date": today.isoformat(),
        }
        supabase_admin.table("streaks").insert(data).execute()
        return data

    streak = result.data[0]
    last_practice = date.fromisoformat(streak["last_practice_date"]) if streak["last_practice_date"] else None

    if last_practice == today:
        # Already practiced today — no change
        return streak

    if last_practice == today - timedelta(days=1):
        # Consecutive day — increment streak
        new_streak = streak["current_streak"] + 1
    else:
        # Streak broken — reset to 1
        new_streak = 1

    longest = max(streak["longest_streak"], new_streak)

    update_data = {
        "current_streak": new_streak,
        "longest_streak": longest,
        "last_practice_date": today.isoformat(),
    }
    supabase_admin.table("streaks").update(update_data).eq("user_id", user_id).execute()

    return {**streak, **update_data}
