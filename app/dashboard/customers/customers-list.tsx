
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Customer } from '@prisma/client';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Eye,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddCustomerModal from './add-customer-modal';
import EditCustomerModal from './edit-customer-modal';
import CustomerDetailModal from './customer-detail-modal';
import SaleActionModal from '../../components/sale-action-modal';
import TransferModal from './transfer-modal';

interface CustomersListProps {
  initialCustomers: any[]; // include sales[0]
  users?: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }>;
  canAssign?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  showAssignment?: boolean;
}

export default function CustomersList({ 
  initialCustomers, 
  users = [], 
  canAssign = false, 
  canEdit = false, 
  canDelete = false, 
  showAssignment = false 
}: CustomersListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>(initialCustomers || []);
  const [searchTerm, setSearchTerm] = useState('');
  // Segment filtresi kaldırıldı
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [cartStatusByCustomer, setCartStatusByCustomer] = useState<Record<string, { hasOpen: boolean }>>({});
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [draggedCustomer, setDraggedCustomer] = useState<any | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedCustomerForSale, setSelectedCustomerForSale] = useState<any | null>(null);
  const [dragBehavior, setDragBehavior] = useState<'pool' | 'transfer'>('pool');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [customerToTransfer, setCustomerToTransfer] = useState<any | null>(null);

  // Set default for Sales Consultant role
  useEffect(() => {
    const roles = (session?.user as any)?.roles || [];
    const isSalesConsultant = roles.some((r: any) => r?.name === 'Satış Danışmanı');
    setOnlyMine(isSalesConsultant);
  }, [session?.user]);

  // Load drag behavior parameter
  useEffect(() => {
    async function loadDragBehavior() {
      try {
        const response = await fetch('/api/parameters?search=customer_drag_behavior');
        if (response.ok) {
          const data = await response.json();
          const dragBehaviorParam = data.parameters?.find((p: any) => p.key === 'CUSTOMER_DRAG_BEHAVIOR');
          if (dragBehaviorParam) {
            setDragBehavior(dragBehaviorParam.value as 'pool' | 'transfer');
            console.log('🔧 Drag behavior loaded:', dragBehaviorParam.value);
          } else {
            console.log('🔧 Drag behavior parameter not found, using default: pool');
            setDragBehavior('pool');
          }
        } else {
          console.error('Failed to load drag behavior parameter:', response.status);
          // Fallback: set to pool as default
          setDragBehavior('pool');
        }
      } catch (error) {
        console.error('Error loading drag behavior parameter:', error);
        // Fallback: set to pool as default
        setDragBehavior('pool');
      }
    }
    loadDragBehavior();
  }, []);

  // Gerçek zamanlı sayaç için timer
  useEffect(() => {
    // İlk render'da currentTime'ı set et
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Swipeable olayları için document listener
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (draggedCustomer) {
        handleSwipeMove(e);
      }
    };

    const handleDocumentMouseUp = (e: MouseEvent) => {
      if (draggedCustomer) {
        handleSwipeEnd(e);
      }
    };

    const handleDocumentTouchMove = (e: TouchEvent) => {
      if (draggedCustomer) {
        handleSwipeMove(e);
      }
    };

    const handleDocumentTouchEnd = (e: TouchEvent) => {
      if (draggedCustomer) {
        handleSwipeEnd(e);
      }
    };

    // Her zaman listener'ları ekle
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    document.addEventListener('touchmove', handleDocumentTouchMove);
    document.addEventListener('touchend', handleDocumentTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [draggedCustomer]);

  useEffect(() => {
    const open = searchParams?.get('open');
    const focus = searchParams?.get('focus');
    if (open === 'add') {
      setShowAddModal(true);
    }
    if (focus === 'search') {
      // small timeout to ensure input mounted
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchParams]);

  // Permissions helper for cart actions
  // Geçici: Yetkiler eklenene kadar satış danışmanı için sepet butonlarını göster
  const canManageCart = true;

  // Prefetch open cart status for currently listed customers (best-effort)
  useEffect(() => {
    const abort = new AbortController();
    async function fetchStatuses() {
      const targets = filteredCustomers.slice(0, 10).map((c) => c.id);
      await Promise.all(targets.map(async (id) => {
        if (cartStatusByCustomer[id]) return;
        try {
          const res = await fetch(`/api/carts/${id}`, { signal: abort.signal });
          if (res.ok) {
            // Sepet var ve dolu
            setCartStatusByCustomer((prev) => ({ ...prev, [id]: { hasOpen: true } }));
          } else {
            // Sepet yok veya boş
            setCartStatusByCustomer((prev) => ({ ...prev, [id]: { hasOpen: false } }));
          }
        } catch {
          // ignore
        }
      }));
    }
    fetchStatuses();
    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, searchTerm, onlyMine]);

  function handleCreateCart(customerId: string) {
    // Sepet sayfasına yönlendir - sepet orada oluşturulacak
    router.push(`/dashboard/cart/${customerId}`);
  }

  function goCart(customerId: string) {
    router.push(`/dashboard/cart/${customerId}`);
  }

  function goCheckout(customerId: string) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomerForSale(customer);
      setShowSaleModal(true);
    }
  }

  // Filter customers based on search term and ownership
  const filteredCustomers = (customers || []).filter(customer => {
    const matchesSearch = 
      customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.tcNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOwnership = !onlyMine || customer.assignedConsultantId === (session?.user as any)?.id;

    return matchesSearch && matchesOwnership;
  });

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`"${customerName}" müşterisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(customer => customer.id !== customerId));
        toast.success('Müşteri başarıyla silindi');
      } else {
        throw new Error('Müşteri silinemedi');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Müşteri silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setShowAddModal(false);
    toast.success('Müşteri başarıyla eklendi');
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer)
    );
    setEditingCustomer(null);
    toast.success('Müşteri başarıyla güncellendi');
  };

  const handleTakeCustomer = async (customerId: string) => {
    setLoading(true);
    try {
      const payload: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultantId: (session?.user as any)?.id })
      };

      // Önce app altındaki rota
      let response = await fetch(`/app/api/customers/${customerId}/assign`, payload);
      if (!response.ok) {
        // Fallback: kök /api rota (ortamlara göre değişebilir)
        response = await fetch(`/api/customers/${customerId}/assign`, payload);
      }

      if (response.ok) {
        const updatedCustomers = customers.map(customer => 
          customer.id === customerId 
            ? { 
                ...customer, 
                assignedConsultantId: (session?.user as any)?.id,
                assignedConsultant: {
                  id: (session?.user as any)?.id || '',
                  firstName: (session?.user as any)?.firstName || '',
                  lastName: (session?.user as any)?.lastName || '',
                  email: (session?.user as any)?.email || ''
                }
              }
            : customer
        );
        setCustomers(updatedCustomers);
        toast.success('Müşteri size atandı');
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Müşteri atanamadı');
      }
    } catch (error) {
      console.error('Error taking customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Müşteri alınırken hata oluştu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Swipeable fonksiyonları
  const handleSwipeStart = (e: React.MouseEvent | React.TouchEvent, customer: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Sadece kendi müşterilerinde swipe yapılabilsin
    if (customer.assignedConsultantId !== (session?.user as any)?.id) {
      console.log('Swipe blocked - not your customer:', customer.firstName);
      return;
    }
    
    console.log('Swipe start:', customer.firstName);
    setDraggedCustomer(customer);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartPosRef.current = { x: clientX, y: 0 };
    // swipeOffset'i sıfırlama - mevcut pozisyonu koru
  };

  const handleSwipeMove = (e: MouseEvent | TouchEvent) => {
    if (!draggedCustomer) return;
    
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartPosRef.current.x;
    
    // Kartı görsel olarak kaydır (maksimum 200px)
    const clampedDelta = Math.max(-200, Math.min(200, deltaX));
    console.log('Swipe move - deltaX:', deltaX, 'clampedDelta:', clampedDelta, 'customer:', draggedCustomer.firstName);
    setSwipeOffset(prev => ({ ...prev, [draggedCustomer.id]: clampedDelta }));
  };

  const handleSwipeEnd = (e: MouseEvent | TouchEvent) => {
    if (!draggedCustomer) return;
    
    e.preventDefault();
    
    // Son pozisyonu hesapla
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartPosRef.current.x;
    const finalOffset = Math.max(-200, Math.min(200, deltaX));
    
    console.log('Swipe end - finalOffset:', finalOffset, 'customer:', draggedCustomer.firstName);
    
    // Swipe mesafesi 50px'den fazlaysa işlem yap
    if (Math.abs(finalOffset) > 50) {
      if (finalOffset > 0) {
        // Sağa swipe - Parametreye göre davranış
        if (dragBehavior === 'pool') {
          console.log('Triggering action: Havuza Al');
          // Müşteri zaten havuzda ise işlem yapma
          if (!draggedCustomer.assignedConsultantId) {
            toast.error('Bu müşteri zaten havuzda');
          } else {
            handleMoveToPool(draggedCustomer);
          }
        } else {
          console.log('Triggering action: Transfer Et');
          // Müşteri zaten havuzda ise transfer yapma
          if (!draggedCustomer.assignedConsultantId) {
            toast.error('Bu müşteri zaten havuzda, transfer edilemez');
          } else {
            setCustomerToTransfer(draggedCustomer);
            setShowTransferModal(true);
          }
        }
      } else {
        // Sola swipe - Sil
        console.log('Triggering action: Sil');
        handleDeleteCustomer(draggedCustomer.id, `${draggedCustomer.firstName || ''} ${draggedCustomer.lastName || ''}`);
      }
    }
    
    // Kartı orijinal pozisyonuna döndür
    setSwipeOffset(prev => ({ ...prev, [draggedCustomer.id]: 0 }));
    
    // Drag state'i temizle
    setDraggedCustomer(null);
  };

  const handleMoveToPool = async (customer: any) => {
    if (!customer.assignedConsultantId) {
      toast.error('Bu müşteri zaten havuzda');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email,
          tcNumber: customer.tcNumber,
          address: customer.address,
          segment: customer.segment,
          totalSpent: customer.totalSpent,
          assignedConsultantId: null, // Danışmanından düşür
          movedToPoolAt: new Date().toISOString() // Havuza alındığı tarih
        })
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        console.log('Updated customer:', updatedCustomer);
        setCustomers(prev => 
          prev.map(c => c.id === customer.id ? { ...updatedCustomer, assignedConsultant: null } : c)
        );
        toast.success('Müşteri havuza alındı');
      } else {
        throw new Error('Müşteri havuza alınamadı');
      }
    } catch (error) {
      console.error('Error moving to pool:', error);
      toast.error('Müşteri havuza alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCustomer = async (consultantId: string) => {
    if (!customerToTransfer) return;

    setLoading(true);
    try {
      const payload: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultantId })
      };

      // Önce app altındaki rota
      let response = await fetch(`/app/api/customers/${customerToTransfer.id}/assign`, payload);
      if (!response.ok) {
        // Fallback: kök /api rota (ortamlara göre değişebilir)
        response = await fetch(`/api/customers/${customerToTransfer.id}/assign`, payload);
      }

      if (response.ok) {
        // Danışman bilgisini al
        const consultantResponse = await fetch(`/api/users/${consultantId}`);
        const consultant = consultantResponse.ok ? await consultantResponse.json() : null;

        const updatedCustomers = customers.map(customer => 
          customer.id === customerToTransfer.id 
            ? { 
                ...customer, 
                assignedConsultantId: consultantId,
                assignedConsultant: consultant ? {
                  id: consultant.id,
                  firstName: consultant.firstName,
                  lastName: consultant.lastName,
                  email: consultant.email
                } : null
              }
            : customer
        );
        setCustomers(updatedCustomers);
        toast.success(`Müşteri ${consultant?.firstName} ${consultant?.lastName} danışmanına transfer edildi`);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Müşteri transfer edilemedi');
      }
    } catch (error) {
      console.error('Error transferring customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Müşteri transfer edilirken hata oluştu';
      toast.error(errorMessage);
      throw error; // Re-throw to handle in modal
    } finally {
      setLoading(false);
    }
  };

  const getSegmentBadgeColor = (segment: string) => {
    switch (segment) {
      case 'VIP': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Classic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Aday': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'Premium':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.91-1.01L12 2z"/>
          </svg>
        );
      case 'Classic':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 7c0-2.21-1.79-4-4-4S8 4.79 8 7s1.79 4 4 4 4-1.79 4-4zM12 14c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"/>
          </svg>
        );
    }
  };

  // Boşta olan müşterinin süresini hesapla
  const getWaitingTime = (customer: any) => {
    if (customer.assignedConsultantId || !currentTime) return null; // Atanmış müşteri veya currentTime yoksa süre gösterme
    
    // movedToPoolAt varsa ondan, yoksa createdAt'den hesapla
    const startDate = customer.movedToPoolAt ? new Date(customer.movedToPoolAt) : new Date(customer.createdAt);
    const diffMs = currentTime.getTime() - startDate.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffDays >= 1) {
      return `${diffDays} gün`;
    } else if (diffHours >= 1) {
      const remainingMinutes = diffMinutes % 60;
      return `${diffHours}:${remainingMinutes.toString().padStart(2, '0')} saat`;
    } else {
      return `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')} dk`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </button>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Müşteriler</h2>
          <p className="text-gray-600">Toplam {filteredCustomers.length} müşteri</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Müşteri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-9 pr-4 text-sm"
                ref={searchInputRef}
              />
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={onlyMine}
                  onChange={(e) => setOnlyMine(e.target.checked)}
                />
                Sadece benim müşterilerim
              </label>
            </div>
            {/* Add Customer Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center justify-center gap-2 text-sm py-2 px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Müşteri Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customers Count */}
      <div className="flex justify-between items-center px-1">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{filteredCustomers.length}</span> müşteri bulundu
          {customers.length !== filteredCustomers.length && (
            <span className="text-gray-500"> ({customers.length} toplam)</span>
          )}
        </p>
      </div>

      {/* Customers List - Görseldeki Tasarım */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="card">
            <div className="text-center py-12 text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <User className="h-12 w-12 text-gray-300" />
                <p>Müşteri bulunamadı</p>
              </div>
            </div>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="relative overflow-hidden rounded-lg">
              {/* Arka plan etiketleri */}
              <div className="absolute inset-0 flex h-full">
                {/* Sol taraf - Parametreye göre */}
                <div className="flex-1 bg-blue-100 flex items-center justify-start pl-6 rounded-l-lg">
                  <span className="text-blue-600 font-bold text-xl">
                    {dragBehavior === 'pool' ? 'Havuza Al' : 'Transfer Et'}
                  </span>
                </div>
                {/* Sağ taraf - Sil */}
                <div className="flex-1 bg-red-100 flex items-center justify-end pr-6 rounded-r-lg">
                  <span className="text-red-600 font-bold text-xl">Sil</span>
                </div>
              </div>
              
              {/* Ana kart */}
              <div 
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 select-none relative z-10 min-h-[120px]"
                onMouseDown={(e) => handleSwipeStart(e, customer)}
                onTouchStart={(e) => handleSwipeStart(e, customer)}
                style={{ 
                  cursor: draggedCustomer?.id === customer.id ? 'grabbing' : 
                    (customer.assignedConsultantId === (session?.user as any)?.id ? 'grab' : 'default'),
                  transform: `translateX(${swipeOffset[customer.id] || 0}px)`,
                  transition: draggedCustomer?.id === customer.id ? 'none' : 
                    (Math.abs(swipeOffset[customer.id] || 0) > 50 ? 'none' : 'transform 0.3s ease-out')
                }}
              >
              {/* Ana Satır - Avatar, İsim, Etiketler, Tutar, Butonlar */}
              <div className="flex items-center justify-between">
                {/* Sol Taraf - Avatar ve Müşteri Bilgileri */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div 
                    className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => setViewingCustomer(customer)}
                  >
                    <span className="text-blue-800 font-semibold text-sm">
                      {(customer.firstName?.[0] || '') + (customer.lastName?.[0] || '')}
                    </span>
                  </div>
                  
                  {/* Müşteri Bilgileri (İsim + Segment etiketi aynı satırda) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                        {customer.firstName || ''} {customer.lastName || ''}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSegmentBadgeColor(customer.segment || 'Aday')}`}>
                        {customer.segment === 'VIP' ? 'Gold' : 
                         customer.segment === 'Premium' ? 'Silver' : 
                         customer.segment === 'Classic' ? 'Classic' : 'Aday'}
                      </span>
                      {/* Tutar isim yanında */}
                      <span className="ml-1 text-sm md:text-base font-bold text-green-600 whitespace-nowrap">
                        ₺{(customer.totalSpent || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    {/* 2. satır: Son alışveriş tarihi */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>
                        {( customer.sales && customer.sales[0]?.invoiceDate
                          ? new Date(customer.sales[0].invoiceDate)
                          : (customer as any).lastVisit ? new Date((customer as any).lastVisit) : new Date(customer.createdAt)
                        ).toLocaleDateString('tr-TR')}
                      </span>
                      {customer.sales && customer.sales[0] && (
                        <span className="text-gray-600">• Son Satış: ₺{(customer.sales[0].amount || 0).toLocaleString('tr-TR')} — {customer.sales[0].title}</span>
                      )}
                    </div>
                    {/* 3. satır: Danışman */}
                    {customer.assignedConsultantId && (
                      <div className="mt-1 text-xs text-gray-600">
                        Danışman: {(customer as any).assignedConsultant?.firstName || ''} {(customer as any).assignedConsultant?.lastName || ''}
                      </div>
                    )}
                    {/* 4. satır: Boşta bekleme süresi */}
                    {!customer.assignedConsultantId && (
                      <div className="mt-1 text-xs text-red-600 font-semibold">
                        ⏱️ Boşta: {getWaitingTime(customer)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0" />
                
                {/* Sağ Taraf - Butonlar */}
                <div className="flex items-center gap-4">
                  {/* Normal durumda - Standart butonlar */}
                  <div className="flex items-center gap-2">
                    {/* Müşteriyi Al - Sadece boşta olan müşteriler için göster */}
                    {!customer.assignedConsultantId && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTakeCustomer(customer.id);
                        }}
                        className="px-3 py-1.5 bg-white text-green-600 text-sm rounded-md hover:bg-green-50 border border-green-200 transition-colors"
                      >
                        Müşteriyi Al
                      </button>
                    )}

                    {/* Sepet Butonları - sadece kendi müşterisi için göster */}
                    {customer.assignedConsultantId === (session?.user as any)?.id && (
                      cartStatusByCustomer[customer.id]?.hasOpen ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); goCart(customer.id); }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          >
                            Sepet Düzenle
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); goCheckout(customer.id); }}
                            className="px-3 py-1.5 bg-green-200 text-green-800 text-sm rounded-md hover:bg-green-300 transition-colors"
                          >
                            Satış Yap
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCreateCart(customer.id); }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Sepet Oluştur
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCustomer}
        />
      )}

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onUpdate={handleUpdateCustomer}
        />
      )}

      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}

      {/* Satış İşlemi Popup */}
      {selectedCustomerForSale && (
        <SaleActionModal
          isOpen={showSaleModal}
          onClose={() => {
            setShowSaleModal(false);
            setSelectedCustomerForSale(null);
          }}
          customerId={selectedCustomerForSale.id}
          customerName={`${selectedCustomerForSale.firstName} ${selectedCustomerForSale.lastName}`}
          totalAmount={0} // Sepet verileri modal içinde alınacak
          cartItemsCount={0} // Sepet verileri modal içinde alınacak
        />
      )}

      {/* Transfer Modal */}
      {customerToTransfer && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setCustomerToTransfer(null);
          }}
          customer={customerToTransfer}
          onTransfer={handleTransferCustomer}
        />
      )}
    </div>
  );
}
