import TerritoryMap from "@/components/map/TerritoryMap";

// Map fills the full height of <main> (set to flex-1 min-h-0 in root layout)
export default function TerritoryPage() {
  return (
    <div className="h-full">
      <TerritoryMap />
    </div>
  );
}
