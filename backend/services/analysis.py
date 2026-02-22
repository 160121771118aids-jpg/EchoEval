import re

HEDGING_WORDS = [
    "i think", "maybe", "perhaps", "sort of", "kind of", "i guess",
    "probably", "might", "could be", "i feel like", "i believe",
    "in my opinion", "it seems like", "just", "actually", "basically",
    "honestly", "like", "you know",
]

FILLER_WORDS = [
    "um", "uh", "er", "ah", "like", "you know", "so", "well",
    "basically", "actually", "literally", "right", "okay",
]


def count_occurrences(text: str, phrases: list[str]) -> int:
    text_lower = text.lower()
    count = 0
    for phrase in phrases:
        count += len(re.findall(r'\b' + re.escape(phrase) + r'\b', text_lower))
    return count


def check_recommendation_first(transcript: str) -> bool:
    """Check if the speaker leads with their recommendation/conclusion."""
    sentences = re.split(r'[.!?]+', transcript.strip())
    if not sentences:
        return False
    first_sentence = sentences[0].lower()
    recommendation_signals = [
        "i recommend", "we should", "my recommendation", "i suggest",
        "the best approach", "i propose", "let's", "the answer is",
        "the solution is", "we need to",
    ]
    return any(signal in first_sentence for signal in recommendation_signals)


def calculate_conciseness(transcript: str, duration_seconds: int | None) -> int:
    """Score 1-10 where 10 is most concise. Based on words-per-minute and redundancy."""
    words = transcript.split()
    word_count = len(words)

    if word_count == 0:
        return 5

    if duration_seconds and duration_seconds > 0:
        wpm = (word_count / duration_seconds) * 60
        # Ideal range: 130-170 WPM for clear speech
        if 130 <= wpm <= 170:
            score = 8
        elif 100 <= wpm <= 200:
            score = 6
        else:
            score = 4
    else:
        score = 5

    # Penalize very long responses (over 200 words for a ~1 min exercise)
    if word_count > 250:
        score = max(1, score - 2)
    elif word_count < 50:
        score = max(1, score - 1)

    return min(10, max(1, score))


def analyze_transcript(transcript: str, duration_seconds: int | None = None) -> dict:
    """Full analysis of a transcript."""
    hedging_count = count_occurrences(transcript, HEDGING_WORDS)
    filler_count = count_occurrences(transcript, FILLER_WORDS)
    recommendation_first = check_recommendation_first(transcript)
    conciseness_score = calculate_conciseness(transcript, duration_seconds)

    return {
        "hedging_count": hedging_count,
        "filler_count": filler_count,
        "recommendation_first": recommendation_first,
        "conciseness_score": conciseness_score,
    }
