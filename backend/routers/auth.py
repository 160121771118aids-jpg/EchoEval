from fastapi import APIRouter, HTTPException, Depends, Request
from models.schemas import SignupRequest, LoginRequest, GoogleAuthRequest, UserProfile
from services.supabase_client import supabase, supabase_admin

router = APIRouter()


def get_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    return auth.split("Bearer ")[1]


async def get_current_user(request: Request) -> dict:
    token = get_token(request)
    try:
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/signup")
async def signup(body: SignupRequest):
    try:
        auth_response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = auth_response.user
    if not user:
        raise HTTPException(status_code=400, detail="Signup failed")

    # Create profile
    supabase_admin.table("profiles").insert({
        "id": user.id,
        "first_name": body.first_name,
    }).execute()

    # Create initial streak record
    supabase_admin.table("streaks").insert({
        "user_id": user.id,
        "current_streak": 0,
        "longest_streak": 0,
    }).execute()

    session = auth_response.session
    return {
        "user": {"id": user.id, "email": user.email, "first_name": body.first_name},
        "access_token": session.access_token if session else None,
    }


@router.post("/login")
async def login(body: LoginRequest):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = auth_response.user
    session = auth_response.session

    # Fetch profile
    profile = supabase_admin.table("profiles").select("*").eq("id", user.id).single().execute()

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": profile.data["first_name"],
            "onboarding_complete": profile.data["onboarding_complete"],
        },
        "access_token": session.access_token,
    }


@router.post("/google")
async def google_auth(body: GoogleAuthRequest):
    # Validate the token with Supabase to get the user
    try:
        user_response = supabase.auth.get_user(body.access_token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user:
        raise HTTPException(status_code=401, detail="Could not validate Google token")

    # Check if profile already exists
    profile_result = supabase_admin.table("profiles").select("*").eq("id", user.id).execute()

    if not profile_result.data:
        # Extract first name from Google user metadata
        meta = user.user_metadata or {}
        first_name = meta.get("full_name", meta.get("name", "")).split(" ")[0] or "User"

        # Create profile
        supabase_admin.table("profiles").insert({
            "id": user.id,
            "first_name": first_name,
        }).execute()

        # Create initial streak record
        supabase_admin.table("streaks").insert({
            "user_id": user.id,
            "current_streak": 0,
            "longest_streak": 0,
        }).execute()

    # Re-fetch profile to get full data
    profile = supabase_admin.table("profiles").select("*").eq("id", user.id).single().execute()

    # Fetch streak
    streak = supabase_admin.table("streaks").select("*").eq("user_id", user.id).execute()
    streak_data = streak.data[0] if streak.data else {}

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": profile.data["first_name"],
            "onboarding_complete": profile.data["onboarding_complete"],
            "current_streak": streak_data.get("current_streak", 0),
            "longest_streak": streak_data.get("longest_streak", 0),
        },
        "access_token": body.access_token,
    }


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    # Fetch profile
    profile = supabase_admin.table("profiles").select("*").eq("id", user.id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Fetch streak
    streak = supabase_admin.table("streaks").select("*").eq("user_id", user.id).execute()
    streak_data = streak.data[0] if streak.data else {}

    return {
        "id": user.id,
        "email": user.email,
        "first_name": profile.data["first_name"],
        "onboarding_complete": profile.data["onboarding_complete"],
        "current_streak": streak_data.get("current_streak", 0),
        "longest_streak": streak_data.get("longest_streak", 0),
    }
