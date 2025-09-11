'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, Clock, CheckCircle, AlertCircle, ClipboardList, ArrowLeft } from 'lucide-react';
import { TaskPoolList } from './task-pool-list';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  type: string;
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

export default function RunnerDashboard() {
  const { data: session } = useSession();
  const [taskPool, setTaskPool] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/pool?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setTaskPool(data.tasks || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };


  const handleTakeTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Görev başarıyla alındı');
        // Verileri yenile
        fetchData(currentPage);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Görev alınamadı');
      }
    } catch (error) {
      console.error('Error taking task:', error);
      toast.error('Görev alınırken hata oluştu');
    }
  };

  const primaryRole = 'Runner';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Acil': return 'bg-red-100 text-red-800';
      case 'Yüksek': return 'bg-orange-100 text-orange-800';
      case 'Normal': return 'bg-blue-100 text-blue-800';
      case 'Düşük': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Devam Ediyor': return 'bg-blue-100 text-blue-800';
      case 'Bekliyor': return 'bg-yellow-100 text-yellow-800';
      case 'Açık': return 'bg-green-100 text-green-800';
      case 'Tamamlandı': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Devam Ediyor': return <Clock className="h-4 w-4" />;
      case 'Bekliyor': return <AlertCircle className="h-4 w-4" />;
      case 'Açık': return <Inbox className="h-4 w-4" />;
      case 'Tamamlandı': return <CheckCircle className="h-4 w-4" />;
      default: return <ClipboardList className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Geri Butonu */}
      <div className="flex items-center">
        <a 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </a>
      </div>

      {/* Görev Havuzu Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <TaskPoolList
            tasks={taskPool}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={fetchData}
            onTakeTask={handleTakeTask}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        </div>
      </div>
    </div>
  );
}
