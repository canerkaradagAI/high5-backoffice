
'use client';

import { useState } from 'react';
import { Customer } from '@prisma/client';
import { X, Save, Edit2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onUpdate: (customer: Customer) => void;
}

export default function EditCustomerModal({ customer, onClose, onUpdate }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    email: customer.email || '',
    phone: customer.phone || '',
    tcNumber: customer.tcNumber || '',
    address: customer.address || '',
    // KVKK
    consentPersonalData: (customer as any).consentPersonalData ?? false,
    consentMarketing: (customer as any).consentMarketing ?? false,
    consentCall: (customer as any).consentCall ?? false,
    consentProfiling: (customer as any).consentProfiling ?? false
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
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
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
          consentPersonalData: formData.consentPersonalData,
          consentMarketing: formData.consentMarketing,
          consentCall: formData.consentCall,
          consentProfiling: formData.consentProfiling
        }),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        onUpdate(updatedCustomer);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Müşteri güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Müşteri güncellenirken hata oluştu');
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
              <Edit2 className="h-6 w-6 olka-text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold olka-text-dark">Müşteri Düzenle</h2>
              <p className="text-gray-500">
                {customer.firstName || ''} {customer.lastName || ''} bilgilerini düzenleyin
              </p>
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

          {/* KVKK İzinleri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">KVKK İzinleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input type="checkbox" checked={formData.consentPersonalData} onChange={(e)=>setFormData(p=>({...p, consentPersonalData:e.target.checked}))} />
                <span>Kişisel verilerin işlenmesi</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input type="checkbox" checked={formData.consentMarketing} onChange={(e)=>setFormData(p=>({...p, consentMarketing:e.target.checked}))} />
                <span>Pazarlama izni</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input type="checkbox" checked={formData.consentCall} onChange={(e)=>setFormData(p=>({...p, consentCall:e.target.checked}))} />
                <span>Telefon araması</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input type="checkbox" checked={formData.consentProfiling} onChange={(e)=>setFormData(p=>({...p, consentProfiling:e.target.checked}))} />
                <span>Profilleme</span>
              </label>
            </div>
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
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Değişiklikleri Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
