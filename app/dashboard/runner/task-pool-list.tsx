"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  User,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Package,
  Scan
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Bekleme süresini hesaplayan fonksiyon
function calculateWaitingTime(createdAt: string, status: string): string {
  if (status === 'Tamamlandı') return 'Tamamlandı';
  
  const created = new Date(createdAt);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} dk`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} saat`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return `${days} gün`;
  }
}

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  createdAt: string;
  deliveryLocation?: string;
  productCode?: string;
  customer?: {
    fullName: string;
    phone: string;
  };
  createdBy?: {
    firstName?: string;
    lastName?: string;
  };
}

interface TaskPoolListProps {
  tasks: Task[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onTakeTask: (taskId: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export function TaskPoolList({ 
  tasks, 
  loading, 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange, 
  onTakeTask,
  getStatusColor,
  getPriorityColor 
}: TaskPoolListProps) {
  const [takingId, setTakingId] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    // Ürün kodları olan görevler için ürün bilgilerini çek
    tasks.forEach(task => {
      if (task.productCode && !productDetails[task.id]) {
        // Eğer sadece barkod varsa, ürün bilgilerini çek
        const productCode = task.productCode.trim();
        if (/^\d+$/.test(productCode)) { // Sadece rakam ise barkod
          fetchProductDetails(productCode, task.id);
        }
      }
    });
  }, [tasks]);

  const fetchProductDetails = async (sku: string, taskId: string) => {
    try {
      const response = await fetch(`/api/products/search?sku=${sku}`);
      if (response.ok) {
        const product = await response.json();
        setProductDetails(prev => ({
          ...prev,
          [taskId]: product
        }));
      }
    } catch (error) {
      console.error('Ürün bilgileri çekilemedi:', error);
    }
  };

  const handleTakeTask = async (taskId: string) => {
    try {
      setTakingId(taskId);
      await onTakeTask(taskId);
    } finally {
      setTakingId(null);
    }
  };

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

  const calculateWaitingTime = (createdAt: string, status: string, completedAt?: string | null) => {
    try {
      const created = new Date(createdAt);
      const now = new Date();
      
      // Eğer görev tamamlandıysa, tamamlanma zamanına göre hesapla
      // Değilse şu anki zamana göre hesapla
      const endTime = (status === 'Tamamlandı' && completedAt) ? new Date(completedAt) : now;
      const diffMinutes = Math.floor((endTime.getTime() - created.getTime()) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes} dakika`;
      } else if (diffMinutes < 1440) { // 24 saat
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours} saat ${minutes} dakika`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        const hours = Math.floor((diffMinutes % 1440) / 60);
        return `${days} gün ${hours} saat`;
      }
    } catch {
      return '-';
    }
  };

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

  if (!tasks.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Görev havuzunda henüz görev bulunmuyor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Görev Havuzu ({totalCount})</span>
          <Badge variant="outline" className="text-sm">
            Sayfa {currentPage} / {totalPages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
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
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    {/* Runner/Satış Danışmanı */}
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="text-gray-400">Atanmamış</span>
                    </div>
                    
                    {/* Ürün Kodu - Ürün kodu olan tüm görevlerde göster */}
                    {task.productCode && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 font-medium">
                          Ürün: {(() => {
                            const productCode = task.productCode.trim();
                            // Eğer sadece rakam ise ve ürün detayları varsa tam formatı göster
                            if (/^\d+$/.test(productCode) && productDetails[task.id]) {
                              const product = productDetails[task.id];
                              return `${product.sku} - ${product.name} - ${product.size}`;
                            }
                            // Aksi halde mevcut formatı göster
                            return productCode;
                          })()}
                        </span>
                      </div>
                    )}
                    
                    {/* Teslim Lokasyonu */}
                    {task.deliveryLocation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-600 font-medium">
                          {task.deliveryLocation}
                        </span>
                      </div>
                    )}
                    
                    {/* Bekleme Süresi */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-red-600 font-medium">
                        {calculateWaitingTime(task.createdAt, task.status)}
                      </span>
                    </div>
                    
                    {/* Müşteri */}
                    {task.customer && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Müşteri: {task.customer.fullName}</span>
                      </div>
                    )}
                    
                    {/* Oluşturan */}
                    {task.createdBy && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="text-blue-600 font-medium">
                          Oluşturan: {`${(task.createdBy.firstName || '').trim()} ${(task.createdBy.lastName || '').trim()}`.trim() || 'Bilinmiyor'}
                        </span>
                      </div>
                    )}
                    
                    {/* Bitiş Tarihi */}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Bitiş: {formatDueDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => handleTakeTask(task.id)}
                    disabled={takingId === task.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {takingId === task.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Görevi Al
                      </>
                    )}
                  </Button>
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
