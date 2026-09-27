"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../api";

// Current Supabase user, live. `ready` is false until the initial session is
// known — lets the UI avoid flashing guest controls for a signed-in visitor.
export function useUser() {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({ user: null, ready: false });

  useEffect(() => {
    const { data } = supabaseBrowser().auth.onAuthStateChange((_event, session) =>
      setState({ user: session?.user ?? null, ready: true }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
