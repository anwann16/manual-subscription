import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SALT_ROUNDS = 10;

// Demo accounts (PRD §19 Delivery: demo account tersedia).
const ACCOUNTS = [
  { email: "admin@example.com", password: "admin12345", role: "ADMIN" as const },
  { email: "user@example.com", password: "user12345", role: "USER" as const },
];

const PLANS = [
  {
    name: "Basic",
    description: "Cocok untuk perorangan yang baru mulai.",
    price: 50000,
    duration: 1,
    durationUnit: "MONTH" as const,
  },
  {
    name: "Pro",
    description: "Untuk tim kecil dengan kebutuhan rutin.",
    price: 135000,
    duration: 3,
    durationUnit: "MONTH" as const,
  },
  {
    name: "Business",
    description: "Untuk bisnis dengan kebutuhan jangka panjang.",
    price: 480000,
    duration: 12,
    durationUnit: "MONTH" as const,
  },
];

async function main() {
  for (const account of ACCOUNTS) {
    // Re-running the seed restores the documented demo credentials.
    const passwordHash = await bcrypt.hash(account.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, role: account.role },
      create: { email: account.email, passwordHash, role: account.role },
    });
  }

  for (const plan of PLANS) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
    });
    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await prisma.subscriptionPlan.create({ data: plan });
    }
  }

  console.log(
    `Seeded ${ACCOUNTS.length} accounts and ${PLANS.length} subscription plans.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
