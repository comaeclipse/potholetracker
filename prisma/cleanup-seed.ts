import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed titles to delete
  const seedTitles = [
    "Large Pothole on Main Street",
    "Deep Hole Near School Zone",
    "Cracked Pavement - Tripping Hazard",
    "Multiple Small Potholes"
  ];

  console.log("Cleaning up seed data...");
  console.log("Reports to delete:", seedTitles);

  const result = await prisma.report.deleteMany({
    where: {
      title: {
        in: seedTitles
      }
    }
  });

  console.log(`Deleted ${result.count} seed reports`);
  console.log("Cleanup completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
