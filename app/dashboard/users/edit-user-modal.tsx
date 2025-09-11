
'use client';

import { useState } from 'react';
import { Role, User, UserRole } from '@prisma/client';
import { X, Save, Edit2, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

type UserWithRoles = User & {
  userRoles: (UserRole & {
    role: Role;
  })[];
};

interface EditUserModalProps {
  user: UserWithRoles;
  availableRoles: Role[];
  onClose: () => void;
  onUpdate: (user: UserWithRoles) => void;
}

export default function EditUserModal({ user, availableRoles, onClose, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    active: user.isActive,
    roleIds: user.userRoles.map(ur => ur.role.id)
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

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (formData.roleIds.length === 0) {
      newErrors.roles = 'En az bir rol seçmelisiniz';
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
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          active: formData.active,
          roleIds: formData.roleIds
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate(updatedUser);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Kullanıcı güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Kullanıcı güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roleIds: checked
        ? [...prev.roleIds, roleId]
        : prev.roleIds.filter(id => id !== roleId)
    }));
  };

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
              <h2 className="text-2xl font-bold olka-text-dark">Kullanıcı Düzenle</h2>
              <p className="text-gray-500">
                {user.firstName} {user.lastName} bilgilerini düzenleyin
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
                  placeholder="Kullanıcının adı"
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
                  placeholder="Kullanıcının soyadı"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`form-input pl-10 ${errors.email ? 'border-red-300' : ''}`}
                  placeholder="ornek@olka.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="form-input pl-10"
                  placeholder="0555 123 45 67"
                />
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Roller *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRoles.map((role) => (
                <label key={role.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(role.id)}
                    onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{role.name}</p>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.roles && (
              <p className="text-red-500 text-sm mt-1">{errors.roles}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Durum</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700">Kullanıcı aktif olsun</span>
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
