
"use client";

import { useState, useEffect } from 'react';
// Dialog component'i kaldırıldı, custom modal kullanılacak
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// Select component'i kaldırıldı, custom dropdown kullanılacak
import toast from 'react-hot-toast';

interface Parameter {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryInfo {
  value: string;
  label: string;
  icon: any;
  color: string;
}

interface TypeInfo {
  value: string;
  label: string;
}

interface EditParameterModalProps {
  parameter: Parameter | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryInfo[];
  types: TypeInfo[];
}

export function EditParameterModal({ parameter, isOpen, onClose, onSuccess, categories, types }: EditParameterModalProps) {
  const [loading, setLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'STRING',
    description: '',
    category: 'SYSTEM'
  });

  useEffect(() => {
    if (parameter && isOpen) {
      setFormData({
        key: parameter.key,
        value: parameter.value,
        type: parameter.type,
        description: parameter.description || '',
        category: parameter.category || 'SYSTEM'
      });
    }
  }, [parameter, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!parameter) return;

    if (!formData.key.trim()) {
      toast.error('Parametre anahtarı zorunludur');
      return;
    }

    if (!formData.value.trim()) {
      toast.error('Parametre değeri zorunludur');
      return;
    }

    // Validate based on type
    if (formData.type === 'NUMBER') {
      if (isNaN(Number(formData.value))) {
        toast.error('Geçersiz sayı değeri');
        return;
      }
    } else if (formData.type === 'BOOLEAN') {
      if (!['true', 'false'].includes(formData.value.toLowerCase())) {
        toast.error('Boolean değer true veya false olmalıdır');
        return;
      }
    } else if (formData.type === 'JSON') {
      try {
        JSON.parse(formData.value);
      } catch {
        toast.error('Geçersiz JSON formatı');
        return;
      }
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/parameters/${parameter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          key: formData.key.trim(),
          value: formData.value.trim(),
          description: formData.description.trim()
        })
      });

      if (response.ok) {
        toast.success('Parametre başarıyla güncellendi');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Bir hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      key: '',
      value: '',
      type: 'STRING',
      description: '',
      category: 'SYSTEM'
    });
    setShowCategoryDropdown(false);
    setShowTypeDropdown(false);
    onClose();
  };

  const getValuePlaceholder = () => {
    switch (formData.type) {
      case 'NUMBER':
        return '123 veya 45.67';
      case 'BOOLEAN':
        return 'true veya false';
      case 'JSON':
        return '{"key": "value"}';
      default:
        return 'Parametre değerini giriniz';
    }
  };

  const getValueHelp = () => {
    switch (formData.type) {
      case 'NUMBER':
        return 'Sayısal bir değer giriniz (tam sayı veya ondalık)';
      case 'BOOLEAN':
        return 'true (doğru) veya false (yanlış) değeri giriniz';
      case 'JSON':
        return 'Geçerli bir JSON formatında veri giriniz';
      default:
        return 'Metin değer giriniz';
    }
  };

  if (!parameter) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Parametreyi Düzenle</h2>
            <p className="text-sm text-gray-600 mt-1">
              Parametre detaylarını güncelleyin.
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="category">Kategori *</Label>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowTypeDropdown(false);
                }}
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.find(c => c.value === formData.category)?.label || "Kategori seçin"}
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2">▼</span>
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: category.value }));
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="type">Tür *</Label>
              <button
                type="button"
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowCategoryDropdown(false);
                }}
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {types.find(t => t.value === formData.type)?.label || "Tür seçin"}
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2">▼</span>
              </button>
              
              {showTypeDropdown && (
                <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {types.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: type.value }));
                        setShowTypeDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="key">Parametre Anahtarı *</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              placeholder="PARAMETER_NAME (büyük harf önerilir)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Benzersiz bir parametre anahtarı giriniz (örn: MAX_LOGIN_ATTEMPTS)
            </p>
          </div>

          <div>
            <Label htmlFor="value">Değer *</Label>
            {formData.type === 'JSON' ? (
              <Textarea
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={getValuePlaceholder()}
                rows={4}
                required
              />
            ) : (
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={getValuePlaceholder()}
                required
              />
            )}
            <p className="text-xs text-gray-500 mt-1">{getValueHelp()}</p>
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Parametrenin ne işe yaradığını açıklayınız"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Güncelleniyor...' : 'Parametreyi Güncelle'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
