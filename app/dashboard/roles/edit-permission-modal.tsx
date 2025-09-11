
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>İzni Düzenle</DialogTitle>
          <DialogDescription>
            İzin detaylarını güncelleyin.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
