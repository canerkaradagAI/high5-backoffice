'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClipboardList, Clock, CheckCircle, AlertCircle, ArrowLeft, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MyTasksList } from '../my-tasks-list';
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

export default function MyTasksPage() {
  const { data: session } = useSession();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
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
      const response = await fetch(`/api/tasks/my?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setMyTasks(data.tasks || []);
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
      case 'Açık': return 'bg-gray-100 text-gray-800';
      case 'Tamamlandı': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // İstatistikleri hesapla
  const totalTasksCount = myTasks.length;
  const inProgressTasksCount = myTasks.filter(t => t.status === 'Devam Ediyor').length;
  const completedTasksCount = myTasks.filter(t => t.status === 'Tamamlandı').length;

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

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-blue-800">Toplam Görev</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-blue-900">{totalTasksCount}</div>
            <p className="text-[11px] text-blue-600">Tüm görevler</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-blue-800">Devam Eden</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-blue-900">{inProgressTasksCount}</div>
            <p className="text-[11px] text-blue-600">İşlemde olan görevler</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-green-800">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-green-900">{completedTasksCount}</div>
            <p className="text-[11px] text-green-600">Bitirilen görevler</p>
          </CardContent>
        </Card>
      </div>

      {/* Görevlerim Listesi */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <MyTasksList
            tasks={myTasks}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={fetchData}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            onCompleted={() => fetchData(currentPage)}
          />
        </div>
      </div>
    </div>
  );
}
