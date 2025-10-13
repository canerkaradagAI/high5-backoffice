import { prisma } from '@/lib/db';

async function main() {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ status: 'Devam Ediyor' }, { status: 'ASSIGNED' }],
      AND: [
        {
          OR: [
            { assignedTo: { userRoles: { some: { role: { name: 'Runner' } } } } },
            { assignedToId: null, targetRole: 'Runner' }
          ]
        }
      ]
    },
    select: { id: true, title: true, status: true, assignedToId: true, targetRole: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(tasks, null, 2));
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });


