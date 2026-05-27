HIGH_RISK_WORDS = [
    "suicide",
    "kill myself",
    "die",
    "kill",
    "can't breathe",
    "chest pain"
    "poison",
    "blood",
    "paralysis",
    "self harm",
    "cutting",
    "abuse",
    "end my life",
    "i want to die",
    "self harm",
    "hurt myself"
]

MEDIUM_RISK_WORDS = [
    "hopeless",
    "worthless",
    "depressed",
    "family pressure"
    "stressed",
    "scared",
    "pressure",
    "fight",
    "overthinking"
    "panic",
    "anxious",
    "overwhelmed",
    "can't handle"
]


def detect_risk(message: str) -> str:
    text = message.lower()

    for word in HIGH_RISK_WORDS:
        if word in text:
            return "high"

    for word in MEDIUM_RISK_WORDS:
        if word in text:
            return "medium"

    return "low"