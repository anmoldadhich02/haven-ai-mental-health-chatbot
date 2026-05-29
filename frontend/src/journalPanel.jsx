import React, { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, RefreshCw, Trash2 } from "lucide-react";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export default function JournalPanel() {
  const [content, setContent] = useState("");
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const res = await api.get("/journal/");
      setJournals(res.data.journals || []);
    } catch (error) {
      console.error("Failed to fetch journals:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveJournal = async () => {
    if (!content.trim()) return;

    try {
      await api.post("/journal/", {
        content: content.trim(),
      });

      setContent("");
      fetchJournals();
    } catch (error) {
      console.error("Failed to save journal:", error);
    }
  };

  const deleteJournal = async (id) => {
    try {
      await api.delete(`/journal/${id}`);
      setJournals((prev) => prev.filter((journal) => journal.id !== id));
    } catch (error) {
      console.error("Failed to delete journal:", error);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
            <BookOpen size={18} className="text-[var(--sage)]" />
            Journal
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Reflect on your thoughts privately
          </p>
        </div>

        <button
          onClick={fetchJournals}
          className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-2 text-[var(--muted)] hover:text-[var(--text)]"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a small reflection..."
        rows={4}
        className="mb-3 w-full resize-none rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
      />

      <button
        onClick={saveJournal}
        className="mb-5 w-full rounded-2xl border border-[var(--border)] bg-[rgba(90,138,110,0.22)] px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[rgba(90,138,110,0.32)]"
      >
        Save Reflection
      </button>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading journals...</p>
      ) : journals.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-[var(--muted)]">
          No journal entries yet.
        </div>
      ) : (
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {journals.slice(0, 5).map((journal) => (
            <div
              key={journal.id}
              className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-6 text-[var(--text)]">
                  {journal.content}
                </p>

                <button
                  onClick={() => deleteJournal(journal.id)}
                  className="rounded-lg p-1 text-[var(--muted-2)] hover:bg-[rgba(255,255,255,0.04)] hover:text-red-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <p className="mt-2 text-xs text-[var(--muted-2)]">
                {new Date(journal.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}