# Haven – AI Mental Health Chatbot

Haven is an AI-powered mental health chatbot designed to provide users with a supportive and conversational space to express their thoughts and feelings.

The chatbot processes messages provided by users and generates contextually relevant responses using the **Groq API**. Its goal is to make basic emotional support and mental health conversations more accessible through an easy-to-use interface.

## Features

- **AI-Powered Conversations:** Generates responses using Groq-powered language models.
- **Conversational Interface:** Allows users to communicate naturally through a chatbot interface.
- **Contextual Responses:** Processes user input to provide relevant and meaningful replies.
- **User-Friendly Interface:** Provides a simple and accessible interface for interacting with the chatbot.
- **Database Integration:** Uses PostgreSQL for database management.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python / FastAPI |
| AI Integration | Groq API |
| Database | PostgreSQL |

## How It Works

1. The user enters a message describing their thoughts, feelings, or concerns.
2. The frontend sends the message to the backend.
3. The backend processes the input and communicates with the Groq API.
4. The AI model generates a response based on the user's message.
5. The response is returned to the frontend and displayed in the chat interface.

## Project Structure

```text
haven-ai-mental-health-chatbot/
│
├── backend/
│   └── Backend application files
│
├── frontend/
│   └── React application files
│
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Python 3.10 or above
- Node.js and npm
- PostgreSQL
- Git
- A Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/anmoldadhich02/haven-ai-mental-health-chatbot.git

cd haven-ai-mental-health-chatbot
```

### 2. Configure Environment Variables

Obtain an API key from [Groq Console](https://console.groq.com/).

Create a `.env` file in the backend directory:

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_postgresql_connection_string
```

Replace the placeholder values with your actual credentials.

**Important:** Never expose API keys or database credentials in frontend code or commit your `.env` file to GitHub.

### 3. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

Start the backend using the appropriate application entry point. For example, if the entry point is `main.py`:

```bash
uvicorn main:app --reload
```

### 4. Set Up the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application should now be accessible through the local development URL displayed in the terminal.

## AI Integration

Haven uses the Groq API to generate AI-powered conversational responses.

The backend securely handles API requests using the Groq API key stored in environment variables.

The response generation process involves:

- Receiving user messages.
- Processing conversational input.
- Sending the input to the configured Groq model.
- Receiving the generated response.
- Displaying the response to the user.

## Database

Haven uses **PostgreSQL** for database management and data storage.

## Live Demo

[Haven – AI Mental Health Chatbot](https://haven-ai-mental-health-chatbot.vercel.app/)

## Future Enhancements

- Improved conversational context and personalization.
- Better response handling for different emotional situations.
- Enhanced user experience and accessibility.
- Additional safety mechanisms for sensitive conversations.

## Important Disclaimer

Haven is an experimental AI-powered conversational support tool. It is not a substitute for professional mental health care, clinical diagnosis, therapy, or emergency services.

AI-generated responses may occasionally be inaccurate or inappropriate. Users experiencing serious mental health concerns should seek assistance from qualified mental health professionals.

## Contributors

Developed as a collaborative project to explore the use of Artificial Intelligence in accessible mental health support.

---

**Haven – A supportive space to express, reflect, and feel heard.**
