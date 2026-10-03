"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { NEWS, NEWS_FILTERS } from "@/features/news/data";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function NewsFeed() {
  const { t } = useI18n();
  const [topic, setTopic] = useState<(typeof NEWS_FILTERS)[number]>("all");
  const [sent, setSent] = useState(false);
  const stories = NEWS.filter((story) => topic === "all" || story.topic === topic);
  const [lead, ...rest] = stories;

  function handleFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">{t.news.title}</h1>
      <p className="mt-3 max-w-2xl text-white/55">{t.news.subtitle}</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {NEWS_FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTopic(id)}
            className={`h-10 rounded-full px-4 text-sm font-semibold transition ${
              topic === id ? "bg-brand text-ink" : "border border-white/15 text-white/70 hover:text-white"
            }`}
          >
            {t.news.topics[id]}
          </button>
        ))}
      </div>

      {lead && (
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <article className="overflow-hidden rounded-3xl border border-white/10">
            <Image src={lead.photo} alt="" width={1200} height={720} className="aspect-[16/10] w-full object-cover" />
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{t.news.topics[lead.topic]}</p>
              <h2 className="mt-2 font-heading text-2xl font-extrabold">{t.news.stories[lead.slug].title}</h2>
              <p className="mt-2 text-white/60">{t.news.stories[lead.slug].excerpt}</p>
              <p className="mt-4 text-sm font-semibold">{t.news.read}</p>
            </div>
          </article>
          <div className="grid gap-5">
            {rest.map((story) => (
              <article key={story.slug} className="overflow-hidden rounded-3xl border border-white/10 sm:flex">
                <Image src={story.photo} alt="" width={480} height={320} className="h-40 w-full object-cover sm:h-auto sm:w-40" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{t.news.topics[story.topic]}</p>
                  <h2 className="mt-2 font-heading text-lg font-bold">{t.news.stories[story.slug].title}</h2>
                  <p className="mt-2 text-sm text-white/55">{t.news.stories[story.slug].excerpt}</p>
                  <p className="mt-3 text-sm font-semibold">{t.news.read}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <section className="mt-16 max-w-xl rounded-3xl border border-white/10 p-6">
        <h2 className="font-heading text-2xl font-extrabold">{t.news.feedback.title}</h2>
        <p className="mt-2 text-sm text-white/55">{t.news.feedback.text}</p>
        <form onSubmit={handleFeedback} className="mt-5 space-y-3">
          <label className="block text-sm text-white/70">
            {t.news.feedback.topic}
            <select
              name="topic"
              className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-canvas px-4 outline-none focus:border-brand"
            >
              <option value="product">{t.news.topics.product}</option>
              <option value="careers">{t.news.topics.careers}</option>
              <option value="community">{t.news.topics.community}</option>
            </select>
          </label>
          <label className="block text-sm text-white/70">
            {t.news.feedback.body}
            <textarea
              required
              name="feedback"
              rows={4}
              className="mt-2 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-brand"
            />
          </label>
          <button type="submit" className="h-11 rounded-full bg-brand px-6 text-sm font-bold text-ink">
            {t.news.feedback.send}
          </button>
          {sent && <p className="text-sm text-brand">{t.news.feedback.thanks}</p>}
        </form>
      </section>
    </div>
  );
}
