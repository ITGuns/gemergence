import type { Metadata } from "next";
import { SalesPanel } from "@/components/intake/sales-panel";

export const metadata: Metadata = {
  title: "Sales panel",
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return (
    <section className="pb-24 pt-32 md:pt-36">
      <div className="container-g max-w-5xl">
        <SalesPanel />
      </div>
    </section>
  );
}
