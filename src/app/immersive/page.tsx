import type { Metadata } from "next";
import ImmersiveHome from "@/components/immersive/immersive-home";

// The original immersive WebGL journey, preserved. Kept out of search so it
// doesn't compete with the canonical homepage for the same copy.
export const metadata: Metadata = {
  title: "The immersive journey",
  robots: { index: false },
};

export default function ImmersivePage() {
  return <ImmersiveHome />;
}
