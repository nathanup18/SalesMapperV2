import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Denver, CO neighborhood grid
const C_LAT = 39.7392;
const C_LNG = -104.9903;
const dLAT = 0.0005; // ~55 m per step
const dLNG = 0.0007;

type HouseInput = { address: string; lat: number; lng: number };

const HOUSES: HouseInput[] = [
  { address: "123 Maple St", lat: C_LAT + 2 * dLAT, lng: C_LNG - 2 * dLNG },
  { address: "145 Maple St", lat: C_LAT + 2 * dLAT, lng: C_LNG - 1 * dLNG },
  { address: "167 Maple St", lat: C_LAT + 2 * dLAT, lng: C_LNG + 0 * dLNG },
  { address: "189 Maple St", lat: C_LAT + 2 * dLAT, lng: C_LNG + 1 * dLNG },
  { address: "211 Maple St", lat: C_LAT + 2 * dLAT, lng: C_LNG + 2 * dLNG },
  { address: "123 Oak Ave",  lat: C_LAT + 1 * dLAT, lng: C_LNG - 2 * dLNG },
  { address: "145 Oak Ave",  lat: C_LAT + 1 * dLAT, lng: C_LNG - 1 * dLNG },
  { address: "167 Oak Ave",  lat: C_LAT + 1 * dLAT, lng: C_LNG + 0 * dLNG },
  { address: "189 Oak Ave",  lat: C_LAT + 1 * dLAT, lng: C_LNG + 1 * dLNG },
  { address: "211 Oak Ave",  lat: C_LAT + 1 * dLAT, lng: C_LNG + 2 * dLNG },
  { address: "123 Pine Rd",  lat: C_LAT + 0 * dLAT, lng: C_LNG - 2 * dLNG },
  { address: "145 Pine Rd",  lat: C_LAT + 0 * dLAT, lng: C_LNG - 1 * dLNG },
  { address: "167 Pine Rd",  lat: C_LAT + 0 * dLAT, lng: C_LNG + 0 * dLNG },
  { address: "189 Pine Rd",  lat: C_LAT + 0 * dLAT, lng: C_LNG + 1 * dLNG },
  { address: "211 Pine Rd",  lat: C_LAT + 0 * dLAT, lng: C_LNG + 2 * dLNG },
  { address: "123 Elm Dr",   lat: C_LAT - 1 * dLAT, lng: C_LNG - 2 * dLNG },
  { address: "145 Elm Dr",   lat: C_LAT - 1 * dLAT, lng: C_LNG - 1 * dLNG },
  { address: "167 Elm Dr",   lat: C_LAT - 1 * dLAT, lng: C_LNG + 0 * dLNG },
  { address: "189 Elm Dr",   lat: C_LAT - 1 * dLAT, lng: C_LNG + 1 * dLNG },
  { address: "211 Elm Dr",   lat: C_LAT - 1 * dLAT, lng: C_LNG + 2 * dLNG },
];

type EventInput = {
  createdByName: string;
  type: "CREATE" | "EDIT";
  status: string;
  notes: string | null;
  daysAgo: number;
  hour: number;
};

const EVENTS: EventInput[][] = [
  [{ createdByName: "Alice Johnson", type: "CREATE", status: "SOLD",           notes: "Very interested, signed same day.",  daysAgo: 2, hour: 10 }],
  [{ createdByName: "Bob Smith",     type: "CREATE", status: "NOT_HOME",       notes: "Knocked twice, no answer.",          daysAgo: 1, hour: 14 }],
  [{ createdByName: "Carol White",   type: "CREATE", status: "NOT_INTERESTED", notes: "Has existing contract.",             daysAgo: 3, hour: 11 }],
  [], // no events yet
  [{ createdByName: "David Lee",     type: "CREATE", status: "SOLD",           notes: "Referral from neighbor at 123.",    daysAgo: 1, hour: 9  }],
  // 123 Oak Ave: visited twice — first NOT_HOME, then came back SOLD
  [
    { createdByName: "Alice Johnson", type: "CREATE", status: "NOT_HOME", notes: null,                             daysAgo: 4, hour: 16 },
    { createdByName: "Alice Johnson", type: "CREATE", status: "SOLD",     notes: "Caught them on second visit.",   daysAgo: 1, hour: 17 },
  ],
  [{ createdByName: "Bob Smith",     type: "CREATE", status: "NOT_INTERESTED", notes: "Renter, not owner.",                daysAgo: 2, hour: 13 }],
  // 167 Oak Ave: placed then edited notes
  [
    { createdByName: "Carol White",   type: "CREATE", status: "SOLD",     notes: "Signed on the spot.",            daysAgo: 1, hour: 10 },
    { createdByName: "Carol White",   type: "EDIT",   status: "SOLD",     notes: "Contract mailed — follow up.",   daysAgo: 0, hour: 9  },
  ],
  [{ createdByName: "David Lee",     type: "CREATE", status: "NOT_HOME",       notes: "Car in driveway but no answer.",    daysAgo: 2, hour: 15 }],
  [{ createdByName: "Alice Johnson", type: "CREATE", status: "NOT_INTERESTED", notes: "Do not revisit.",                   daysAgo: 5, hour: 11 }],
  [{ createdByName: "Bob Smith",     type: "CREATE", status: "NOT_HOME",       notes: null,                                daysAgo: 1, hour: 18 }],
  [{ createdByName: "Carol White",   type: "CREATE", status: "SOLD",           notes: "Called back next day, closed.",     daysAgo: 0, hour: 15 }],
  [], // no events yet
  [{ createdByName: "David Lee",     type: "CREATE", status: "NOT_HOME",       notes: "Left door hanger.",                 daysAgo: 3, hour: 12 }],
  [{ createdByName: "Alice Johnson", type: "CREATE", status: "NOT_INTERESTED", notes: "Owner on fixed income.",            daysAgo: 4, hour: 14 }],
  [{ createdByName: "Bob Smith",     type: "CREATE", status: "SOLD",           notes: "Easy close.",                       daysAgo: 0, hour: 11 }],
  [{ createdByName: "Carol White",   type: "CREATE", status: "NOT_HOME",       notes: null,                                daysAgo: 2, hour: 9  }],
  [], // no events yet
  [{ createdByName: "David Lee",     type: "CREATE", status: "NOT_INTERESTED", notes: "Already has a competitor.",        daysAgo: 1, hour: 16 }],
  [{ createdByName: "Alice Johnson", type: "CREATE", status: "NOT_HOME",       notes: null,                                daysAgo: 0, hour: 14 }],
];

function makeDate(daysAgo: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Resetting…");
  await prisma.doorEvent.deleteMany();
  await prisma.house.deleteMany();

  console.log("Seeding 20 houses with door events…");
  for (let i = 0; i < HOUSES.length; i++) {
    const h = HOUSES[i];
    const house = await prisma.house.create({
      data: { address: h.address, latitude: h.lat, longitude: h.lng },
    });
    for (const e of EVENTS[i] ?? []) {
      await prisma.doorEvent.create({
        data: {
          houseId: house.id,
          type: e.type,
          status: e.status,
          notes: e.notes,
          createdByName: e.createdByName,
          createdAt: makeDate(e.daysAgo, e.hour),
        },
      });
    }
  }
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
