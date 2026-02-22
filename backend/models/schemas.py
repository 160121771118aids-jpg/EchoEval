from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


# Auth
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    access_token: str


class UserProfile(BaseModel):
    id: str
    email: str
    first_name: str
    onboarding_complete: bool
    current_streak: int = 0
    longest_streak: int = 0


# Sessions
class SessionCreate(BaseModel):
    session_type: str = "practice"


class SessionResponse(BaseModel):
    id: str
    user_id: str
    session_type: str
    scenario: Optional[str]
    transcript: Optional[str]
    duration_seconds: Optional[int]
    created_at: str


class FeedbackResponse(BaseModel):
    id: str
    session_id: str
    strengths: list[str]
    micro_skill: Optional[str]
    model_answer: Optional[str]
    hedging_count: int
    filler_count: int
    recommendation_first: Optional[bool]
    conciseness_score: Optional[int]
    created_at: str


class SessionDetailResponse(BaseModel):
    session: SessionResponse
    feedback: Optional[FeedbackResponse]


# Dashboard
class DashboardResponse(BaseModel):
    total_sessions: int
    current_streak: int
    longest_streak: int
    last_practice_date: Optional[str]
    recent_sessions: list[SessionResponse]
    top_strengths: list[str]
    current_micro_skill: Optional[str]


# VAPI
class StartCallRequest(BaseModel):
    session_type: str = "practice"
