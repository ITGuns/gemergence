import type { Metadata } from "next";
import { IntakeWizard } from "@/components/intake/intake-wizard";

export const metadata: Metadata = {
  title: "Start your website — 2-minute intake",
  description:
    "Tell us about your business in about 2 minutes. Your answers plus our research are everything we need to design and build your website.",
  robots: { index: false }, // post-purchase flow — not a landing page
};

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const s = typeof params.s === "string" ? params.s : undefined;
  const t = typeof params.t === "string" ? params.t : undefined;
  const plan = typeof params.plan === "string" ? params.plan : undefined;
  const resume = s && t ? { id: s, token: t } : undefined;

  return (
    <section className="pb-24 pt-32 md:pt-40">
      <div className="container-g max-w-2xl">
        <p className="eyebrow">Quick intake</p>
        <h1 className="font-display h1 mt-5 !text-[clamp(2rem,4vw,3rem)]">
          Your website, started.
        </h1>
        <p className="measure mt-5 text-[1.02rem] leading-relaxed text-ink2">
          Answer quickly and honestly — about 2 minutes. Our research team and your build
          preview handle the rest, and you&apos;ll refine everything before launch.
        </p>
        <div className="mt-10">
          <IntakeWizard resume={resume} plan={plan} />
        </div>
      </div>
    </section>
  );
}
