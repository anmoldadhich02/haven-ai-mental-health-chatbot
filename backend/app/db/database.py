import sqlite3
from datetime import datetime

DB_NAME = "haven_memory.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    # Chats Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_message TEXT NOT NULL,
        bot_reply TEXT NOT NULL,
        risk_level TEXT,
        created_at TEXT
    )
    """)

    # Memories Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory TEXT NOT NULL,
        created_at TEXT
    )
    """)

    # Moods Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS moods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood TEXT NOT NULL,
        created_at TEXT
    )
    """)

    # Journals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS journals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


# =========================
# CHAT FUNCTIONS
# =========================

def save_chat(user_message, bot_reply, risk_level):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO chats
    (user_message, bot_reply, risk_level, created_at)
    VALUES (?, ?, ?, ?)
    """, (
        user_message,
        bot_reply,
        risk_level,
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def get_chats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id,
           user_message,
           bot_reply,
           risk_level,
           created_at
    FROM chats
    ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()
    return rows


# =========================
# MEMORY FUNCTIONS
# =========================

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
    INSERT INTO memories
    (memory, created_at)
    VALUES (?, ?)
    """, (
        memory,
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()

    return True


def get_memories():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id,
           memory,
           created_at
    FROM memories
    ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()
    return rows


def delete_memory(memory_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM memories WHERE id = ?",
        (memory_id,)
    )

    deleted = cursor.rowcount

    conn.commit()
    conn.close()

    return deleted > 0


# =========================
# MOOD FUNCTIONS
# =========================

def save_mood(mood):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO moods
    (mood, created_at)
    VALUES (?, ?)
    """, (
        mood,
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def get_moods():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id,
           mood,
           created_at
    FROM moods
    ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()
    return rows


# =========================
# JOURNAL FUNCTIONS
# =========================

def save_journal(content):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO journals
    (content, created_at)
    VALUES (?, ?)
    """, (
        content,
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()


def get_journals():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id,
           content,
           created_at
    FROM journals
    ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()
    return rows


def delete_journal(journal_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM journals WHERE id = ?",
        (journal_id,)
    )

    deleted = cursor.rowcount

    conn.commit()
    conn.close()

    return deleted > 0