'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, ArrowLeft, UserCheck } from 'lucide-react';
import AddCustomerModal from '../add-customer-modal';
import CustomerDetailModal from '../customer-detail-modal';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  assignedConsultantId: string | null;
}

export default function CustomerSearchPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'phone' | 'name' | 'email' | 'nationalId'>('phone');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (mode === 'phone') params.set('phone', query);
      if (mode === 'name') params.set('name', query);
      if (mode === 'email') params.set('email', query);
      if (mode === 'nationalId') params.set('nationalId', query);
      let res = await fetch(`/api/customers/search?${params.toString()}`);
      if (!res.ok) {
        res = await fetch(`/app/api/customers/search?${params.toString()}`);
      }
      if (res.ok) {
        const data = await res.json();
        setResults(data || []);
      } else {
        toast.error('Arama sırasında hata oluştu');
      }
    } catch (e) {
      toast.error('Arama sırasında beklenmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeCustomer = async (id: string) => {
    try {
      // Oturumdan danışman id'yi al ve body ile gönder
      let userId: string | null = null;
      try {
        const s = await fetch('/api/auth/session', { cache: 'no-store' });
        if (s.ok) {
          const js = await s.json();
          userId = js?.user?.id || null;
        }
      } catch {}

      const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultantId: userId })
      } as RequestInit;

      let res = await fetch(`/api/customers/${id}/assign`, payload);
      if (!res.ok) {
        // Fallback: bazı ortamlarda rota /app/api altında olabilir
        res = await fetch(`/app/api/customers/${id}/assign`, payload);
      }

      if (res.ok) {
        toast.success('Müşteri alındı');
        router.push('/dashboard/customers');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Müşteri alınamadı');
      }
    } catch {
      toast.error('İşlem sırasında hata');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft className="h-5 w-5" /> Geri
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" /> Müşteri Ekle
          </button>
        </div>
      </div>

      {/* Arama Alanı */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama Türü</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="form-input"
            >
              <option value="phone">Telefon Numarası</option>
              <option value="name">İsim / Soyisim</option>
              <option value="email">E‑posta</option>
              <option value="nationalId">TC Kimlik No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'phone' && 'Telefon Numarası'}
              {mode === 'name' && 'İsim veya Soyisim'}
              {mode === 'email' && 'E‑posta'}
              {mode === 'nationalId' && 'TC Kimlik No'}
            </label>
            <input
              className="form-input"
              placeholder={mode === 'phone' ? '555...' : mode === 'name' ? 'Ad Soyad' : mode === 'email' ? 'mail@' : '11 haneli TC'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
            >
              <Search className="h-4 w-4" /> {loading ? 'Aranıyor...' : 'Ara'}
            </button>
          </div>
        </div>
      </div>

      {/* Sonuçlar */}
      <div className="space-y-2">
        {hasSearched && results.map((c) => (
          <div key={c.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{c.fullName || `${c.firstName || ''} ${c.lastName || ''}`}</p>
              <p className="text-sm text-gray-600">{c.phone || '-'} • {c.email || '-'}</p>
              {c.nationalId && (
                <p className="text-xs text-gray-500">TC: {c.nationalId}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedCustomer(c)} className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50">Detaya Git</button>
              <button
                onClick={() => handleTakeCustomer(c.id)}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" /> Müşteriyi Al
              </button>
            </div>
          </div>
        ))}
        {hasSearched && !loading && results.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <div className="mb-2">Müşteri Bulunamadı</div>
            <div className="text-sm text-gray-400">“{query}” için sonuç bulunamadı. Üstteki “Müşteri Ekle” butonunu kullanabilirsiniz.</div>
          </div>
        )}
        {!hasSearched && (
          <div className="text-center text-sm text-gray-500 py-8">Arama türünü seçip değer girin, ardından Ara'ya basın.</div>
        )}
      </div>

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onAdd={() => {
            setShowAdd(false);
            toast.success('Müşteri eklendi');
          }}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}


