"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Play,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  createdAt: string;
  customer?: {
    fullName: string;
    phone: string;
  };
  createdBy?: {
    firstName?: string;
    lastName?: string;
  };
}

interface MyTasksListProps {
  tasks: Task[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  onCompleted?: () => void;
}

export function MyTasksList({ 
  tasks, 
  loading, 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange, 
  getStatusColor,
  getPriorityColor,
  onCompleted
}: MyTasksListProps) {

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: tr });
    } catch {
      return '-';
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const dueDate = new Date(dateString);
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return (
          <span className="text-red-600 font-medium">
            {Math.abs(diffDays)} gün gecikme
          </span>
        );
      } else if (diffDays === 0) {
        return <span className="text-orange-600 font-medium">Bugün</span>;
      } else if (diffDays === 1) {
        return <span className="text-yellow-600">Yarın</span>;
      } else {
        return format(dueDate, 'dd/MM/yyyy', { locale: tr });
      }
    } catch {
      return '-';
    }
  };

  async function handleComplete(taskId: string) {
    try {
      setCompletingId(taskId);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Tamamlandı' })
      });
      if (!res.ok) {
        throw new Error('Görev tamamlanamadı');
      }
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Tamamlandı' } : t));
      onCompleted?.();
    } catch (e) {
      // noop
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!localTasks.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Size atanmış görev bulunmuyor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Görevlerim ({totalCount})</span>
          <Badge variant="outline" className="text-sm">
            Sayfa {currentPage} / {totalPages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {localTasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)} border border-current font-semibold px-2.5 py-0.5 shadow-sm`}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    {task.customer && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{task.customer.fullName}</span>
                      </div>
                    )}
                    
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Bitiş: {formatDueDate(task.dueDate)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Oluşturulma: {formatDate(task.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {task.status !== 'Tamamlandı' && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(task.id)}
                      disabled={completingId === task.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {completingId === task.id ? 'Tamamlanıyor...' : 'Tamamla'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Toplam {totalCount} görevden {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalCount)} arası gösteriliyor
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Önceki
              </Button>
              
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sonraki
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
