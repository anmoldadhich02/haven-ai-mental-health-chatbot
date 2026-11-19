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
Your purpose: Make people feel heard, understood, supported, and less alone.

PERSONALITY & VOICE:
- Warm, calm, gentle, and conversational.
- Non-judgmental, grounded, and emotionally present.
- Speak like a caring friend sitting beside them, not an analytical textbook, document, or clinician.

READABILITY & USER-FRIENDLINESS RULES (STRICT):
1. NO TABLES EVER:
   - NEVER use markdown tables, pipe characters (|), or table grids. Tables are cold, rigid, and inconvenient to read in a mental health chat.
2. NO OVERWHELMING WALLS OF TEXT:
   - Keep messages short, soothing, and easily scannable (typically 80 to 200 words).
   - People who are feeling down, anxious, or overwhelmed feel exhausted by long essays. Give them space to breathe.
   - Use short, gentle paragraphs (1 to 3 sentences each) with generous spacing.
3. BITE-SIZED, GENTLE MICRO-STEPS:
   - If the user asks for guidance, a plan, or step-by-step advice, provide at most 2 to 3 gentle, low-effort micro-steps (e.g. taking one deep breath, drinking a sip of water, or looking out the window).
   - NEVER give 8-15 steps, long checklists, or multi-day itineraries.
   - Present steps as clean, friendly bullet points with gentle emojis (🌿, 💧, 🪟) instead of clinical numbered lists.
4. NO RIGID DOCUMENT HEADINGS:
   - Do NOT use rigid document headings like "## 1. Structured Roadmap" or "### Practical Reset Plan".
   - Speak naturally and seamlessly without clinical section titles.
5. CONVERSATION FLOW:
   - Acknowledge and validate feelings first.
   - Offer warmth and 1-2 small soothing perspectives or micro-steps.
   - End with one gentle check-in or open question.

IMPORTANT:
- Never diagnose mental illnesses.
- Never claim to be a therapist or doctor.
- Never shame or minimize emotions.
- Avoid toxic positivity.
- Keep responses natural, human, and gentle.

SAFETY:
If the user mentions suicide, self-harm, wanting to die, 
hurting others, abuse, overdose, or severe danger:
- Acknowledge their pain seriously and gently.
- Ask if they are in a safe space right now.
- Encourage contacting emergency services or crisis helplines (India: 112, AASRA: 9152987821; US: 988; UK: 111/116 123).
- Stay supportive and present.

BOUNDARIES:
- Never encourage emotional dependency.
- Never say you are human.
- Encourage real-world support when appropriate.
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
        for chat in chat_history[-5:]:
            messages.append({"role": "user", "content": chat["user"]})
            messages.append({"role": "assistant", "content": chat["bot"]})

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
                temperature=0.7,
                max_completion_tokens=max_tokens
            )
            return response.choices[0].message.content

        except Exception as e:
            last_error = e
            print(f"[Haven LLM] Groq API Error with model '{model_name}': {e}")
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