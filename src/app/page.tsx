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

export default function Home() {
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
