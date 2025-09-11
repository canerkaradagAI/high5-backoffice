
'use client';

import { useState } from 'react';
import { Customer } from '@prisma/client';
import { X, Save, User, Mail, Phone, MapPin, CreditCard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddCustomerModalProps {
  onClose: () => void;
  onAdd: (customer: Customer) => void;
}

export default function AddCustomerModal({ onClose, onAdd }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tcNumber: '',
    address: '',
    city: '',
    district: '',
    neighborhood: '',
    street: '',
    buildingNo: '',
    apartmentNo: '',
    fullAddress: '',
    birthDate: '',
    gender: 'Belirtmek istemiyorum',
    consentPersonalData: false,
    consentMarketing: false,
    consentCall: false,
    consentProfiling: false,
    segment: 'Aday' as const,
    totalSpent: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (formData.tcNumber && formData.tcNumber.length !== 11) {
      newErrors.tcNumber = 'TC Kimlik Numarası 11 haneli olmalıdır';
    }

    if (formData.tcNumber && !/^\d+$/.test(formData.tcNumber)) {
      newErrors.tcNumber = 'TC Kimlik Numarası sadece rakam içermelidir';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon numarası gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim(),
          tcNumber: formData.tcNumber.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          district: formData.district.trim() || null,
          neighborhood: formData.neighborhood.trim() || null,
          street: formData.street.trim() || null,
          buildingNo: formData.buildingNo.trim() || null,
          apartmentNo: formData.apartmentNo.trim() || null,
          fullAddress: formData.fullAddress.trim() || null,
          birthDate: formData.birthDate || null,
          gender: formData.gender || null,
          segment: formData.segment,
          totalSpent: formData.totalSpent,
          consentPersonalData: formData.consentPersonalData,
          consentMarketing: formData.consentMarketing,
          consentCall: formData.consentCall,
          consentProfiling: formData.consentProfiling
        }),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        onAdd(newCustomer);
      } else {
        const raw = await response.text();
        let error: any = {};
        try { error = JSON.parse(raw); } catch { error = { message: raw }; }
        toast.error(error?.message || 'Müşteri eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Müşteri eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const segments = [
    { value: 'Aday', label: 'Aday', description: 'Yeni müşteri' },
    { value: 'Classic', label: 'Classic', description: 'Standart müşteri' },
    { value: 'Premium', label: 'Premium', description: 'Premium müşteri' },
    { value: 'VIP', label: 'VIP', description: 'VIP müşteri' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 olka-bg-light rounded-xl">
              <User className="h-6 w-6 olka-text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold olka-text-dark">Yeni Müşteri Ekle</h2>
              <p className="text-gray-500">Sisteme yeni müşteri ekleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Kişisel Bilgiler</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className={`form-input ${errors.firstName ? 'border-red-300' : ''}`}
                  placeholder="Müşterinin adı"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className={`form-input ${errors.lastName ? 'border-red-300' : ''}`}
                  placeholder="Müşterinin soyadı"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* TC Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TC Kimlik Numarası
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  maxLength={11}
                  value={formData.tcNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, tcNumber: e.target.value.replace(/\D/g, '') }))}
                  className={`form-input pl-10 ${errors.tcNumber ? 'border-red-300' : ''}`}
                  placeholder="12345678901"
                />
              </div>
              {errors.tcNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.tcNumber}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">İletişim Bilgileri</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`form-input pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                    placeholder="0555 123 45 67"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`form-input pl-10 ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="ornek@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="form-input pl-10 min-h-[100px] resize-y"
                  placeholder="Müşteri adres bilgisi"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Adres Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İl</label>
                <input type="text" className="form-input" value={formData.city} onChange={(e)=>setFormData(p=>({...p, city:e.target.value}))} placeholder="İstanbul" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İlçe</label>
                <input type="text" className="form-input" value={formData.district} onChange={(e)=>setFormData(p=>({...p, district:e.target.value}))} placeholder="Kadıköy" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mahalle</label>
                <input type="text" className="form-input" value={formData.neighborhood} onChange={(e)=>setFormData(p=>({...p, neighborhood:e.target.value}))} placeholder="Fenerbahçe Mahallesi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sokak</label>
                <input type="text" className="form-input" value={formData.street} onChange={(e)=>setFormData(p=>({...p, street:e.target.value}))} placeholder="Atatürk Caddesi" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bina No</label>
                <input type="text" className="form-input" value={formData.buildingNo} onChange={(e)=>setFormData(p=>({...p, buildingNo:e.target.value}))} placeholder="123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daire No</label>
                <input type="text" className="form-input" value={formData.apartmentNo} onChange={(e)=>setFormData(p=>({...p, apartmentNo:e.target.value}))} placeholder="4" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tam Adres</label>
                <input type="text" className="form-input" value={formData.fullAddress} onChange={(e)=>setFormData(p=>({...p, fullAddress:e.target.value}))} placeholder="Detaylı adres" />
              </div>
            </div>
          </div>

          {/* Personal extras */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Ek Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
                <input type="date" className="form-input" value={formData.birthDate} onChange={(e)=>setFormData(p=>({...p, birthDate:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cinsiyet</label>
                <select className="form-input" value={formData.gender} onChange={(e)=>setFormData(p=>({...p, gender:e.target.value}))}>
                  <option value="Kadın">Kadın</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">İş Bilgileri</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Segment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri Segmenti *
                </label>
                <select
                  value={formData.segment}
                  onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value as any }))}
                  className="form-input"
                >
                  {segments.map(segment => (
                    <option key={segment.value} value={segment.value}>
                      {segment.label} - {segment.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Spent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toplam Harcama (₺)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalSpent}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalSpent: parseFloat(e.target.value) || 0 }))}
                    className="form-input pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KVKK Consents */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">KVKK İzinleri</h3>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={formData.consentPersonalData} onChange={(e)=>setFormData(p=>({...p, consentPersonalData:e.target.checked}))} />
              Kişisel verilerin işlenmesine onay veriyorum
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={formData.consentMarketing} onChange={(e)=>setFormData(p=>({...p, consentMarketing:e.target.checked}))} />
              Pazarlama faaliyetleri için iletişim kurulmasına onay veriyorum
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={formData.consentCall} onChange={(e)=>setFormData(p=>({...p, consentCall:e.target.checked}))} />
              Telefon ile aranmaya onay veriyorum
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={formData.consentProfiling} onChange={(e)=>setFormData(p=>({...p, consentProfiling:e.target.checked}))} />
              Profilleme faaliyetlerine onay veriyorum
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Müşteri Ekle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
