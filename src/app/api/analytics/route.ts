import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [events, houseCount] = await Promise.all([
    prisma.doorEvent.findMany({ select: { status: true, createdAt: true, createdByName: true } }),
    prisma.house.count(),
  ]);

  const total = events.length;
  const sold = events.filter((e) => e.status === "SOLD").length;
  const notInterested = events.filter((e) => e.status === "NOT_INTERESTED").length;
  const notHome = events.filter((e) => e.status === "NOT_HOME").length;

  const conversionRate =
    sold + notInterested > 0
      ? ((sold / (sold + notInterested)) * 100).toFixed(1)
      : null;

  const outreachRatio = total > 0 ? ((sold / total) * 100).toFixed(1) : null;

  // Hourly breakdown (0–23)
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`,
    count: events.filter((e) => new Date(e.createdAt).getHours() === h).length,
  }));

  // Day-of-week breakdown
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daily = DAY_NAMES.map((day, i) => ({
    day,
    count: events.filter((e) => new Date(e.createdAt).getDay() === i).length,
  }));

  // Rep leaderboard
  const repMap: Record<string, { doors: number; sales: number }> = {};
  for (const e of events) {
    if (!repMap[e.createdByName]) repMap[e.createdByName] = { doors: 0, sales: 0 };
    repMap[e.createdByName].doors++;
    if (e.status === "SOLD") repMap[e.createdByName].sales++;
  }
  const reps = Object.entries(repMap)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.sales - a.sales);

  return NextResponse.json({
    total,
    sold,
    notInterested,
    notHome,
    houseCount,
    conversionRate,
    outreachRatio,
    hourly,
    daily,
    reps,
  });
}
