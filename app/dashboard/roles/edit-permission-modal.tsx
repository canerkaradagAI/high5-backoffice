
"use client";

import { useState, useEffect } from 'react';
// Dialog component'i kaldırıldı, custom modal kullanılacak
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    rolePermissions: number;
  };
}

interface EditPermissionModalProps {
  permission: Permission | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPermissionModal({ permission, isOpen, onClose, onSuccess }: EditPermissionModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (permission && isOpen) {
      setFormData({
        name: permission.name,
        description: permission.description || ''
      });
    }
  }, [permission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!permission) return;

    if (!formData.name.trim()) {
      toast.error('İzin adı zorunludur');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/permissions/${permission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim()
        })
      });

      if (response.ok) {
        toast.success('İzin başarıyla güncellendi');
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
      name: '',
      description: ''
    });
    onClose();
  };

  if (!permission) return null;

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
            <h2 className="text-xl font-semibold text-gray-900">İzni Düzenle</h2>
            <p className="text-sm text-gray-600 mt-1">
              İzin detaylarını güncelleyin.
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">İzin Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="İzin adını giriniz (örn: Kullanıcı Yönetimi)"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="İzin açıklamasını giriniz"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Güncelleniyor...' : 'İzni Güncelle'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
