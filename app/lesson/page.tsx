"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Lesson } from "../components/lesson";

function LessonRoute() {
  const searchParams = useSearchParams();
  const reviewConcept = searchParams.get("review");

  return <Lesson key={reviewConcept ?? "main"} reviewConcept={reviewConcept} />;
}

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf9ff]" />}>
      <LessonRoute />
    </Suspense>
  );
}
