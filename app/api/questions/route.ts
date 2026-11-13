import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { questions, type Question } from "../../lib/course-data";

type GenerateRequest = {
  concept?: string;
  subject?: string;
};

function fallbackQuestion(concept?: string): Question {
  const matchingQuestion = questions.find(
    (question) => !concept || question.concept === concept,
  );

  if (!matchingQuestion) {
    return questions[0];
  }

  return {
    ...matchingQuestion,
    id: `fallback-${matchingQuestion.id}`,
  };
}

// parses a question from a string and returns null if the string is not valid JSON or does not match the expected shape
function parseQuestion(text: string): Question | null {
  try {
    const parsed = JSON.parse(text) as Partial<Question>;
    const options = parsed.options;
    const hasValidOptions =
      Array.isArray(options) &&
      options.length === 4 &&
      options.every(
        (option) =>
          typeof option?.id === "string" &&
          typeof option?.label === "string",
      );

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.concept !== "string" ||
      typeof parsed.prompt !== "string" ||
      typeof parsed.explanation !== "string" ||
      !hasValidOptions ||
      !options.some((option) => option.id === parsed.correctOptionId)
    ) {
      return null;
    }

    return {
      id: parsed.id,
      concept: parsed.concept,
      prompt: parsed.prompt,
      options,
      correctOptionId: parsed.correctOptionId as string,
      explanation: parsed.explanation,
    };
  } catch {
    return null;
  }
}

// creates a new question using the Gemini API and returns it, or returns a fallback question if the request fails or the response is invalid
export async function POST(request: Request) {
  let body: GenerateRequest;

  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  // trim the concept and subject to remove any leading or trailing whitespace
  const concept = body.concept?.trim();
  const subject = body.subject?.trim();
  const fallback = fallbackQuestion(concept);

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      question: fallbackQuestion(concept),
      source: "fallback",
    });
  }

  const prompt = [
    "Create one university-level multiple-choice practice question that is similar to the style of the existing question.",
    `Subject: ${subject}.`,
    concept ? `Concept: ${concept}.` : "",
    `Existing question: ${JSON.stringify(fallback)}.`,
    "Return only valid JSON with this exact shape:",
    '{"id":"string","concept":"string","prompt":"string","options":[{"id":"a","label":"string"},{"id":"b","label":"string"},{"id":"c","label":"string"},{"id":"d","label":"string"}],"correctOptionId":"a","explanation":"string"}',
    "Use exactly four options and make the explanation teach the concept.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const models = ["gemini-3.8-flash", "gemini-3.5-flash"];

    for (const model of models) {
      try {
        const interaction = await ai.interactions.create({
          model,
          input: prompt,
          generation_config: {
            temperature: 0.4,
          },
          response_format: {
            type: "text",
            mime_type: "application/json",
          },
        });
        const question = interaction.output_text
          ? parseQuestion(interaction.output_text)
          : null;

        if (question) {
          return NextResponse.json({ question, source: "gemini" });
        }

        console.warn(`Gemini returned invalid output for ${model}.`);
      } catch (error) {
        console.warn(
          `Gemini request failed for ${model}.`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    console.warn("All Gemini question-generation models failed.");
    return NextResponse.json({
      question: fallback,
      source: "fallback",
    });
  } catch (error) {
    console.warn("Gemini client initialization failed.", error);
    return NextResponse.json({
      question: fallback,
      source: "fallback",
    });
  }
}
