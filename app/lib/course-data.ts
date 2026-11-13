export type AnswerOption = {
  id: string;
  label: string;
};

export type Question = {
  id: string;
  concept: string;
  prompt: string;
  options: AnswerOption[];
  correctOptionId: string;
  explanation: string;
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  icon: string;
  accent: string;
  progress: number;
  lessons: number;
  completedLessons: number;
};

export const xpAward = {
  correct: 20,
  incorrect: 5,
};

export const questions: Question[] = [
  {
    id: "joins",
    concept: "SQL joins",
    prompt:
      "Which SQL JOIN returns every row from the left table, including rows with no match in the right table?",
    options: [
      { id: "a", label: "INNER JOIN" },
      { id: "b", label: "LEFT JOIN" },
      { id: "c", label: "CROSS JOIN" },
      { id: "d", label: "RIGHT JOIN" },
    ],
    correctOptionId: "b",
    explanation:
      "A LEFT JOIN keeps every row from the left table and fills unmatched right-side columns with NULL.",
  },
  {
    id: "normalization",
    concept: "Database design",
    prompt: "What is the primary goal of database normalization?",
    options: [
      { id: "a", label: "Increase duplicate data" },
      { id: "b", label: "Make every query faster" },
      { id: "c", label: "Reduce redundancy and update anomalies" },
      { id: "d", label: "Remove all relationships" },
    ],
    correctOptionId: "c",
    explanation:
      "Normalization organizes related data to reduce unnecessary duplication and prevent inconsistent updates.",
  },
  {
    id: "index",
    concept: "Query performance",
    prompt:
      "What does a database index primarily help a query do?",
    options: [
      { id: "a", label: "Find rows faster" },
      { id: "b", label: "Store more duplicate records" },
      { id: "c", label: "Guarantee a sorted table" },
      { id: "d", label: "Replace a primary key" },
    ],
    correctOptionId: "a",
    explanation:
      "An index creates a data structure that can make lookups faster, though it adds storage and write overhead.",
  },
  {
    id: "acid",
    concept: "Transactions",
    prompt:
      "In ACID transactions, what does the `A` stand for?",
    options: [
      { id: "a", label: "Availability" },
      { id: "b", label: "Atomicity" },
      { id: "c", label: "Authorization" },
      { id: "d", label: "Aggregation" },
    ],
    correctOptionId: "b",
    explanation:
      "Atomicity means a transaction`s operations all succeed together or all roll back together.",
  },
  {
    id: "foreign-key",
    concept: "Data relationships",
    prompt: "What does a foreign key represent in a relational database?",
    options: [
      { id: "a", label: "A duplicated password" },
      { id: "b", label: "A link to a row in another table" },
      { id: "c", label: "A temporary table" },
      { id: "d", label: "A database backup" },
    ],
    correctOptionId: "b",
    explanation:
      "A foreign key references a key in another table, helping enforce valid relationships between records.",
  },
];

export const subjects: Subject[] = [
  {
    id: "databases",
    name: "Databases",
    code: "CSE 414",
    icon: "◈",
    accent: "violet",
    progress: 68,
    lessons: 12,
    completedLessons: 8,
  },
  {
    id: "algorithms",
    name: "Algorithms",
    code: "CSE 373",
    icon: "⌁",
    accent: "cyan",
    progress: 42,
    lessons: 15,
    completedLessons: 6,
  },
  {
    id: "statistics",
    name: "Statistics",
    code: "STAT 311",
    icon: "▦",
    accent: "amber",
    progress: 25,
    lessons: 10,
    completedLessons: 3,
  },
];
