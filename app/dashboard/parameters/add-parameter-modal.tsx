
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

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

interface AddParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryInfo[];
  types: TypeInfo[];
}

export function AddParameterModal({ isOpen, onClose, onSuccess, categories, types }: AddParameterModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'STRING',
    description: '',
    category: 'SYSTEM'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          key: formData.key.trim(),
          value: formData.value.trim(),
          description: formData.description.trim()
        })
      });

      if (response.ok) {
        toast.success('Parametre başarıyla oluşturuldu');
        onSuccess();
        handleClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Parametre Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir sistem parametresi oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Tür *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {loading ? 'Oluşturuluyor...' : 'Parametre Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
