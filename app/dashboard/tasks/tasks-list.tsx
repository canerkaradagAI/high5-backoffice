
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Eye,
  Edit,
  Trash2,
  User,
  Phone,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

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
  deliveryLocation: string | null;
  targetRole: string | null;
  productCode?: string | null;
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

interface TasksListProps {
  tasks: Task[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export function TasksList({ 
  tasks, 
  loading, 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange, 
  onEdit, 
  onView, 
  onDelete,
  getStatusColor,
  getPriorityColor 
}: TasksListProps) {
  const { data: session } = useSession();
  const primaryRole = (session?.user as any)?.roles?.[0]?.name || 'Kullanıcı';
  const isManager = primaryRole === 'Mağaza Müdürü';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
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

  const calculateWaitingTime = (createdAt: string, status: string, completedAt?: string | null) => {
    const now = new Date();
    const created = new Date(createdAt);
    
    // Eğer görev tamamlandıysa, tamamlanma zamanına göre hesapla
    // Değilse şu anki zamana göre hesapla
    const endTime = (status === 'Tamamlandı' && completedAt) ? new Date(completedAt) : now;
    const diffInMinutes = Math.floor((endTime.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} dakika`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} saat`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} gün`;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Görev başarıyla silindi');
        onDelete();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Silme işlemi başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTake = async (id: string) => {
    try {
      setTakingId(id);
      const res = await fetch(`/api/tasks/${id}/take`, { method: 'POST' });
      if (res.ok) {
        toast.success('Görev alındı');
        onDelete(); // list refresh hook
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Görev alınamadı');
      }
    } finally {
      setTakingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setCompletingId(id);
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Tamamlandı' })
      });
      if (res.ok) {
        toast.success('Görev tamamlandı');
        onDelete();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Görev tamamlanamadı');
      }
    } finally {
      setCompletingId(null);
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
            <p>Herhangi bir görev bulunamadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Görevler ({totalCount})</span>
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
                    <Badge className={`text-xs ${getPriorityColor(task.priority)} border border-current font-semibold px-2.5 py-0.5 shadow-sm` }>
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
                      {task.assignedTo ? (
                        <span>
                          {`${(task.assignedTo.firstName || '').trim()} ${(task.assignedTo.lastName || '').trim()}`.trim() || task.assignedTo.email}
                        </span>
                      ) : (
                        <span className="text-gray-400">Atanmamış</span>
                      )}
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
                        {calculateWaitingTime(task.createdAt, task.status, task.completedAt)}
                      </span>
                    </div>
                    
                    {/* Müşteri */}
                    {task.customer && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Müşteri: {task.customer.fullName}</span>
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
                  {/* Mağaza Müdürü: Görevi Al görünmez, Havuzdaki görevi iptal edebilir */}
                  {isManager && !task.assignedTo && (task.status === 'PENDING' || task.status === 'Bekliyor') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                      disabled={deletingId === task.id}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      {deletingId === task.id ? 'İptal ediliyor...' : 'Görevi İptal Et'}
                    </Button>
                  )}

                  {/* Görevi Al - sadece müdür değilken, havuzdayken, oluşturan değilken ve hedef rol eşleşiyorsa */}
                  {!isManager && (!task.assignedTo && (task.status === 'PENDING' || task.status === 'Bekliyor')) && task.createdBy.id !== session?.user?.id && (!task.targetRole || task.targetRole === primaryRole) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTake(task.id)}
                      disabled={takingId === task.id}
                      className="border-orange-600 text-orange-600 hover:bg-orange-50"
                    >
                      {takingId === task.id ? 'Alınıyor...' : 'Görevi Al'}
                    </Button>
                  )}

                  {/* Görevi İptal Et - oluşturan kişi kendi görevini iptal edebilir */}
                  {!isManager && (!task.assignedTo && (task.status === 'PENDING' || task.status === 'Bekliyor')) && task.createdBy.id === session?.user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                      disabled={deletingId === task.id}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      {deletingId === task.id ? 'İptal ediliyor...' : 'Görevi İptal Et'}
                    </Button>
                  )}

                  {/* Tamamla - görev bana atanmışsa */}
                  {task.assignedTo?.id === session?.user?.id && task.status !== 'Tamamlandı' && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(task.id)}
                      disabled={completingId === task.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
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
