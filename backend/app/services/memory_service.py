def extract_memory(message: str):
    text = message.lower().strip()

    memory_triggers = [
        "remember that",
        "remember this",
        "my name is",
        "i am working on",
        "i'm working on",
        "i like",
        "i prefer",
        "i feel stressed about",
        "i am stressed about"
    ]

    for trigger in memory_triggers:
        if trigger in text:
            return message.strip()

    return None