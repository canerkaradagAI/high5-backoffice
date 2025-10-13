import { prisma } from '@/lib/db';

async function main() {
  const deleted = await prisma.task.deleteMany({
    where: {
      OR: [
        { targetRole: null },
        { targetRole: '' }
      ]
    }
  });
  console.log(`Deleted tasks without targetRole: ${deleted.count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


