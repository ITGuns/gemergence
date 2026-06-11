import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Gemfield Consulting collects, uses, and protects your information.",
};

/* Plain-English baseline policy. Have counsel review before launch. */
export default function PrivacyPage() {
  return (
    <section className="pb-20 pt-32 md:pt-40">
      <div className="container-g max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="font-display h1 mt-5 !text-[clamp(2rem,4vw,3rem)]">Privacy Policy</h1>
        <p className="mono-num mt-3 text-[0.85rem] text-ink2">Last updated: June 11, 2026</p>

        <div className="mt-10 space-y-8 leading-relaxed text-ink2 [&_h2]:font-display [&_h2]:text-[1.4rem] [&_h2]:text-ink">
          <div>
            <h2>What we collect</h2>
            <p className="mt-3">
              When you request an audit or contact us, we collect what you give us: your name,
              business name, email, phone, website address, industry, and anything you write in the
              form. We also use standard analytics tools that collect usage data (pages visited,
              device type, approximate location) to understand how the site is used.
            </p>
          </div>
          <div>
            <h2>How we use it</h2>
            <p className="mt-3">
              We use your information to prepare your audit, respond to your request, schedule and
              run calls, and — if you become a client — deliver services. If you opt in, we may send
              you relevant follow-up emails about your audit and our services. Every email includes
              an unsubscribe link, and unsubscribing is honored immediately.
            </p>
          </div>
          <div>
            <h2>What we never do</h2>
            <p className="mt-3">
              We do not sell your personal information. We do not share it with third parties except
              the service providers needed to operate this site and our services (e.g., scheduling,
              email delivery, analytics), each bound by their own privacy obligations.
            </p>
          </div>
          <div>
            <h2>Cookies & analytics</h2>
            <p className="mt-3">
              We use analytics and, when campaigns are active, advertising pixels (e.g., Google,
              Meta) to measure site performance and reach people who visited this site. You can
              control cookies through your browser settings.
            </p>
          </div>
          <div>
            <h2>Your choices</h2>
            <p className="mt-3">
              You can request a copy of the information we hold about you, ask us to correct it, or
              ask us to delete it — just email{" "}
              <a className="font-semibold text-emerald" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
              . California residents have additional rights under the CCPA, which we honor.
            </p>
          </div>
          <div>
            <h2>Contact</h2>
            <p className="mt-3">
              Gemfield Consulting · San Francisco, CA ·{" "}
              <a className="font-semibold text-emerald" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
