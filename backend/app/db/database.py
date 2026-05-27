import sqlite3
from datetime import datetime

DB_NAME = "haven_memory.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_message TEXT NOT NULL,
        bot_reply TEXT NOT NULL,
        risk_level TEXT,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory TEXT NOT NULL,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


def save_chat(user_message, bot_reply, risk_level):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO chats (user_message, bot_reply, risk_level, created_at)
    VALUES (?, ?, ?, ?)
    """, (user_message, bot_reply, risk_level, datetime.now().isoformat()))

    conn.commit()
    conn.close()


def get_chats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, user_message, bot_reply, risk_level, created_at FROM chats")
    rows = cursor.fetchall()

    conn.close()
    return rows


def save_memory(memory):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT memory FROM memories")
    existing_memories = cursor.fetchall()

    for item in existing_memories:
        if item[0].lower().strip() == memory.lower().strip():
            conn.close()
            return False

    cursor.execute("""
    INSERT INTO memories (memory, created_at)
    VALUES (?, ?)
    """, (memory, datetime.now().isoformat()))

    conn.commit()
    conn.close()

    return True


def get_memories():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, memory, created_at FROM memories")
    rows = cursor.fetchall()

    conn.close()
    return rows