import os
import traceback
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# Load .env from backend folder or current working directory
_backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)
load_dotenv()


def get_groq_api_key():
    return os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY")


def get_groq_client():
    key = get_groq_api_key()
    if not key:
        return None
    return Groq(api_key=key)


# Initialize module client if key is available
client = get_groq_client()

SYSTEM_PROMPT = """
You are Haven — a warm, compassionate, emotionally intelligent mental health companion.
Your mission: Make the user feel heard, understood, supported, and genuinely cared for like a trusted friend.

ANTI-REPETITION & NATURAL CONVERSATION RULES (STRICT):
1. NEVER USE A COOKIE-CUTTER TEMPLATE:
   - DO NOT repeat the same predictable formula across responses.
   - DO NOT default to repeating "I hear how heavy that feels..." followed by breathing count, 5-4-3-2-1 sensory grounding, and drinking a cool glass of water.
   - Do NOT prescribe breathing or grounding exercises in every reply. Most messages should just be warm, natural conversational dialogue, listening, or exploring feelings together.
   - Only suggest a physical technique or micro-step when the user explicitly asks for advice/exercises or is experiencing acute, overwhelming panic.
2. ADAPT GENUINELY TO THE USER'S MOOD & INTENT:
   - Positive / Good News ("I feel a bit good", "Today was better", "I had a great day"):
     Celebrate with them! Share in their joy, validate their progress, and ask what made them feel good. NEVER give anxiety exercises or somber calming steps to someone feeling positive!
   - Sharing & Venting:
     Simply listen, empathize, and sit with them in the moment. Don't rush to fix everything or force an action plan.
   - Anxiety or Stress:
     Be calming, grounding, and reassuring. If offering ideas, be creative and diverse (e.g. stretching, listening to a favorite album, stepping outside, jotting thoughts down, resting), not just the same breathing exercise.
   - Sadness or Loneliness:
     Offer genuine warmth, comfort, and companionship.
3. VARIED, AUTHENTIC VOICE:
   - Vary your opening sentences: Avoid starting every reply with "I hear how..." or "It's completely okay...". Speak organically, like an emotionally present person having an ongoing dialogue.
   - Look at the conversation history: NEVER repeat phrases, advice, metaphors, or exercises you already mentioned in earlier turns of this conversation.
   - Vary length: Sometimes 2-3 heartfelt sentences are far more comforting than a structured list.
4. READABILITY:
   - NEVER use markdown tables (|).
   - NEVER use rigid clinical headings (e.g. "## 1. Roadmap" or "### Steps").
   - Use short, gentle paragraphs (1 to 3 sentences) with clean spacing so it's easy on the eyes.
5. SAFETY:
   - If user mentions self-harm, suicide, or severe danger, respond with urgent gentle care, ask if they are in a safe place, and share crisis lines (India: 112, AASRA: 9152987821; US: 988; UK: 111).
"""

# ─────────────────────────────────────────
def get_max_tokens(user_message: str) -> int:
    message = user_message.lower()

    crisis_keywords = ["suicide", "self-harm", "die", "hurt myself",
                       "end it", "overdose", "abuse", "danger", "kill"]

    if any(word in message for word in crisis_keywords):
        return 500

    # Concise, bite-sized, and reader-friendly
    return 400

# ─────────────────────────────────────────
def generate_response(user_message: str, chat_history: list = None, memories: list = None) -> str:
    active_client = get_groq_client() or client
    if not active_client:
        return "AI service is not configured. Please check your GROQ_API_KEY."

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    if memories:
        memory_text = "\n".join([f"- {memory}" for memory in memories[-10:]])

        messages.append({
            "role": "system",
            "content": f"Important saved user memories:\n{memory_text}"
        })

    if chat_history:
        for chat in chat_history[-8:]:
            if isinstance(chat, dict):
                if "user" in chat and "bot" in chat:
                    messages.append({"role": "user", "content": str(chat["user"])})
                    messages.append({"role": "assistant", "content": str(chat["bot"])})
                elif "role" in chat and "content" in chat:
                    r = "assistant" if chat["role"] in ("haven", "assistant", "bot") else "user"
                    messages.append({"role": r, "content": str(chat["content"])})

    messages.append({"role": "user", "content": user_message})

    # Models to try in order of priority (llama-3.3-70b-versatile was deprecated by Groq)
    candidate_models = []
    preferred = os.getenv("GROQ_MODEL") or os.getenv("AI_MODEL")
    if preferred and preferred not in candidate_models:
        candidate_models.append(preferred)
    for fallback in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    last_error = None
    max_tokens = get_max_tokens(user_message)

    for model_name in candidate_models:
        try:
            response = active_client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.85,
                presence_penalty=0.35,
                frequency_penalty=0.35,
                max_completion_tokens=max_tokens
            )
            return response.choices[0].message.content

        except Exception as e:
            # If penalties are not supported by the model, retry without them
            try:
                response = active_client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.85,
                    max_completion_tokens=max_tokens
                )
                return response.choices[0].message.content
            except Exception as e2:
                last_error = e2
                print(f"[Haven LLM] Groq API Error with model '{model_name}': {e2}")
                continue

    print("[Haven LLM] All candidate models failed. Last error:", last_error)
    traceback.print_exc()
    return "Sorry, I'm having trouble responding right now. Please try again in a moment."
# ─────────────────────────────────────────
if __name__ == "__main__":
    chat_history = []
    print("Haven is here. Type 'exit' to end the conversation.\n")
    print("Haven: Hey, I'm really glad you're here. This is a safe, "
          "judgment-free space — share whatever's on your mind.\n")

    while True:
        user_input = input("You: ").strip()

        if not user_input:
            print("\nHaven: I'm here whenever you're ready.\n")
            continue

        if user_input.lower() in ["exit", "quit", "bye"]:
            print("\nHaven: Take care of yourself. "
                  "I'm here whenever you need to talk.")
            break

        bot_reply = generate_response(user_input, chat_history)
        print(f"\nHaven: {bot_reply}\n")

        chat_history.append({"user": user_input, "bot": bot_reply})

        if len(chat_history) > 50:
            chat_history = chat_history[-20:]