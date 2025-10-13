
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const taskTypes = [
  'Müşteri Ziyareti',
  'Ürün Teslim',
  'Geri Arama',
  'Takip Görüşmesi',
  'Teknik Destek',
  'Şikayet Takip',
  'Satış Görüşmesi',
  'Diğer'
];

const deliveryLocations = [
  'SD Teslim',
  'Pick Up Alanı',
  'Deneme Kabini',
  'Kasa'
];

export function AddTaskModal({ isOpen, onClose, onSuccess }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'Normal',
    status: 'Bekliyor',
    assignedToId: '',
    customerId: '',
    notes: '',
    deliveryLocation: ''
  });
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch('/api/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await fetch('/api/customers?limit=100');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchCustomers();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Görev başlığı zorunludur');
      return;
    }

    if (!formData.type.trim()) {
      toast.error('Görev tipi zorunludur');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type.trim(),
        notes: formData.notes.trim(),
        assignedToId: formData.assignedToId || null,
        customerId: formData.customerId || null,
        dueDate: dueDate ? dueDate.toISOString() : null
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        toast.success('Görev başarıyla oluşturuldu');
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
      title: '',
      description: '',
      type: '',
      priority: 'Normal',
      status: 'Bekliyor',
      assignedToId: '',
      customerId: '',
      notes: '',
      deliveryLocation: ''
    });
    setDueDate(undefined);
    onClose();
  };

  const getUserDisplayName = (user: User) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.email;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Görev Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir görev oluşturun ve detaylarını belirleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Görev Başlığı *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Görev başlığını giriniz"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Görev Tipi *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Görev tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Öncelik</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Öncelik seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Düşük">Düşük</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Yüksek">Yüksek</SelectItem>
                  <SelectItem value="Acil">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                  <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  <SelectItem value="İptal">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Bitiş Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: tr }) : 'Tarih seçin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    locale={tr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="assignedTo">Atanan Kişi</Label>
              <Select value={formData.assignedToId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={usersLoading ? "Yükleniyor..." : "Kişi seçin"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Atama Yapma</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customer">Müşteri</Label>
              <Select value={formData.customerId} onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={customersLoading ? "Yükleniyor..." : "Müşteri seçin"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Müşteri Seçme</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullName} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deliveryLocation">Teslim Lokasyonu</Label>
              <Select value={formData.deliveryLocation} onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryLocation: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Teslim lokasyonu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Teslim Lokasyonu Seçme</SelectItem>
                  {deliveryLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Görev açıklamasını giriniz"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ek notlar giriniz"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Oluşturuluyor...' : 'Görev Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
