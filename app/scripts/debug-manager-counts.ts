import { prisma } from '@/lib/db';

function startOfToday(): Date { const d=new Date(); d.setHours(0,0,0,0); return d; }
function endOfToday(): Date { const d=new Date(); d.setHours(23,59,59,999); return d; }

async function run(roleFilter: 'all'|'Runner'|'Satış Danışmanı') {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const roleWhere: any = roleFilter === 'all' ? {} : {
    OR: [
      { assignedTo: { userRoles: { some: { role: { name: roleFilter } } } } },
      { assignedToId: null, targetRole: roleFilter }
    ]
  };

  const [pending,inProgress,completed,total,todayCompleted] = await Promise.all([
    prisma.task.count({ where: { ...roleWhere, OR: [{ status: 'Bekliyor' }, { status: 'PENDING' }] } }),
    prisma.task.count({ where: { ...roleWhere, OR: [{ status: 'Devam Ediyor' }, { status: 'ASSIGNED' }] } }),
    prisma.task.count({ where: { ...roleWhere, status: 'Tamamlandı' } }),
    prisma.task.count({ where: roleWhere }),
    prisma.task.count({ where: { ...roleWhere, status: 'Tamamlandı', completedAt: { gte: todayStart, lte: todayEnd } } })
  ]);

  console.log({ roleFilter, pending, inProgress, completed, total, todayCompleted });
}

run('Runner')
  .then(async ()=>{ await prisma.$disconnect(); })
  .catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });


