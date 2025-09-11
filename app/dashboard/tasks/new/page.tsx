'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Plus, 
  User, 
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const RUNNER_TASK_TYPES = [
  { value: 'customer_product_delivery', label: 'Müşteriye Ürün Getir' },
  { value: 'customer_cabin_delivery', label: 'Müşteri Kabinine Ürün Getir' },
  { value: 'cabin_cleanup', label: 'Deneme Kabinini Temizle' },
  { value: 'floor_organization', label: 'Reyondaki Ürünleri Topla' },
  { value: 'inventory_check', label: 'Stok Kontrolü Yap' },
  { value: 'price_update', label: 'Fiyat Etiketlerini Güncelle' },
  { value: 'display_arrangement', label: 'Vitrin Düzenlemesi' },
  { value: 'customer_assistance', label: 'Müşteri Yardımı' }
];

const CONSULTANT_TASK_TYPES = Array.from({ length: 6 }).map((_, idx) => {
  const num = 100 + idx; // 100-105
  return { value: `tablet_wait_${num}`, label: `${num} No'lu Tablette Müşteri Bekliyor` };
});

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Düşük', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Orta', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Yüksek', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Acil', color: 'bg-red-100 text-red-800' }
];

export default function NewTaskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({
    type: '',
    priority: '',
    description: '',
    assigneeRole: 'Runner',
    assignedToId: ''
  });
  const [users, setUsers] = useState<Array<{ id: string; firstName: string | null; lastName: string | null; email: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const taskTypes = formData.assigneeRole === 'Satış Danışmanı' ? CONSULTANT_TASK_TYPES : RUNNER_TASK_TYPES;

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        const roleName = formData.assigneeRole === 'Runner' ? 'Runner' : 'Satış Danışmanı';
        const res = await fetch(`/app/api/users/by-role?role=${encodeURIComponent(roleName)}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        } else {
          setUsers([]);
        }
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, [formData.assigneeRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.priority) {
      toast.error('Görev türü ve aciliyet seviyesi gereklidir');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTypes.find(t => t.value === formData.type)?.label || '',
          type: formData.type,
          priority: formData.priority,
          description: formData.description,
          assignedTo: formData.assignedToId || null,
          status: formData.assignedToId ? 'ASSIGNED' : 'PENDING'
        })
      });
      if (response.ok) {
        toast.success('Görev başarıyla oluşturuldu');
        router.push('/dashboard/tasks?view=requests');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Görev oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Görev oluşturulurken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yeni Görev</h1>
                <p className="text-sm text-gray-600">Görev detaylarını doldurun</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-8">
            {/* Atama Tipi ve Kullanıcı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Atama Tipi</label>
                <div className="flex gap-3">
                  {['Runner','Satış Danışmanı'].map(role => (
                    <label key={role} className={`px-3 py-2 border rounded-md cursor-pointer ${formData.assigneeRole === role ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                      <input type="radio" name="assigneeRole" value={role} checked={formData.assigneeRole === role} onChange={(e) => setFormData({ ...formData, assigneeRole: e.target.value as any, assignedToId: '', type: '' })} className="sr-only" />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Kullanıcı ({formData.assigneeRole})</label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seçim yapma (Görev Havuzuna düşsün)</option>
                  {loadingUsers ? <option>Yükleniyor...</option> : users.map(u => (
                    <option key={u.id} value={u.id}>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Görev Türü */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Görev Türü *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Görev türünü seçin</option>
                {taskTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Açıklama */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Görev hakkında ek bilgiler..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Aciliyet Seviyesi */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Aciliyet Seviyesi *</label>
              <div className="grid grid-cols-2 gap-3">
                {PRIORITY_LEVELS.map((priority) => (
                  <label key={priority.value} className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.priority === priority.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input type="radio" name="priority" value={priority.value} checked={formData.priority === priority.value} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="sr-only" />
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${priority.value === 'urgent' ? 'bg-red-500' : priority.value === 'high' ? 'bg-orange-500' : priority.value === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <span className="text-sm font-medium">{priority.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => router.push('/dashboard')} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">İptal</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              {isSubmitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Oluşturuluyor...</>) : (<><Plus className="w-4 h-4" />Görev Oluştur</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
