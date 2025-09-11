
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

interface CustomersListProps {
  initialCustomers: Customer[];
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
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers || []);
  const [searchTerm, setSearchTerm] = useState('');
  // Segment filtresi kaldırıldı
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [cartStatusByCustomer, setCartStatusByCustomer] = useState<Record<string, { hasOpen: boolean }>>({});

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
  }, [customers, searchTerm]);

  function handleCreateCart(customerId: string) {
    // Sepet sayfasına yönlendir - sepet orada oluşturulacak
    router.push(`/dashboard/cart/${customerId}`);
  }

  function goCart(customerId: string) {
    router.push(`/dashboard/cart/${customerId}`);
  }

  function goCheckout(customerId: string) {
    router.push(`/dashboard/cart/${customerId}/checkout`);
  }

  // Filter customers based on search term and segment
  const filteredCustomers = (customers || []).filter(customer => {
    const matchesSearch = 
      customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.tcNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
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
        body: JSON.stringify({ consultantId: session?.user?.id })
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
                assignedConsultantId: session?.user?.id,
                assignedConsultant: {
                  id: session?.user?.id || '',
                  firstName: session?.user?.firstName || '',
                  lastName: session?.user?.lastName || '',
                  email: session?.user?.email || ''
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
      toast.error('Müşteri alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`"${customerName}" müşterisini bırakmak istediğinizden emin misiniz? Müşteri mağazadan ayrılmış sayılacak.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(customer => customer.id !== customerId));
        toast.success('Müşteri bırakıldı ve listeden kaldırıldı');
      } else {
        throw new Error('Müşteri bırakılamadı');
      }
    } catch (error) {
      console.error('Error releasing customer:', error);
      toast.error('Müşteri bırakılırken hata oluştu');
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
          <div className="flex flex-col sm:flex-row gap-3">
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
            <div 
              key={customer.id} 
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setViewingCustomer(customer)}
            >
              {/* Ana Satır - Avatar, İsim, Etiketler, Tutar, Butonlar */}
              <div className="flex items-center justify-between">
                {/* Sol Taraf - Avatar ve Müşteri Bilgileri */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                        {( (customer as any).sales && (customer as any).sales[0]?.invoiceDate
                          ? new Date((customer as any).sales[0].invoiceDate)
                          : (customer as any).lastVisit ? new Date((customer as any).lastVisit) : new Date(customer.createdAt)
                        ).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    {/* 3. satır: Danışman */}
                    {customer.assignedConsultantId && (
                      <div className="mt-1 text-xs text-gray-600">
                        Danışman: {(customer as any).assignedConsultant?.firstName || ''} {(customer as any).assignedConsultant?.lastName || ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0" />
                
                {/* Sağ Taraf - Butonlar */}
                <div className="flex items-center gap-4">
                  {/* Aksiyon Butonları */}
                  <div className="flex items-center gap-2">
                    {/* Müşteriyi Al - Boşta olan veya başka danışmandaysa göster */}
                    {(!customer.assignedConsultantId || (customer as any).assignedConsultant?.id !== session?.user?.id) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTakeCustomer(customer.id);
                        }}
                        className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
                      >
                        Müşteriyi Al
                      </button>
                    )}
                    
                    {/* Bırak - Sadece kendi müşterisiyse göster */}
                    {customer.assignedConsultantId && (customer as any).assignedConsultant?.id === session?.user?.id && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReleaseCustomer(customer.id, `${customer.firstName || ''} ${customer.lastName || ''}`);
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                      >
                        Bırak
                      </button>
                    )}

                    {/* Sepet Butonları - sadece kendi müşterisi için göster */}
                    {canManageCart && customer.assignedConsultantId === session?.user?.id && (
                      cartStatusByCustomer[customer.id]?.hasOpen ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); goCart(customer.id); }}
                            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                          >
                            Sepet Düzenle
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); goCheckout(customer.id); }}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                          >
                            Satış Yap
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCreateCart(customer.id); }}
                          className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                        >
                          Sepet Oluştur
                        </button>
                      )
                    )}
                    
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
    </div>
  );
}
