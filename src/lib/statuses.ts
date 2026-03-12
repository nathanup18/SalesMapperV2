export const STATUSES = [
  "NOT_HOME",
  "NOT_INTERESTED",
  "SOLD",
  "NOT_VISITED",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  NOT_HOME: "Not Home",
  NOT_INTERESTED: "Not Interested",
  SOLD: "Sold",
  NOT_VISITED: "Not Visited",
};

/** Hex colours used on the map and badges. */
export const STATUS_HEX: Record<Status, string> = {
  NOT_HOME: "#EAB308",      // yellow-500
  NOT_INTERESTED: "#EF4444", // red-500
  SOLD: "#22C55E",           // green-500
  NOT_VISITED: "#9CA3AF",    // gray-400
};

/** Tailwind bg+text pairs used for badges. */
export const STATUS_BADGE: Record<Status, string> = {
  NOT_HOME: "bg-yellow-100 text-yellow-800",
  NOT_INTERESTED: "bg-red-100 text-red-800",
  SOLD: "bg-green-100 text-green-800",
  NOT_VISITED: "bg-gray-100 text-gray-700",
};

/** The three statuses a rep can actively record (NOT_VISITED is implicit). */
export const PLACEABLE_STATUSES = [
  "SOLD",
  "NOT_HOME",
  "NOT_INTERESTED",
] as const satisfies readonly Status[];
