"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GA_ID, track } from "@/lib/analytics";

/**
 * Loads GA4 and reports the events that mean money: page views, phone taps,
 * email taps, and any link marked `data-track="..."`. Form submissions are
 * reported by the forms themselves, on success only, via `track`.
 *
 * Phone and email taps are caught with one delegated listener rather than
 * per-link handlers, so a tel: link anywhere on the site counts without
 * anyone remembering to wire it. Renders nothing without an id.
 */
export default function Analytics() {
  const pathname = usePathname();

  // GA4's own page_view fires on the first load; client-side navigations
  // need to be reported by hand or the whole visit reads as one page.
  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest("a");
      if (!el) return;
      const href = el.getAttribute("href") ?? "";
      const label = el.dataset.track;
      if (href.startsWith("tel:")) {
        track("phone_call", { link_url: href, page_path: pathname });
      } else if (href.startsWith("mailto:")) {
        track("email_click", { link_url: href, page_path: pathname });
      } else if (label) {
        track("cta_click", { cta: label, link_url: href, page_path: pathname });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { send_page_view: false });`}
      </Script>
    </>
  );
}
