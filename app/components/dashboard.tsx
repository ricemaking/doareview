"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { subjects } from "../lib/course-data";
import {
  defaultProgress,
  getCurrentStreak,
  getDateKey,
  getYesterdayKey,
  readProgress,
  type UserProgress,
} from "../lib/progress";

function StatCard({
  value,
  label,
  icon,
  tone,
}: {
  value: string;
  label: string;
  icon: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(40,35,80,0.04)]">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${tone}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [progress, setProgress] = useState<UserProgress>(defaultProgress);
  const [isHydrated, setIsHydrated] = useState(false);
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [yesterdayKey, setYesterdayKey] = useState<string | null>(null);
  const [currentDateLabel, setCurrentDateLabel] = useState("Today");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(readProgress());
      setTodayKey(getDateKey(new Date()));
      setYesterdayKey(getYesterdayKey());
      setCurrentDateLabel(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      );
      setIsHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const hasCompletedDatabaseLesson = progress.completedLessonIds.includes("databases-quick-review");
  const databaseLessonCount = (hasCompletedDatabaseLesson ? 1 : 0);
  const databaseProgress = Math.round((databaseLessonCount / 12) * 100);
  const accuracy = progress.answeredQuestions
    ? Math.min(
        100,
        Math.round(
          (progress.correctAnswers / progress.answeredQuestions) * 100,
        ),
      )
    : 0;
  const level = Math.floor(progress.xp / 250);
  const streak =
    isHydrated && todayKey && yesterdayKey
      ? getCurrentStreak(progress, todayKey, yesterdayKey)
      : 0;
  const completedToday =
    isHydrated && progress.lastActivityDate === todayKey;
  const reviewConcepts = [...progress.reviewConcepts]
    .sort((first, second) => second.missedCount - first.missedCount)
    .slice(0, 3);

  return (
    <AppShell>
      <div id="dashboard">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-violet-600">
                {currentDateLabel}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Good morning, Name <span aria-hidden="true">👋</span>
              </h1>
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-lg shadow-sm"
              aria-label="Notifications"
            >
              🔔
            </button>
          </header>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              value={progress.xp.toLocaleString()}
              label="Total XP"
              icon="✦"
              tone="bg-violet-50 text-violet-600"
            />
            <StatCard
              value={`${streak} days`}
              label={completedToday ? "Streak active" : "Start today's streak"}
              icon="🔥"
              tone="bg-orange-50 text-orange-500"
            />
            <StatCard
              value={`Level ${level}`}
              label="Your level"
              icon="♢"
              tone="bg-cyan-50 text-cyan-600"
            />
            <StatCard
              value={`${accuracy}%`}
              label="Accuracy"
              icon="◎"
              tone="bg-emerald-50 text-emerald-500"
            />
          </div>

          <div className="mb-10 overflow-hidden rounded-3xl bg-violet-600 p-6 text-white shadow-xl shadow-violet-200 sm:p-8">
            <div className="max-w-xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-violet-200">
                {completedToday ? "Daily goal" : "Your next quest"}
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Mastering relational databases
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-violet-100">
                Build on your CSE 414 foundation with a quick review of joins,
                keys, and normalization.
              </p>
              <Link
                href="/lesson"
                className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-violet-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-50"
              >
                Continue learning <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-3 text-xs font-semibold text-violet-100 sm:mt-8">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-violet-400/50">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${databaseProgress}%` }}
                />
              </div>
              <span>{databaseLessonCount} / 12 lessons</span>
            </div>
          </div>

          <div className="grid gap-10 xl:grid-cols-[1.4fr_1fr]">
            <section id="subjects">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Your learning path
                </h2>
                <button className="text-sm font-bold text-violet-600 hover:text-violet-700">
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {subjects.map((subject) => {
                  const isDatabase = subject.id === "databases";
                  const subjectProgress = isDatabase
                    ? databaseProgress
                    : subject.progress;
                  const completedLessons = isDatabase
                    ? databaseLessonCount
                    : subject.completedLessons;
                  const accentClasses =
                    subject.accent === "violet"
                      ? "bg-violet-100 text-violet-600"
                      : subject.accent === "cyan"
                        ? "bg-cyan-100 text-cyan-600"
                        : "bg-amber-100 text-amber-600";
                  const progressClasses =
                    subject.accent === "violet"
                      ? "bg-violet-500"
                      : subject.accent === "cyan"
                        ? "bg-cyan-500"
                        : "bg-amber-500";

                  return (
                    <div
                      key={subject.id}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(40,35,80,0.03)] transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${accentClasses}`}
                      >
                        {subject.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-slate-800">
                            {subject.name}
                          </h3>
                          <span className="text-xs font-bold text-slate-400">
                            {subjectProgress}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-slate-400">
                          {subject.code} · {completedLessons} of {subject.lessons}{" "}
                          lessons
                        </p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${progressClasses}`}
                            style={{ width: `${subjectProgress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-slate-300">›</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="review">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Needs a review
                </h2>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-500">
                  {reviewConcepts.length}{" "}
                  {reviewConcepts.length === 1 ? "concept" : "concepts"}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_4px_20px_rgba(40,35,80,0.03)]">
                {reviewConcepts.length ? (
                  reviewConcepts.map((concept, index) => {
                    const reviewAccent =
                      index === 0
                        ? "bg-rose-50 text-rose-500"
                        : index === 1
                          ? "bg-cyan-50 text-cyan-600"
                          : "bg-amber-50 text-amber-600";

                    return (
                      <Link
                        key={concept.concept}
                        href={`/lesson?review=${encodeURIComponent(concept.concept)}`}
                        className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${reviewAccent}`}
                        >
                          ↻
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-700">
                            {concept.concept}
                          </p>
                          <p className="text-xs font-medium text-slate-400">
                            Missed {concept.missedCount}{" "}
                            {concept.missedCount === 1 ? "time" : "times"}
                          </p>
                        </div>
                        <span className="text-slate-300">›</span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-4">
                    <p className="text-sm font-bold text-slate-700">
                      You’re all caught up!
                    </p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
                      Missed concepts will appear here after a lesson.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
      </div>
    </AppShell>
  );
}
