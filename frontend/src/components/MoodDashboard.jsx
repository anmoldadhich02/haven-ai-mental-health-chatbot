import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const moodLabels = {
  happy: "😊 Good",
  neutral: "😐 Okay",
  sad: "😔 Low",
  anxious: "😰 Anxious",
  "very-sad": "😢 Rough",
};

export default function MoodDashboard() {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMoods = async () => {
    try {
      const res = await api.get("/mood/");
      setMoods(res.data.moods || []);
    } catch (error) {
      console.error("Failed to fetch moods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  const moodStats = useMemo(() => {
    const counts = {};

    moods.forEach((item) => {
      counts[item.mood] = (counts[item.mood] || 0) + 1;
    });

    const chartData = Object.entries(counts).map(([mood, count]) => ({
      mood: moodLabels[mood] || mood,
      count,
    }));

    const mostCommon =
      chartData.length > 0
        ? chartData.reduce((max, item) =>
            item.count > max.count ? item : max
          )
        : null;

    return {
      total: moods.length,
      chartData,
      mostCommon,
    };
  }, [moods]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
        Loading mood insights...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-lg">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Mood Insights
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Your emotional check-in patterns
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4">
          <div className="text-xs text-[var(--muted)]">Total Check-ins</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text)]">
            {moodStats.total}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4">
          <div className="text-xs text-[var(--muted)]">Most Common</div>
          <div className="mt-1 text-lg font-semibold text-[var(--text)]">
            {moodStats.mostCommon ? moodStats.mostCommon.mood : "No data"}
          </div>
        </div>
      </div>

      {moodStats.chartData.length > 0 ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moodStats.chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="mood" tick={{ fill: "#8b9a93", fontSize: 12 }} />
              <YAxis tick={{ fill: "#8b9a93", fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-[var(--muted)]">
          No mood data yet. Click a mood to start tracking.
        </div>
      )}

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-medium text-[var(--text)]">
          Recent Check-ins
        </h3>

        <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
          {moods.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm"
            >
              <span className="text-[var(--text)]">
                {moodLabels[item.mood] || item.mood}
              </span>
              <span className="text-xs text-[var(--muted-2)]">
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}