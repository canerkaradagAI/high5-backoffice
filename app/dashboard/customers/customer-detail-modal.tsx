
'use client';

import { useState, useEffect } from 'react';
import EditCustomerModal from './edit-customer-modal';
import { Customer } from '@prisma/client';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  FileText,
  Star,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { getKVKKCompliantData } from '@/lib/kvkk-utils';
import { useSession } from 'next-auth/react';

interface CustomerDetailModalProps {
  customer: any;
  onClose: () => void;
}

export default function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const { data: session } = useSession();
  const [localCustomer, setLocalCustomer] = useState<any>(customer);
  const [openEdit, setOpenEdit] = useState(false);
  const [sales, setSales] = useState<any[]>(customer.sales ?? []);
  const [showFullData, setShowFullData] = useState(false);
  const totalSpent = (sales && sales.length > 0)
    ? sales.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0)
    : Number(customer.totalSpent || 0);
  const lastPurchaseDate = (sales && sales.length > 0)
    ? new Date(sales[0].invoiceDate)
    : (customer.lastVisit ? new Date(customer.lastVisit) : null);
  const totalCount = (sales && sales.length > 0)
    ? sales.length
    : Number(customer.totalOrders || 0);
  const fullAddressString = customer.fullAddress || customer.address || [customer.neighborhood, customer.street, customer.buildingNo, customer.apartmentNo, customer.district, customer.city]
    .filter(Boolean)
    .join(' ');

  // KVKK uyumlu veri gösterimi
  const kvkkData = getKVKKCompliantData(
    {
      phone: localCustomer.phone,
      email: localCustomer.email,
      address: fullAddressString,
      tcNumber: localCustomer.tcNumber,
      firstName: localCustomer.firstName,
      lastName: localCustomer.lastName
    },
    (session?.user as any)?.role,
    showFullData
  );

  useEffect(() => {
    let aborted = false;
    async function loadSales() {
      try {
        const res = await fetch(`/api/customers/${customer.id}/sales`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!aborted) setSales(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    }
    loadSales();
    return () => { aborted = true; };
  }, [customer?.id]);
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Premium': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Classic': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Aday': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return <Star className="w-4 h-4" fill="currentColor" />;
      case 'Premium':
        return <TrendingUp className="w-4 h-4" />;
      case 'Classic':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 olka-gradient rounded-xl shadow">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold olka-text-dark leading-tight">
                {localCustomer.firstName || ''} {localCustomer.lastName || ''}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getSegmentColor(customer.segment || 'Aday')}`}>
                  {getSegmentIcon(localCustomer.segment || 'Aday')}
                  {localCustomer.segment || 'Aday'}
                </span>
                {localCustomer.assignedConsultant && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <User className="h-3 w-3" />
                    Danışman: {localCustomer.assignedConsultant.firstName} {localCustomer.assignedConsultant.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Kişisel Bilgiler (Telefon, Mail, Kayıt Tarihi, Açık Adres) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="h-5 w-5 olka-text-accent" />
              Kişisel Bilgiler
              </h3>
              <button
                onClick={() => setOpenEdit(true)}
                className="px-3 py-1 text-sm rounded-md bg-purple-200 text-purple-800 hover:bg-purple-300 transition-colors"
              >
                Düzenle
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Telefon Numarası</p>
                  <p className="text-gray-900">{kvkkData.phone}</p>
                </div>
                {!showFullData && (session?.user as any)?.role !== 'MANAGER' && (
                  <button
                    onClick={() => setShowFullData(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Tam veriyi göster"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                {showFullData && (
                  <button
                    onClick={() => setShowFullData(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Veriyi maskele"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Mail Adresi</p>
                  <p className="text-gray-900">{kvkkData.email}</p>
                </div>
                {!showFullData && (session?.user as any)?.role !== 'MANAGER' && (
                  <button
                    onClick={() => setShowFullData(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Tam veriyi göster"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                {showFullData && (
                  <button
                    onClick={() => setShowFullData(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Veriyi maskele"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Kayıt Tarihi</p>
                  <p className="text-gray-900">{new Date(localCustomer.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Açık Adres</p>
                  <p className="text-gray-900">{kvkkData.address}</p>
                </div>
                {!showFullData && (session?.user as any)?.role !== 'MANAGER' && (
                  <button
                    onClick={() => setShowFullData(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Tam veriyi göster"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                {showFullData && (
                  <button
                    onClick={() => setShowFullData(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Veriyi maskele"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* KVKK İzinleri */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 olka-text-accent" />
              KVKK İzinleri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-700">Kişisel Verilerin İşlenmesi</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${localCustomer.consentPersonalData ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {localCustomer.consentPersonalData ? 'Onaylı' : 'Onaysız'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-700">Pazarlama İzni</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${localCustomer.consentMarketing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {localCustomer.consentMarketing ? 'Onaylı' : 'Onaysız'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-700">Telefon Araması</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${localCustomer.consentCall ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {localCustomer.consentCall ? 'Onaylı' : 'Onaysız'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-700">Profilleme</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${localCustomer.consentProfiling ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {localCustomer.consentProfiling ? 'Onaylı' : 'Onaysız'}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          {customer.address && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 olka-text-accent" />
                Adres Bilgisi
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{customer.address}</p>
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5 olka-text-accent" />
              Mali Bilgiler
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 olka-text-accent" />
                  <p className="text-sm font-medium text-gray-700">Toplam Harcama</p>
                </div>
                <p className="text-2xl font-bold olka-text-dark">
                  ₺{Number(totalSpent).toLocaleString('tr-TR')}
                </p>
              </div>

              {/* Toplam Miktar */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-700">Toplam Miktar</p>
                </div>
                <p className="text-lg font-semibold text-green-700">
                  {totalCount.toLocaleString('tr-TR')}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-700">Son Alışveriş</p>
                </div>
                <p className="text-lg font-semibold text-blue-700">
                  {lastPurchaseDate ? lastPurchaseDate.toLocaleDateString('tr-TR') : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Geçmiş Alışverişler */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5 olka-text-accent" />
              Geçmiş Alışverişler
            </h3>
            
            {sales && sales.length > 0 ? (
              <div className="space-y-3">
                {sales.slice(0, 5).map((purchase: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Ürün Görseli */}
                    <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <img 
                        src={`${purchase.imageUrl || '/placeholder-product.svg'}?v=${Date.now()}&cache=${Math.random()}&force=${Math.random()}`} 
                        alt="Skechers Ayakkabı"
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">SK</span>
                      </div>
                    </div>
                    
                    {/* Ürün Bilgileri */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {purchase.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {purchase.description || 'Rahat ve şık günlük ayakkabı'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(purchase.invoiceDate).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          ₺{Number(purchase.amount || 0).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Fatura Numarası */}
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Fatura</span>
                      <p className="text-xs font-mono text-gray-700">
                        #{String(purchase.id).slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Henüz alışveriş geçmişi bulunmamaktadır.
                </p>
              </div>
            )}
          </div>

          {/* Müşteri Notları ve Sistem Bilgileri kaldırıldı */}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary px-6"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
    {openEdit && (
      <EditCustomerModal
        customer={localCustomer}
        onClose={() => setOpenEdit(false)}
        onUpdate={(updated: any) => {
          setLocalCustomer(updated);
          setOpenEdit(false);
        }}
      />
    )}
    </>
  );
}
