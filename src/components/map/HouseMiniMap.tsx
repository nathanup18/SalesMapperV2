"use client";

import dynamic from "next/dynamic";

const MiniMapCore = dynamic(() => import("./MiniMapCore"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 text-xs">
      Loading map…
    </div>
  ),
});

export default function HouseMiniMap({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  return <MiniMapCore lat={lat} lng={lng} />;
}
