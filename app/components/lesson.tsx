"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { questions, type Question, xpAward } from "../lib/course-data";
import {
  completeLesson,
  recordIncorrectAnswer,
  readProgress,
  readGeneratedQuestions,
  resolveReviewQuestion,
  saveGeneratedQuestion,
} from "../lib/progress";

type LessonProps = {
  reviewConcept: string | null;
};

function getReviewQuestions(
  reviewConcept: string,
  savedQuestions: Question[],
  missedQuestionIds: string[],
): Question[] {
  const allQuestions = [...questions, ...savedQuestions];
  const missedQuestions = allQuestions.filter(
    (question) =>
      question.concept === reviewConcept &&
      missedQuestionIds.includes(question.id),
  );

  if (missedQuestions.length > 0) {
    return missedQuestions;
  }

  return allQuestions.filter((question) => question.concept === reviewConcept);
}

export function Lesson({ reviewConcept }: LessonProps) {
  const router = useRouter();
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [missedQuestionIds, setMissedQuestionIds] = useState<string[]>([]);
  const [hasLoadedSavedQuestions, setHasLoadedSavedQuestions] = useState(false);
  const lessonQuestions = reviewConcept
    ? getReviewQuestions(reviewConcept, savedQuestions, missedQuestionIds)
    : questions;
  const lessonId = reviewConcept
    ? `review-${reviewConcept.toLowerCase().replaceAll(" ", "-")}`
    : "databases-quick-review";
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(
    null,
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const completionSaved = useRef(false);

  const activeQuestions = aiQuestion
    ? [
        aiQuestion,
        ...lessonQuestions.filter((item) => item.id !== aiQuestion.id),
      ]
    : lessonQuestions;
  const activeLessonId = aiQuestion ? `ai-${aiQuestion.id}` : lessonId;
  const question = activeQuestions[questionIndex];
  const isComplete = questionIndex >= activeQuestions.length;
  const isCorrect = selectedId === question?.correctOptionId;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSavedQuestions(readGeneratedQuestions());
      if (reviewConcept) {
        const review = readProgress().reviewConcepts.find(
          (item) => item.concept === reviewConcept,
        );
        setMissedQuestionIds(review?.questionIds ?? []);
      }
      setHasLoadedSavedQuestions(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [reviewConcept]);

  useEffect(() => {
    if (!hasLoadedSavedQuestions || !isComplete || completionSaved.current) {
      return;
    }

    completionSaved.current = true;
    completeLesson(activeLessonId, score, activeQuestions.length, earnedXp, {
      repeatable: Boolean(reviewConcept || aiQuestion),
    });

  }, [
    earnedXp,
    hasLoadedSavedQuestions,
    isComplete,
    activeLessonId,
    activeQuestions.length,
    aiQuestion,
    reviewConcept,
    score,
  ]);

  function handleSubmit() {
    if (!selectedId) return;

    if (selectedId === question.correctOptionId) {
      if (reviewConcept) {
        resolveReviewQuestion(reviewConcept, question.id);
      }
      setScore((current) => current + 1);
      setEarnedXp((current) => current + xpAward.correct);
    } else {
      if (!reviewConcept) {
        setEarnedXp((current) => current + xpAward.incorrect);
      }
      recordIncorrectAnswer(question.concept, question.id);
    }

    setSubmitted(true);
  }

  function handleNext() {
    setSelectedId(null);
    setSubmitted(false);
    setQuestionIndex((current) => current + 1);
  }

  async function handleGenerateQuestion() {
    setIsGenerating(true);
    setGenerationMessage(null);

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: reviewConcept ?? question?.concept,
          subject: "databases",
        }),
      });
      const data = (await response.json()) as {
        question?: Question;
        source?: "gemini" | "fallback";
        error?: string;
      };

      console.log(data);

      if (!response.ok || !data.question) {
        throw new Error(data.error ?? "Unable to generate a question.");
      }

      if (data.source === "gemini") {
        saveGeneratedQuestion(data.question);
      }

      setAiQuestion(data.question);
      setQuestionIndex(0);
      setSelectedId(null);
      setSubmitted(false);
      setScore(0);
      setEarnedXp(0);
      completionSaved.current = false;
      setGenerationMessage(
        data.source === "gemini"
          ? "Generated with Gemini"
          : "Using a built-in practice question",
      );
    } catch (error) {
      setGenerationMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate a question.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (!hasLoadedSavedQuestions) {
    return <main className="min-h-screen bg-[#faf9ff]" />;
  }

  if (isComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9ff] px-5 py-10 text-slate-800">
        <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-7 text-center shadow-xl shadow-violet-100 sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-4xl">
            🎉
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
            {reviewConcept ? "Review complete" : "Quest complete"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            You did it!
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {reviewConcept
              ? "Nice work revisiting a concept that needs more practice."
              : "Great work strengthening your database foundations. Consistency is how knowledge sticks."}
          </p>
          <div className="my-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-2xl font-extrabold text-violet-700">
                {score}/{activeQuestions.length}
              </p>
              <p className="mt-1 text-xs font-bold text-violet-400">
                Correct answers
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-2xl font-extrabold text-orange-600">
                +{earnedXp} XP
              </p>
              <p className="mt-1 text-xs font-bold text-orange-400">
                Earned today
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9ff] text-slate-800">
      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-8">
        <header className="mb-10 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-50"
            aria-label="Exit lesson"
          >
            ‹
          </button>
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>
                {reviewConcept ? "TARGETED REVIEW" : "DATABASES · QUICK REVIEW"}
              </span>
              <span>
                {questionIndex + 1} / {activeQuestions.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{
                  width: `${(questionIndex / activeQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </header>

        <div className="mb-8">
          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">
            {question.concept}
          </span>
          <h1 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {question.prompt}
          </h1>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateQuestion}
            disabled={isGenerating || submitted}
            className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-extrabold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate AI practice"}
          </button>
          {generationMessage && (
            <span className="text-xs font-semibold text-slate-400">
              {generationMessage}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedId === option.id;
            const isAnswer = option.id === question.correctOptionId;
            let stateClass =
              "border-slate-100 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50/50";
            let badgeClass = "bg-slate-100 text-slate-500";
            let statusIcon: string | null = null;

            if (submitted && isAnswer) {
              stateClass =
                "border-emerald-400 bg-emerald-50 text-emerald-800";
              badgeClass = "bg-emerald-200 text-emerald-700";
              statusIcon = "✓";
            } else if (submitted && isSelected) {
              stateClass = "border-rose-400 bg-rose-50 text-rose-800";
              badgeClass = "bg-rose-200 text-rose-700";
              statusIcon = "×";
            } else if (isSelected) {
              stateClass =
                "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-100";
            }

            return (
              <button
                key={option.id}
                disabled={submitted}
                onClick={() => setSelectedId(option.id)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${stateClass}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${badgeClass}`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-sm font-bold">{option.label}</span>
                {statusIcon && (
                  <span className="ml-auto text-lg">{statusIcon}</span>
                )}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div
            className={`mt-6 rounded-2xl border p-4 ${
              isCorrect
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <p
              className={`text-sm font-extrabold ${
                isCorrect ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {isCorrect
                ? `That's right! +${xpAward.correct} XP`
                : reviewConcept
                  ? "Not quite — keep learning!"
                  : `Not quite — keep learning! +${xpAward.incorrect} XP`}
            </p>
            <p
              className={`mt-1 text-sm leading-6 ${
                isCorrect ? "text-emerald-700/80" : "text-rose-700/80"
              }`}
            >
              {question.explanation}
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          {!submitted ? (
            <button
              disabled={!selectedId}
              onClick={handleSubmit}
              className="rounded-xl bg-violet-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              Check answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-xl bg-violet-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              {questionIndex === activeQuestions.length - 1
                ? "See results"
                : "Next question"}{" "}
              <span className="ml-2">→</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
