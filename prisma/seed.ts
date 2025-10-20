import { PrismaClient, ReportStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reports = [
    {
      title: "Large Pothole on Main Street",
      description:
        "A large pothole spanning half the lane causing drivers to swerve.",
      location: "Main St & 5th Ave, Brent",
      status: ReportStatus.VERIFIED,
      upVotes: 24,
      downVotes: 5
    },
    {
      title: "Deep Hole Near School Zone",
      description: "Deep pothole near Roosevelt Elementary school zone.",
      location: "Oak Street, near Roosevelt Elementary",
      status: ReportStatus.IN_PROGRESS,
      upVotes: 42,
      downVotes: 12
    },
    {
      title: "Cracked Pavement - Tripping Hazard",
      description:
        "Cracked pavement causing raised edges. Hazard for pedestrians.",
      location: "Cedar Ave & Park Blvd",
      status: ReportStatus.REPORTED,
      upVotes: 8,
      downVotes: 2
    },
    {
      title: "Multiple Small Potholes",
      description: "Cluster of small potholes that grow after each rainfall.",
      location: "Washington Street",
      status: ReportStatus.REPORTED,
      upVotes: 15,
      downVotes: 7
    }
  ];

  console.log("Seeding database...");

  await prisma.report.createMany({
    data: reports,
    skipDuplicates: true
  });

  console.log("Seeding completed!");
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
