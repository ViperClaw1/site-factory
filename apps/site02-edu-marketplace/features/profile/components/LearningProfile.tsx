"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/features/auth/hooks";
import { unsplash } from "@/features/landing/data";

const TABS = ["Overview", "My courses", "Certificates", "Settings"] as const;

const COURSES = [
  {
    title: "Python Developer",
    next: "Functions and modules",
    progress: 68,
    href: "/course/1",
    photo: unsplash("1515879218367-8466d910aaa4", 400),
  },
];

export function LearningProfile() {
  const { user } = useUser();
  const meta = user?.user_metadata as { full_name?: string; avatar_url?: string } | undefined;
  const name = meta?.full_name || "Alex Morgan";
  const email = user?.email || "alex@example.com";
  const first = name.split(" ")[0];
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">Learning profile</h1>
          <p className="mt-3 text-white/55">Good to see you again, {first}.</p>
        </div>
        <div className="flex items-center gap-3">
          {meta?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <Image
              src={unsplash("1507003211169-0a1dd7228f2d", 160)}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-white/45">{email}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`h-12 shrink-0 rounded-full px-5 text-sm font-semibold ${
              tab === item ? "bg-brand text-ink" : "text-white/45 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["38", "Hours learned"],
              ["12", "Day streak"],
              ["1", "Active courses"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 px-6 py-5">
                <dt className="font-heading text-4xl font-extrabold">{value}</dt>
                <dd className="mt-1 text-sm text-white/45">{label}</dd>
              </div>
            ))}
          </dl>
          <CourseList />
        </>
      )}

      {tab === "My courses" && <CourseList />}

      {tab === "Certificates" && (
        <article className="mt-8 max-w-lg rounded-3xl border border-white/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Certificate</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold">Intro to Python</h2>
          <p className="mt-2 text-sm text-white/55">Issued to {name}. Share it from your profile when you are ready.</p>
        </article>
      )}

      {tab === "Settings" && (
        <form className="mt-8 max-w-lg space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block text-sm text-white/70">
            Display name
            <input
              defaultValue={name}
              className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 outline-none focus:border-brand"
            />
          </label>
          <label className="block text-sm text-white/70">
            Email
            <input
              defaultValue={email}
              type="email"
              className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 outline-none focus:border-brand"
            />
          </label>
          <button type="submit" className="h-11 rounded-full bg-brand px-6 text-sm font-bold text-ink">
            Save changes
          </button>
        </form>
      )}
    </div>
  );
}

function CourseList() {
  return (
    <section className="mt-10">
      <h2 className="font-heading text-3xl font-extrabold">Continue learning</h2>
      <ul className="mt-5 space-y-4">
        {COURSES.map((course) => (
          <li key={course.title}>
            <Link href={course.href} className="flex gap-4 rounded-3xl border border-white/10 p-4 transition hover:border-white/25">
              <Image src={course.photo} alt="" width={160} height={120} className="h-24 w-28 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading text-lg font-bold">{course.title}</p>
                  <p className="font-semibold text-brand">{course.progress}%</p>
                </div>
                <p className="mt-1 text-sm text-white/50">Next lesson: {course.next}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${course.progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/40">{course.progress}% completed</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
