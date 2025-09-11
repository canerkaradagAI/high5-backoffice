
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  
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
      const scope = searchParams?.get('view') === 'my' ? 'mine' : 'requests';
      const response = await fetch(`/api/tasks/stats?scope=${scope}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
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

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
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
  }, [searchParams]);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, searchTerm, statusFilter, priorityFilter, assignedToFilter, searchParams]);

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
            <h1 className="text-3xl font-bold text-gray-900">{view === 'my' ? 'Görevlerim' : view === 'consultant-pool' ? 'Satış Danışmanı Görev Havuzu' : 'Taleplerim'}</h1>
            <p className="text-gray-600 mt-1">Müşteri görevlerini ve takiplerini yönetin</p>
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

      {/* Stats Cards */}
      {stats && view !== 'consultant-pool' && (
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

      {/* Durum filtresi kaldırıldı: tüm görevler listelenir */}

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
