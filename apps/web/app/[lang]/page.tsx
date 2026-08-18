import { Suspense } from "react";
import { HomeMap } from "@/components/home/home-map";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeMap />
    </Suspense>
  );
}
