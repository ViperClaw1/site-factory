"use client";

import { useEffect, useSyncExternalStore } from "react";

const KEY = "edu-cart";
const EMPTY: string[] = [];

let ids: string[] = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(next: string[]) {
  ids = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCartIds() {
  const value = useSyncExternalStore(subscribe, () => ids, () => EMPTY);

  useEffect(() => {
    const stored = read();
    if (ids.length > 0 && stored.length === 0) write(ids);
    else {
      ids = stored;
      emit();
    }
    const onStorage = () => {
      ids = read();
      emit();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return value;
}

export function addToCart(id: string) {
  const current = ids === EMPTY ? read() : ids;
  if (current.includes(id)) return;
  write([...current, id]);
}

export function removeFromCart(id: string) {
  const current = ids === EMPTY ? read() : ids;
  write(current.filter((item) => item !== id));
}

export function clearCart() {
  write([]);
}
