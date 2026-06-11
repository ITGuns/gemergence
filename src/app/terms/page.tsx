import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The plain-English terms for working with Gemfield Consulting.",
};

/*
 * Plain-English baseline terms. Encodes the DRAFT free-build ownership model
 * from SITE-PLAN §11 item 0 — founder must confirm, and counsel should review,
 * before launch. The signed services agreement governs client engagements.
 */
export default function TermsPage() {
  return (
    <section className="pb-20 pt-32 md:pt-40">
      <div className="container-g max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="font-display h1 mt-5 !text-[clamp(2rem,4vw,3rem)]">Terms of Service</h1>
        <p className="mono-num mt-3 text-[0.85rem] text-ink2">Last updated: June 11, 2026</p>

        <div className="mt-10 space-y-8 leading-relaxed text-ink2 [&_h2]:font-display [&_h2]:text-[1.4rem] [&_h2]:text-ink">
          <div>
            <h2>The basics</h2>
            <p className="mt-3">
              This website is operated by Gemfield Consulting (&ldquo;Gemfield&rdquo;). Using the
              site, requesting an audit, or booking a call doesn&apos;t create a client
              relationship — that begins when both sides sign a services agreement. These terms
              cover the site itself and summarize, in plain English, how our engagements work. If
              anything here conflicts with a signed agreement, the signed agreement wins.
            </p>
          </div>
          <div>
            <h2>Plans, term, and cancellation</h2>
            <p className="mt-3">
              Monthly plans are month-to-month. There are no long-term contracts and no cancellation
              fees. Cancel with notice before your next billing date and you simply aren&apos;t
              billed again. We earn the next month or we don&apos;t deserve it.
            </p>
          </div>
          <div>
            <h2>Ownership</h2>
            <p className="mt-3">
              Your domain, your content, your customer data, and your business accounts (Google,
              analytics, advertising) are yours from day one — registered and held in your name. For
              websites we build as part of a monthly plan, the build itself becomes fully yours
              after 12 months on any plan, or you may buy it out at any time before that at a
              published price. Standalone (Website-Only) builds are yours outright on final payment.
              When an engagement ends, we hand over access and provide a complete export of your
              data.
            </p>
          </div>
          <div>
            <h2>Marketing services</h2>
            <p className="mt-3">
              Marketing management (Growth Fuel) is billed as a flat monthly fee. Advertising budgets
              are paid by you directly to the advertising platforms, in accounts you own. We never
              take a percentage of your ad spend.
            </p>
          </div>
          <div>
            <h2>Honest expectations</h2>
            <p className="mt-3">
              We don&apos;t guarantee specific rankings, lead volumes, or revenue outcomes — and we
              encourage you to be skeptical of anyone who does. What we commit to is the work, done
              properly, visible in Deskii, reported honestly.
            </p>
          </div>
          <div>
            <h2>The usual provisions</h2>
            <p className="mt-3">
              The site and its content are provided &ldquo;as is&rdquo; without warranties. To the
              extent permitted by law, Gemfield&apos;s liability related to use of this site is
              limited to the amount you paid us in the prior 12 months. These terms are governed by
              the laws of the State of California. Questions:{" "}
              <a className="font-semibold text-emerald" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
