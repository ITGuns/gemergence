import type { Metadata } from "next";
import {
  Hero,
  Problem,
  System,
  Fuel,
  Deskii,
  Offer,
  Ownership,
} from "@/components/home/intro-sections";
import {
  Industries,
  Process,
  Proof,
  Plans,
  Why,
  FinalCta,
} from "@/components/home/closing-sections";

export const metadata: Metadata = {
  title: "Classic view",
  robots: { index: false },
  alternates: { canonical: "/" },
};

/** The original editorial homepage, preserved in full. */
export default function ClassicHome() {
  return (
    <>
      <Hero />
      <Problem />
      <System />
      <Fuel />
      <Deskii />
      <Offer />
      <Ownership />
      <Industries />
      <Process />
      <Proof />
      <Plans />
      <Why />
      <FinalCta />
    </>
  );
}
