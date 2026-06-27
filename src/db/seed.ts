import { db } from "./index";
import { users, services, bookings } from "./schema";

async function main() {
  console.log("Seeding database...");

  // Delete existing data to start fresh
  await db.delete(bookings);
  await db.delete(services);
  await db.delete(users);

  // 1. Seed users
  await db.insert(users).values([
    {
      id: "usr_1",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "prov_1",
      name: "Plumbing Expert",
      email: "provider1@example.com",
      role: "PROVIDER",
      isActive: true,
      rating: 4.8,
      createdAt: new Date(),
    },
    {
      id: "prov_2",
      name: "Electrical Master",
      email: "provider2@example.com",
      role: "PROVIDER",
      isActive: true,
      rating: 4.9,
      createdAt: new Date(),
    },
  ]);

  // 2. Seed services
  await db.insert(services).values([
    {
      id: "srv_1",
      title: "Leaky Pipe Repair",
      description: "Fixing leaky pipes and basic kitchen plumbing issues.",
      category: "PLUMBING",
      price: 80,
      providerId: "prov_1",
      isAvailable: true,
    },
    {
      id: "srv_2",
      title: "Drain Unclogging",
      description: "Clearing clogged drains in bathrooms and kitchens.",
      category: "PLUMBING",
      price: 60,
      providerId: "prov_1",
      isAvailable: true,
    },
    {
      id: "srv_3",
      title: "Ceiling Fan Installation",
      description: "Safe and quick mounting and wiring of ceiling fans.",
      category: "ELECTRICAL",
      price: 100,
      providerId: "prov_2",
      isAvailable: true,
    },
  ]);

  // 3. Seed bookings
  await db.insert(bookings).values([
    {
      id: "bkg_1",
      userId: "usr_1",
      serviceId: "srv_1",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000 * 5),
      status: "CONFIRMED",
      createdAt: new Date(),
    },
  ]);

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
