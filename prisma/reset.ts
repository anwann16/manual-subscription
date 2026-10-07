import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Test-data reset: wipe the transactional tables and start ids back at 1, then
 * let the seed restore the demo accounts and catalogue. `TRUNCATE` is used
 * instead of `deleteMany` so sequences reset and a re-seed produces stable ids.
 */
async function main() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Payment", "Subscription", "SubscriptionPlan", "User" RESTART IDENTITY CASCADE',
  );

  console.log("Reset complete: all tables truncated.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
