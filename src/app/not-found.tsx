import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export default function NotFound() {
  return (
    <section className="pb-24 pt-40">
      <div className="container-g max-w-2xl">
        <p className="eyebrow">404</p>
        <h1 className="font-display h1 mt-5 !text-[clamp(2.2rem,4.4vw,3.4rem)]">
          This page doesn&apos;t exist — which is exactly the kind of leak we fix.
        </h1>
        <p className="measure mt-6 text-[1.05rem] leading-relaxed text-ink2">
          The link may be old or mistyped. Either way, nothing is lost: the whole site is one click
          away, and so is the audit.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/" className="btn btn-ghost">
            Back to the homepage
          </Link>
          <Link href="/audit" className="btn btn-primary">
            Get a Free Growth Audit
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
