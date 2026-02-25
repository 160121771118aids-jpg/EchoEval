import json
from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

FEEDBACK_PROMPT = """You are Alexa, an expert communication coach evaluating a practice session transcript.

You assess both LANGUAGE QUALITY and EXECUTIVE PRESENCE in parallel.

Transcript:
---
{transcript}
---

Analysis metrics:
- Hedging word count: {hedging_count}
- Filler word count: {filler_count}
- Led with recommendation: {recommendation_first}
- Conciseness score (1-10): {conciseness_score}

EVALUATION CRITERIA:

1. Language Quality:
   - Fluency & coherence (smooth delivery, logical flow, clear structure)
   - Vocabulary (precise, professional, decision-oriented language)
   - Grammar (natural complex sentences, minimal errors)

2. Executive Presence:
   - How quickly a clear position was stated
   - Whether the speaker sounds like an owner vs. a contributor
   - Confidence leaks: hedging, over-contextualizing, filler words, self-justification
   - Would a Director trust this person to run the problem end-to-end?

Provide feedback as JSON:
{{
  "strengths": ["strength 1", "strength 2"],
  "micro_skill": "the single highest-impact improvement to focus on next",
  "model_answer": "how a confident leader would phrase the key point (2-3 sentences, natural tone)"
}}

GUIDELINES:
- Be encouraging but specific — no generic praise like "good job"
- Strengths MUST reference actual content from the transcript
- The micro_skill should name the exact behavior to change and how
- The model_answer should sound like a real senior leader, not a robot
- If hedging/filler counts are high, address that directly
- If they didn't lead with their recommendation, make that the micro_skill
- Never soften feedback unnecessarily — precision matters

Return ONLY valid JSON, no markdown or extra text."""


async def generate_feedback(
    transcript: str,
    analysis: dict,
) -> dict:
    """Generate coaching feedback using OpenAI."""
    prompt = FEEDBACK_PROMPT.format(
        transcript=transcript,
        hedging_count=analysis["hedging_count"],
        filler_count=analysis["filler_count"],
        recommendation_first=analysis["recommendation_first"],
        conciseness_score=analysis["conciseness_score"],
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=500,
    )

    content = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0]

    return json.loads(content)
