"use client";

import { useEffect, useRef } from "react";
import { INTAKE_KEY, SITE, type Intake } from "@/lib/constants";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string;
        parentElement: HTMLElement;
        prefill?: { name?: string; email?: string };
      }) => void;
    };
  }
}

const widgetCss = "https://assets.calendly.com/assets/external/widget.css";
const widgetJs = "https://assets.calendly.com/assets/external/widget.js";

function calendlyUrl() {
  const joiner = SITE.calendly.includes("?") ? "&" : "?";
  return `${SITE.calendly}${joiner}hide_gdpr_banner=1&primary_color=0e5c45&text_color=15171a`;
}

function readIntake(): Intake | null {
  try {
    const saved = window.localStorage.getItem(INTAKE_KEY);
    return saved ? (JSON.parse(saved) as Intake) : null;
  } catch {
    return null;
  }
}

export function CalendlyEmbed() {
  const root = useRef<HTMLDivElement>(null);
  const intakeRef = useRef<Intake | null>(null);
  const notified = useRef(false);

  useEffect(() => {
    const parent = root.current;
    if (!parent) return;
    intakeRef.current = readIntake();
    const intake = intakeRef.current;

    if (!document.querySelector(`link[href="${widgetCss}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = widgetCss;
      document.head.appendChild(link);
    }

    const init = () => {
      if (!parent || !window.Calendly?.initInlineWidget) return;
      parent.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: calendlyUrl(),
        parentElement: parent,
        prefill: { name: intake?.name || "", email: intake?.email || "" },
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${widgetJs}"]`);
    if (existing) {
      if (window.Calendly?.initInlineWidget) init();
      else existing.addEventListener("load", init, { once: true });
      return () => existing.removeEventListener("load", init);
    }

    const script = document.createElement("script");
    script.src = widgetJs;
    script.async = true;
    script.addEventListener("load", init, { once: true });
    document.body.appendChild(script);
    return () => script.removeEventListener("load", init);
  }, []);

  // When Calendly confirms a booking, route the details to the company inbox.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "https://calendly.com") return;
      if (event.data?.event !== "calendly.event_scheduled" || notified.current) return;
      notified.current = true;
      const intake = intakeRef.current ?? readIntake();
      const body = new FormData();
      const payload: Record<string, string> = {
        _subject: "Audit call booked (Calendly confirmed)",
        name: intake?.name || "Unknown",
        business: intake?.biz || "Unknown",
        email: intake?.email || "Unknown",
        phone: intake?.phone || "",
        website: intake?.url || "",
        industry: intake?.industry || "",
        goals: intake?.goals?.join(", ") || "",
        notes: intake?.notes || "",
      };
      Object.entries(payload).forEach(([k, v]) => body.append(k, v));
      fetch(SITE.formEndpoint, { method: "POST", headers: { Accept: "application/json" }, body }).catch(
        () => {
          notified.current = false;
        }
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div>
      <div ref={root} className="min-h-[640px] overflow-hidden rounded-xl border border-hairline bg-white" />
      <p className="mt-3 text-[0.85rem] text-ink2">
        Scheduler not loading?{" "}
        <a className="font-semibold text-emerald" href={calendlyUrl()} target="_blank" rel="noreferrer">
          Open Calendly in a new tab
        </a>{" "}
        or email{" "}
        <a className="font-semibold text-emerald" href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>
        .
      </p>
    </div>
  );
}
