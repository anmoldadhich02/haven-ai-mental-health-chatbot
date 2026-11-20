import re

def extract_memory(message: str):
    if not message:
        return None

    raw = message.strip()
    text = raw.lower()

    # Regex patterns for explicit memory instructions
    explicit_patterns = [
        r"^(?:please\s+)?remember\s+(?:that\s+|this\s*:\s*|this\s+)?(.+)$",
        r"^(?:can\s+you\s+)?(?:please\s+)?remember\s+(?:that\s+)?(.+)$",
        r"^(?:don'?t|do\s+not)\s+forget\s+(?:that\s+)?(.+)$",
        r"^(?:keep\s+in\s+mind\s+(?:that\s+)?)(.+)$",
        r"^(?:note\s+(?:down\s+|that\s+)?)(.+)$",
        r"^(?:always\s+remember\s+(?:that\s+)?)(.+)$",
        r"^(?:my\s+name\s+is\s+)(.+)$",
        r"^(?:i\s+(?:am|'m)\s+stressed\s+about\s+)(.+)$",
        r"^(?:i\s+feel\s+stressed\s+about\s+)(.+)$",
        r"^(?:i\s+(?:am|'m)\s+struggling\s+with\s+)(.+)$",
        r"^(?:i\s+(?:am|'m)\s+working\s+on\s+)(.+)$",
        r"^(?:i\s+prefer\s+)(.+)$",
    ]

    for p in explicit_patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            span = m.span(1)
            extracted = raw[span[0]:span[1]].strip().rstrip(".!?,")
            if len(extracted) >= 2:
                if "my name is" in text[:span[0]]:
                    return f"My name is {extracted}"
                if "stressed about" in text[:span[0]]:
                    return f"Stressed about: {extracted}"
                if "struggling with" in text[:span[0]]:
                    return f"Struggling with: {extracted}"
                return extracted

    # Substring triggers
    memory_triggers = [
        "remember that",
        "remember this",
        "please remember",
        "remember:",
        "remember ",
        "my name is",
        "i am working on",
        "i'm working on",
        "i like",
        "i prefer",
        "i feel stressed about",
        "i am stressed about",
        "i struggle with",
        "i am struggling with",
    ]

    for trigger in memory_triggers:
        if trigger in text:
            idx = text.find(trigger)
            extracted = raw[idx + len(trigger):].strip().lstrip(":").strip().rstrip(".!?,")
            if len(extracted) >= 2:
                return extracted
            return raw

    return None