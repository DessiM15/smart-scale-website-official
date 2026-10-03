"use client";

import { useCallback, useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type Turnstile = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id?: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

/**
 * The invisible bot check. Renders into the element the ref is given and
 * hands back a function that answers with the current token.
 *
 * With no site key the hook does nothing and the token is blank, which the
 * server reads as "the check is not set up" and lets through.
 */
export function useTurnstile() {
  const holder = useRef<HTMLDivElement | null>(null);
  const token = useRef("");
  const widget = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!SITE_KEY || !holder.current) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !holder.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(holder.current, {
        sitekey: SITE_KEY,
        size: "invisible",
        callback: (value: string) => {
          token.current = value;
        },
        "expired-callback": () => {
          token.current = "";
        },
      });
    };

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  /** The token, waiting up to four seconds for a check still in flight. */
  const getToken = useCallback(async (): Promise<string> => {
    if (!SITE_KEY) return "";
    for (let i = 0; i < 20 && !token.current; i++) await new Promise((r) => setTimeout(r, 200));
    return token.current;
  }, []);

  /** A token is good for one submission. */
  const reset = useCallback(() => {
    token.current = "";
    if (window.turnstile && widget.current) window.turnstile.reset(widget.current);
  }, []);

  return { holder, getToken, reset };
}
