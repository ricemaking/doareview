import { AppShell } from "../components/app-shell";
import { subjects } from "../lib/course-data";

export default function SubjectsPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <p className="text-sm font-semibold text-violet-600">
          Your learning library
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Subjects
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Choose a subject to review concepts and build lasting knowledge.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {subjects.map((subject) => (
          <article
            key={subject.id}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(40,35,80,0.04)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl text-violet-600">
                {subject.icon}
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900">
                  {subject.name}
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {subject.code}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>{subject.completedLessons} lessons completed</span>
              <span>{subject.progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${subject.progress}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}