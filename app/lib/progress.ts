import type { Question } from "./course-data";

export type UserProgress = {
  xp: number;
  streak: number;
  lastActivityDate: string | null;
  correctAnswers: number;
  answeredQuestions: number;
  completedLessonIds: string[];
  reviewConcepts: ReviewConcept[];
};

export type ReviewConcept = {
  concept: string;
  missedCount: number;
  lastMissedDate: string;
  questionIds: string[];
};

export const progressStorageKey = "doareview-progress";
export const generatedQuestionsStorageKey = "doareview-generated-questions";

export const defaultProgress: UserProgress = {
  xp: 0,
  streak: 0,
  lastActivityDate: null,
  correctAnswers: 0,
  answeredQuestions: 0,
  completedLessonIds: [],
  reviewConcepts: [],
};

export function readGeneratedQuestions(): Question[] {
  if (typeof window === "undefined") return [];

  const stored = window.localStorage.getItem(generatedQuestionsStorageKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? (parsed as Question[]) : [];
  } catch (error) {
    console.warn(
      "Unable to read saved DoAReview generated questions.",
      error,
    );
    return [];
  }
}

export function saveGeneratedQuestion(question: Question): Question[] {
  const current = readGeneratedQuestions();
  const nextQuestions = [
    ...current.filter((item) => item.id !== question.id),
    question,
  ];

  window.localStorage.setItem(
    generatedQuestionsStorageKey,
    JSON.stringify(nextQuestions),
  );
  return nextQuestions;
}

function asNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

export function readProgress(): UserProgress {
  if (typeof window === "undefined") return defaultProgress;

  const stored = window.localStorage.getItem(progressStorageKey);
  if (!stored) return defaultProgress;

  try {
    const parsed = JSON.parse(stored) as Partial<UserProgress>;
    const answeredQuestions = asNonNegativeInteger(
      parsed.answeredQuestions,
      defaultProgress.answeredQuestions,
    );
    const correctAnswers = Math.min(
      asNonNegativeInteger(
        parsed.correctAnswers,
        defaultProgress.correctAnswers,
      ),
      answeredQuestions,
    );

    return {
      ...defaultProgress,
      ...parsed,
      xp: asNonNegativeInteger(parsed.xp, defaultProgress.xp),
      streak: asNonNegativeInteger(parsed.streak, defaultProgress.streak),
      correctAnswers,
      answeredQuestions,
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds
        : [],
      reviewConcepts: Array.isArray(parsed.reviewConcepts)
        ? parsed.reviewConcepts.map((item) => ({
            ...item,
            questionIds: Array.isArray(item.questionIds)
              ? item.questionIds
              : [],
          }))
        : [],
    };
  } catch (error) {
    console.warn(
      "Unable to read saved DoAReview progress. Resetting to defaults.",
      error,
    );
    return defaultProgress;
  }
}

export function recordIncorrectAnswer(
  concept: string,
  questionId: string,
): UserProgress {
  const current = readProgress();
  const today = getDateKey(new Date());
  const existing = current.reviewConcepts.find(
    (item) => item.concept === concept,
  );
  const reviewConcepts = existing
    ? current.reviewConcepts.map((item) =>
        item.concept === concept
          ? {
              ...item,
              missedCount: item.missedCount + 1,
              lastMissedDate: today,
              questionIds: item.questionIds.includes(questionId)
                ? item.questionIds
                : [...item.questionIds, questionId],
            }
          : item,
      )
    : [
        ...current.reviewConcepts,
        {
          concept,
          missedCount: 1,
          lastMissedDate: today,
          questionIds: [questionId],
        },
      ];
  const nextProgress = { ...current, reviewConcepts };

  window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
  return nextProgress;
}

export function resolveReviewQuestion(
  concept: string,
  questionId: string,
): UserProgress {
  const current = readProgress();
  const nextProgress = {
    ...current,
    reviewConcepts: current.reviewConcepts.flatMap((item) => {
      if (item.concept !== concept) {
        return [item];
      }

      if (item.questionIds.length === 0) {
        return [];
      }

      const questionIds = item.questionIds.filter((id) => id !== questionId);
      return questionIds.length > 0 ? [{ ...item, questionIds }] : [];
    }),
  };

  window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
  return nextProgress;
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateKey(yesterday);
}

export function getCurrentStreak(
  progress: UserProgress,
  today: string,
  yesterday: string,
): number {
  if (
    progress.lastActivityDate !== today &&
    progress.lastActivityDate !== yesterday
  ) {
    return 0;
  }

  return progress.streak;
}

export function completeLesson(
  lessonId: string,
  score: number,
  questionCount: number,
  earnedXp: number,
  options: { repeatable?: boolean } = {},
): UserProgress {
  const current = readProgress();
  const isRepeatable = options.repeatable ?? false;
  const today = getDateKey(new Date());
  const nextStreak =
    current.lastActivityDate === today
      ? current.streak
      : current.lastActivityDate === getYesterdayKey()
        ? current.streak + 1
        : 1;
  const hasCompletedLesson = current.completedLessonIds.includes(lessonId);
  const shouldApplyRewards = isRepeatable || !hasCompletedLesson;

  const nextProgress: UserProgress = {
    ...current,
    streak: nextStreak,
    lastActivityDate: today,
    xp: shouldApplyRewards ? current.xp + earnedXp : current.xp,
    correctAnswers: shouldApplyRewards
      ? current.correctAnswers + score
      : current.correctAnswers,
    answeredQuestions: shouldApplyRewards
      ? current.answeredQuestions + questionCount
      : current.answeredQuestions,
    completedLessonIds: hasCompletedLesson
      ? current.completedLessonIds
      : [...current.completedLessonIds, lessonId],
  };

  window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
  return nextProgress;
}