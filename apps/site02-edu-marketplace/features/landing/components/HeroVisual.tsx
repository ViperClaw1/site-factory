"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AwardIcon, FlameIcon, PlayIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { SKILLS } from "../data";

// ---- Code snippet, pre-tokenized so it stays highlighted while it types ----
const tokenColor = {
  kw: "text-[#C792EA]",
  fn: "text-[#82AAFF]",
  str: "text-[#C3E88D]",
  num: "text-[#F78C6C]",
  txt: "text-white/85",
  op: "text-white/50",
} as const;

const CODE: [string, keyof typeof tokenColor][] = [
  ["import", "kw"], [" pandas ", "txt"], ["as", "kw"], [" pd\n\n", "txt"],
  ["df", "txt"], [" = pd.", "op"], ["read_csv", "fn"], ["(", "op"], ['"sales.csv"', "str"], [")\n", "op"],
  ["top", "txt"], [" = df.", "op"], ["groupby", "fn"], ["(", "op"], ['"city"', "str"], [")[", "op"],
  ['"revenue"', "str"], ["].", "op"], ["sum", "fn"], ["()\n", "op"],
  ["print", "fn"], ["(top.", "op"], ["nlargest", "fn"], ["(", "op"], ["3", "num"], ["))", "op"],
];
const CODE_LENGTH = CODE.reduce((sum, [text]) => sum + text.length, 0);
const TYPE_MS = 45;
const PAUSE_TICKS = 70; // ~3s hold on the finished snippet before retyping

function useTypedLength() {
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(CODE_LENGTH);
      return;
    }
    const id = window.setInterval(() => {
      setTyped((n) => (n >= CODE_LENGTH + PAUSE_TICKS ? 0 : n + 1));
    }, TYPE_MS);
    return () => window.clearInterval(id);
  }, []);

  return Math.min(typed, CODE_LENGTH);
}

function TypedCode() {
  const typed = useTypedLength();
  let offset = 0;

  return (
    <pre className="h-[6.75rem] overflow-hidden whitespace-pre font-mono text-[11.5px] leading-5 sm:text-xs">
      {CODE.map(([text, kind], i) => {
        const visible = text.slice(0, Math.max(0, typed - offset));
        offset += text.length;
        return visible ? (
          <span key={i} className={tokenColor[kind]}>
            {visible}
          </span>
        ) : null;
      })}
      <span className="anim-caret ml-px inline-block h-4 w-[7px] translate-y-[3px] bg-brand" />
    </pre>
  );
}

export function HeroVisual() {
  const { t } = useI18n();

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[560px] [--r:150px] sm:[--r:225px] lg:[--r:235px] xl:[--r:262px]"
      aria-hidden
    >
      {/* ---- Orbit rings + skill badges (badges pass in front of the card) ---- */}
      <div className="absolute left-1/2 top-1/2 h-[calc(var(--r)*2)] w-[calc(var(--r)*2)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-[calc(var(--r)*1.4)] w-[calc(var(--r)*1.4)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />
      {SKILLS.map((skill, i) => (
        <div
          key={skill.name}
          className="orbit-item absolute left-1/2 top-1/2 z-20 h-0 w-0"
          style={{ "--a": `${i * 60}deg` } as CSSProperties}
        >
          <span className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-surface/90 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold shadow-lg shadow-black/40 backdrop-blur">
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-extrabold text-ink"
              style={{ backgroundColor: skill.color }}
            >
              {skill.name[0]}
            </span>
            {skill.name}
          </span>
        </div>
      ))}

      {/* ---- Floating course dashboard card ---- */}
      <div className="absolute left-1/2 top-1/2 z-10 w-[86%] max-w-[380px] -translate-x-1/2 -translate-y-1/2">
        <div className="anim-float rounded-3xl border border-white/10 bg-surface/95 p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-6">
          {/* Course header */}
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-extrabold text-ink">
              Py
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-bold sm:text-base">{t.dash.course}</p>
              <p className="text-xs text-muted">{t.dash.lesson}</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              live
            </span>
          </div>

          {/* Editor with typing snippet */}
          <div className="mt-5 rounded-2xl border border-white/5 bg-ink/80 p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-2 font-mono text-[11px] text-white/40">analysis.py</span>
            </div>
            <TypedCode />
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">{t.dash.progress}</span>
              <span className="font-bold text-brand">68%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="anim-progress relative h-full overflow-hidden rounded-full bg-gradient-to-r from-brand-dark to-brand">
                <span className="anim-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </div>
            </div>
          </div>

          {/* Next lesson */}
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] p-3">
            <p className="truncate text-xs text-white/75">{t.dash.next}</p>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-ink">
              <PlayIcon className="h-3 w-3 fill-current" />
              {t.dash.cont}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Achievement toast ---- */}
      <div className="anim-toast absolute bottom-[6%] left-0 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-surface-2/95 py-3 pl-3 pr-5 shadow-2xl shadow-black/60 backdrop-blur-xl sm:left-[-2%]">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
          <AwardIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold">{t.dash.toastTitle}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <FlameIcon className="h-3.5 w-3.5 text-orange-400" />
            {t.dash.toastText}
          </p>
        </div>
      </div>
    </div>
  );
}
