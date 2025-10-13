
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  TrendingUp,
  Target,
  ArrowLeft
} from 'lucide-react';
import { TasksList } from './tasks-list';
import { AddTaskModal } from './add-task-modal';
import { EditTaskModal } from './edit-task-modal';
import { TaskDetailModal } from './task-detail-modal';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface TaskStats {
  summary: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    today: number;
    thisWeek: number;
  };
  priority: Array<{ priority: string; count: number }>;
  type: Array<{ type: string; count: number }>;
  assignment: Array<{ userId: string; userName: string; taskCount: number }>;
}

interface ManagerStats {
  statusCounts: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    todayCompleted: number;
  };
  runners: Array<{ id: string; name: string; activeCount: number; completedToday: number; status: 'Aktif' | 'Pasif' }>;
  consultants: Array<{ id: string; name: string; activeCount: number; completedToday: number; status: 'Aktif' | 'Pasif'; activeCustomers: number }>;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    userRoles?: { role: { name: string } }[];
  } | null;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
  } | null;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams?.get('view');
  const { data: session } = useSession();
  const primaryRole = (session?.user as any)?.roles?.[0]?.name || 'Kullanıcı';
  const isManager = primaryRole === 'Mağaza Müdürü';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [managerStats, setManagerStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [assigneeRoleFilter, setAssigneeRoleFilter] = useState<'all' | 'Satış Danışmanı' | 'Runner'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Quick filter helpers (used by info cards)
  const setFilterAll = () => {
    setStatusFilter('all');
    setCurrentPage(1);
  };
  const setFilterPending = () => {
    setStatusFilter('Bekliyor');
    setCurrentPage(1);
  };
  const setFilterInProgress = () => {
    setStatusFilter('Devam Ediyor');
    setCurrentPage(1);
  };
  const setFilterCompleted = () => {
    setStatusFilter('Tamamlandı');
    setCurrentPage(1);
  };

  const fetchStats = async () => {
    try {
      const isManager = primaryRole === 'Mağaza Müdürü';
      const scope = isManager ? 'all' : (searchParams?.get('view') === 'my' ? 'mine' : 'requests');
      const response = await fetch(`/api/tasks/stats?scope=${scope}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
      if (isManager) {
        const res = await fetch(`/api/tasks/stats/manager?role=${encodeURIComponent(assigneeRoleFilter)}`);
        if (res.ok) {
          const d = await res.json();
          setManagerStats(d);
        }
      } else {
        setManagerStats(null);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
        assignedTo: assignedToFilter
      });

      const view = searchParams?.get('view');
      if (view === 'my') {
        params.set('scope', 'mine');
      } else if (view === 'requests') {
        params.set('scope', 'requests');
      }

      if (view === 'consultant-pool') {
        const res = await fetch('/app/api/tasks/consultant-pool');
        if (res.ok) {
          const data = await res.json();
          const poolTasks: Task[] = data.tasks || [];
          setTasks(poolTasks);
          setTotalPages(1);
          setTotalCount(poolTasks.length);
          // Stats for pool
          const pending = poolTasks.filter(t => t.status === 'Bekliyor' || t.status === 'PENDING').length;
          const inProgress = poolTasks.filter(t => t.status === 'Devam Ediyor' || t.status === 'ASSIGNED').length;
          const completed = poolTasks.filter(t => t.status === 'Tamamlandı').length;
          setStats({
            summary: {
              total: poolTasks.length,
              pending,
              inProgress,
              completed,
              overdue: 0,
              today: poolTasks.length,
              thisWeek: 0
            },
            priority: [],
            type: [],
            assignment: []
          });
          return;
        }
      }

      if (isManager) {
        params.set('assigneeRole', assigneeRoleFilter);
      }
      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Sunucu tarafı role göre filtreleme yaptığı için doğrudan kullan
        setTasks(data.tasks as Task[]);
        setTotalPages(data.pagination.pages);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Görevler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [searchParams, isManager, assigneeRoleFilter]);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, searchTerm, statusFilter, priorityFilter, assignedToFilter, searchParams, assigneeRoleFilter, isManager]);

  const handleTaskAdded = () => {
    fetchTasks();
    fetchStats();
    setIsAddModalOpen(false);
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    fetchStats();
    setEditingTask(null);
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    fetchStats();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return 'text-green-600 bg-green-50';
      case 'Devam Ediyor':
        return 'text-blue-600 bg-blue-50';
      case 'Bekliyor':
        return 'text-yellow-600 bg-yellow-50';
      case 'İptal':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Acil':
        return 'text-red-700 bg-red-100';
      case 'Yüksek':
        return 'text-orange-700 bg-orange-100';
      case 'Normal':
        return 'text-blue-700 bg-blue-100';
      case 'Düşük':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && !tasks.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Geri
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {view === 'my' ? 'Görevlerim' : 
               view === 'consultant-pool' ? 'Görev Havuzu' : 
               view === 'requests' ? 'Taleplerim' : 'Görevler'}
            </h1>
            <p className="text-gray-600 mt-1">
              {view === 'my' ? 'Görevlerinizi takip edin ve yönetin' : 
               view === 'consultant-pool' ? 'Görevleri takip edin ve yönetin' : 
               view === 'requests' ? 'Taleplerinizi takip edin ve yönetin' :
               'Müşteri görevlerini ve takiplerini yönetin'}
            </p>
          </div>
        </div>
        {view !== 'consultant-pool' && (
          <Button 
            onClick={() => router.push('/dashboard/tasks/new')} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Talep
          </Button>
        )}
      </div>

      

      {/* Manager: Role filter directly under subtitle */}
      {isManager && view !== 'consultant-pool' && (
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-2">
            {(['all','Satış Danışmanı','Runner'] as const).map((opt) => {
              const active = assigneeRoleFilter === opt;
              return (
              <button
                key={opt}
                  aria-selected={active}
                onClick={() => setAssigneeRoleFilter(opt)}
                  className={`
                    inline-flex items-center px-4 py-1.5 text-sm rounded-full transition-colors border shadow-sm
                    ${active 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}
                  `}
              >
                {opt === 'all' ? 'Tümü' : opt}
              </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manager: Today completed summary */}
      {isManager && view !== 'consultant-pool' && managerStats && (
        <div className="text-xs text-gray-600 -mt-2">Bugün tamamlanan: {managerStats.statusCounts.todayCompleted} görev</div>
      )}

      {/* Manager: Personnel status panels (role-aware) */}
      {isManager && view !== 'consultant-pool' && managerStats && (
        <div className="space-y-6">
          {/* Runner Durumu */}
          {(assigneeRoleFilter === 'all' || assigneeRoleFilter === 'Runner') && (
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="px-5 py-3 font-semibold text-gray-800">Runner Durumu</div>
              <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {managerStats.runners.map((u) => (
                  <div key={u.id} className="rounded-md border p-4 bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                    <div className="mt-1 text-xs text-gray-600">{u.activeCount} aktif • {u.completedToday} tamamlandı</div>
                    <div className={`mt-2 inline-block text-[11px] px-2 py-0.5 rounded-full ${u.status==='Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{u.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Satış Danışmanı Durumu */}
          {(assigneeRoleFilter === 'all' || assigneeRoleFilter === 'Satış Danışmanı') && (
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="px-5 py-3 font-semibold text-gray-800">Satış Danışmanı Durumu</div>
              <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {managerStats.consultants.map((u) => (
                  <div key={u.id} className="rounded-md border p-4 bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                    <div className="mt-1 text-xs text-gray-600">{u.activeCustomers} aktif müşteri • {u.activeCount} aktif görev • {u.completedToday} bugün tamamlandı</div>
                    <div className={`mt-2 inline-block text-[11px] px-2 py-0.5 rounded-full ${u.status==='Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{u.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manager: Status tabs moved below panels */}
      {isManager && view !== 'consultant-pool' && managerStats && (
        <div className="flex items-center gap-2">
          <button onClick={setFilterAll} className={`px-3 py-1.5 rounded-full text-sm border ${statusFilter==='all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
            Tümü ({managerStats.statusCounts.total})
          </button>
          <button onClick={setFilterPending} className={`px-3 py-1.5 rounded-full text-sm border ${statusFilter==='Bekliyor' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'}`}>
            Beklemede ({managerStats.statusCounts.pending})
          </button>
          <button onClick={setFilterInProgress} className={`px-3 py-1.5 rounded-full text-sm border ${statusFilter==='Devam Ediyor' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'}`}>
            Devam Ediyor ({managerStats.statusCounts.inProgress})
          </button>
          <button onClick={setFilterCompleted} className={`px-3 py-1.5 rounded-full text-sm border ${statusFilter==='Tamamlandı' ? 'bg-green-600 text-white border-green-600' : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'}`}>
            Tamamlandı ({managerStats.statusCounts.completed})
          </button>
        </div>
      )}

      

      {/* Stats Cards - Mağaza Müdürü için gizli */}
      {stats && view !== 'consultant-pool' && !isManager && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card onClick={setFilterAll} className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-blue-800">Toplam Görev</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-blue-900">{stats.summary.total}</div>
              <p className="text-[11px] text-blue-600">Tüm görevler</p>
            </CardContent>
          </Card>

          <Card onClick={setFilterPending} className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-yellow-800">Bekleyen</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-yellow-900">{stats.summary.pending}</div>
              <p className="text-[11px] text-yellow-600">Başlanmamış görevler</p>
            </CardContent>
          </Card>

          <Card onClick={setFilterInProgress} className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-blue-800">Devam Eden</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-blue-900">{stats.summary.inProgress}</div>
              <p className="text-[11px] text-blue-600">İşlemde olan görevler</p>
            </CardContent>
          </Card>

          <Card onClick={setFilterCompleted} className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-green-800">Tamamlanan</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold text-green-900">{stats.summary.completed}</div>
              <p className="text-[11px] text-green-600">Bitirilen görevler</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks List */}
      <TasksList 
        tasks={tasks}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onEdit={setEditingTask}
        onView={setViewingTask}
        onDelete={handleTaskDeleted}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
      />

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTaskAdded}
      />

      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSuccess={handleTaskUpdated}
      />

      <TaskDetailModal
        task={viewingTask}
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        onEdit={setEditingTask}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
      />
    </div>
  );
}
