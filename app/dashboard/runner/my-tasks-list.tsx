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
  Play,
  Check,
  MapPin,
  Package,
  Scan
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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
  const [barcodePopupOpen, setBarcodePopupOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

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

  // Ürün getirme görevleri için barkod okutma popup'ını aç
  function handleCompleteWithBarcode(taskId: string) {
    setCurrentTaskId(taskId);
    setBarcodePopupOpen(true);
    setScannedBarcode('');
  }

  // Barkod okutma işlemi
  async function handleBarcodeScan() {
    if (!scannedBarcode.trim() || !currentTaskId) return;

    setScanning(true);
    try {
      // Barkod doğrulama (gerçek uygulamada ürün veritabanından kontrol edilir)
      const task = localTasks.find(t => t.id === currentTaskId);
      if (!task || !task.productCode) {
        throw new Error('Görev bulunamadı');
      }

      // Görevi tamamla
      const res = await fetch(`/api/tasks/${currentTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Tamamlandı',
          notes: `Barkod okutuldu: ${scannedBarcode}`
        })
      });
      
      if (!res.ok) {
        throw new Error('Görev tamamlanamadı');
      }

      // Local state'i güncelle
      setLocalTasks(prev => prev.map(t => t.id === currentTaskId ? { ...t, status: 'Tamamlandı' } : t));
      onCompleted?.();

      // Popup'ı kapat
      setBarcodePopupOpen(false);
      setCurrentTaskId(null);
      setScannedBarcode('');

    } catch (error) {
      console.error('Barkod okutma hatası:', error);
      alert('Barkod okutma işlemi başarısız oldu');
    } finally {
      setScanning(false);
    }
  }

  // Popup'ı kapat
  function closeBarcodePopup() {
    setBarcodePopupOpen(false);
    setCurrentTaskId(null);
    setScannedBarcode('');
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
    <>
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
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    {/* Runner/Satış Danışmanı */}
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Atandı</span>
                    </div>
                    
                    {/* Ürün Kodu - Sadece Ürün Getir görevlerinde göster */}
                    {task.productCode && (task.type === 'customer_product_delivery' || task.type === 'customer_cabin_delivery') && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 font-medium">
                          Ürün: {task.productCode}
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
                  {task.status !== 'Tamamlandı' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        // Ürün getirme görevleri için barkod okutma popup'ı aç
                        if (task.type === 'customer_product_delivery' || task.type === 'customer_cabin_delivery') {
                          handleCompleteWithBarcode(task.id);
                        } else {
                          // Diğer görevler için normal tamamlama
                          handleComplete(task.id);
                        }
                      }}
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

      {/* Barkod Okutma Popup'ı */}
      <Dialog open={barcodePopupOpen} onOpenChange={closeBarcodePopup}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Scan className="w-5 h-5 text-blue-600" />
              Barkod Okut
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Ürünün barkodunu okutarak görevi tamamlayın.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 bg-white">
          {/* Görev Bilgisi */}
          {currentTaskId && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-1">Görev:</div>
              <div className="text-sm text-gray-600">
                {localTasks.find(t => t.id === currentTaskId)?.title}
              </div>
              {localTasks.find(t => t.id === currentTaskId)?.productCode && (
                <div className="text-sm text-gray-600 mt-1">
                  <Package className="w-3 h-3 inline mr-1" />
                  {localTasks.find(t => t.id === currentTaskId)?.productCode}
                </div>
              )}
            </div>
          )}

          {/* Barkod Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Barkod
            </label>
            <Input
              type="text"
              placeholder="Barkodu buraya girin veya okutun..."
              value={scannedBarcode}
              onChange={(e) => setScannedBarcode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeScan();
                }
              }}
              autoFocus
              disabled={scanning}
              className="bg-white border-gray-300 text-gray-900"
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={closeBarcodePopup}
              disabled={scanning}
              className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              İptal
            </Button>
            <Button
              onClick={handleBarcodeScan}
              disabled={!scannedBarcode.trim() || scanning}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {scanning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Okutuluyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Scan className="w-4 h-4" />
                  Okut
                </div>
              )}
            </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
