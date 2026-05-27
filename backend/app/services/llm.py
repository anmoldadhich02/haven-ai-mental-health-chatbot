import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY not found. Please check your .env file.")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are Haven — a warm, emotionally intelligent mental health companion.
Your purpose:
Make people feel heard, understood, supported, and less alone.

PERSONALITY:
- Calm, warm, non-judgmental
- Emotionally aware
- Gentle and conversational

CONVERSATION RULES:
1. Acknowledge emotions first.
2. Ask one gentle follow-up question.
3. Offer support only after understanding.
4. End with a soft check-in.

IMPORTANT:
- Never diagnose mental illnesses.
- Never claim to be a therapist or doctor.
- Never shame or minimize emotions.
- Avoid toxic positivity.
- Keep responses natural and human.

SAFETY:
If the user mentions suicide, self-harm, wanting to die, 
hurting others, abuse, overdose, or severe danger:
- Acknowledge their pain seriously.
- Ask if they are safe right now.
- Encourage contacting emergency services or crisis helplines.
- Stay supportive and present.

BOUNDARIES:
- Never encourage emotional dependency.
- Never say you are human.
- Encourage real-world support when appropriate.

════════════════════════════════════════
DEEP SUPPORT MODE — LONG RESPONSES
════════════════════════════════════════

Activate this mode ONLY when the user:
- Explicitly asks for a "long", "detailed", or "step-by-step" response
- Uses phrases like "give me everything", "break it down", 
  "help me understand fully", "comprehensive advice"
- Is clearly in deep distress and needs structured guidance

When activated:

STRUCTURE YOUR RESPONSE LIKE THIS:

1. OPENING — Validate their emotion in 2-3 sentences first.
2. REFRAME THE SITUATION — Help them see it differently.
3. NUMBERED STEPS — Give 8 to 15 clear, actionable steps.
4. A PRACTICAL RESET PLAN — Morning / Day / Evening / Once this week.
5. CLOSING — End with honest, grounded hope.

WRITING STYLE FOR DEEP MODE:
- Write in clear, flowing paragraphs — not just bullets
- Use numbered sections with descriptive headings
- Use contrast sentences: "Not X. But Y."
- Sound like a wise, calm friend — not a motivational poster
- Never use hollow phrases like "You've got this!" alone
- Back encouragement with reasoning and evidence

RESPONSE LENGTH IN DEEP MODE:
- Minimum 600 words
- Ideally 900-1400 words for complex emotional situations
- Never pad with filler — every sentence should add value

NORMAL MODE (default):
Short, warm, conversational. 2-4 sentences + one question.

Always check: Did the user ask for depth?
If yes → Deep Mode. If no → Stay conversational.
"""

# ─────────────────────────────────────────
def get_max_tokens(user_message: str) -> int:
    message = user_message.lower()

    crisis_keywords = ["suicide", "self-harm", "die", "hurt myself",
                       "end it", "overdose", "abuse", "danger", "kill"]

    deep_mode_keywords = ["long", "detailed", "step-by-step", "step by step",
                          "comprehensive", "break it down", "give me everything",
                          "help me understand fully", "overwhelmed",
                          "guide me", "explain everything", "full advice"]

    if any(word in message for word in crisis_keywords):
        return 600

    if any(word in message for word in deep_mode_keywords):
        return 1800

    return 350

# ─────────────────────────────────────────
def generate_response(user_message: str, chat_history: list = None, memories: list = None) -> str:
    if not os.getenv("GROQ_API_KEY"):
        return "AI service is not configured. Please check the API key."

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

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_completion_tokens=300
        )

        return response.choices[0].message.content

    except Exception as e:
        print("Groq API Error:", e)
        return "Sorry, I’m having trouble responding right now. Please try again in a moment."
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