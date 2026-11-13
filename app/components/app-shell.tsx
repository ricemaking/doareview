import Link from "next/link";
import type { ReactNode } from "react";

const navigationItems = [
  { href: "/dashboard", icon: "⌂", label: "Home" },
  { href: "/subjects", icon: "◈", label: "Subjects" },
  { href: "/dashboard#review", icon: "↻", label: "Review" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf9ff] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white px-5 py-7 lg:block">
          <div className="mb-12 flex items-center gap-2 px-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-lg text-white shadow-lg shadow-violet-200">
              ✦
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              DoA<span className="text-violet-600">Review</span>
            </span>
          </div>

          <nav className="space-y-2" aria-label="Main navigation">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-400 hover:bg-slate-50"
                href={item.href}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
          {children}
        </section>
      </div>
    </main>
  );
}
