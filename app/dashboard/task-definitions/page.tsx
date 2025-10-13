'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package,
  User,
  Shield,
  Settings,
  Search,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskDefinition {
  id: string;
  name: string;
  description: string | null;
  role: string;
  requiresProductCode: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
  };
}

const ROLE_ICONS = {
  'Runner': User,
  'Satış Danışmanı': Package,
  'Mağaza Müdürü': Shield,
  'Sistem': Settings
};

const ROLE_COLORS = {
  'Runner': 'text-blue-600 bg-blue-50',
  'Satış Danışmanı': 'text-green-600 bg-green-50', 
  'Mağaza Müdürü': 'text-purple-600 bg-purple-50',
  'Sistem': 'text-gray-600 bg-gray-50'
};

const ROLES = ['Runner', 'Satış Danışmanı', 'Mağaza Müdürü'];

export default function TaskDefinitionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Rol kontrolü
  useEffect(() => {
    if (session?.user) {
      const userRoles = (session.user as any)?.roles || [];
      const isManager = userRoles.some((r: any) => r?.name === 'Mağaza Müdürü');
      
      if (!isManager) {
        toast.error('Bu sayfaya erişim yetkiniz yok');
        router.push('/dashboard');
        return;
      }
    }
  }, [session, router]);

  const fetchTaskDefinitions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/task-definitions');
      if (response.ok) {
        const data = await response.json();
        setTaskDefinitions(data);
      } else {
        toast.error('Görev tanımları yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error fetching task definitions:', error);
      toast.error('Görev tanımları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDefinitions();
  }, []);

  const handleCreateTask = async (taskData: Partial<TaskDefinition>) => {
    try {
      const response = await fetch('/api/task-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        toast.success('Görev tanımı oluşturuldu');
        fetchTaskDefinitions();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Görev tanımı oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating task definition:', error);
      toast.error('Görev tanımı oluşturulurken hata oluştu');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<TaskDefinition>) => {
    try {
      const response = await fetch(`/api/task-definitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success('Görev tanımı güncellendi');
        fetchTaskDefinitions();
        setEditingTask(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Görev tanımı güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating task definition:', error);
      toast.error('Görev tanımı güncellenirken hata oluştu');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Bu görev tanımını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/task-definitions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Görev tanımı silindi');
        fetchTaskDefinitions();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Görev tanımı silinemedi');
      }
    } catch (error) {
      console.error('Error deleting task definition:', error);
      toast.error('Görev tanımı silinirken hata oluştu');
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/task-definitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`Görev tanımı ${!isActive ? 'aktif' : 'pasif'} hale getirildi`);
        fetchTaskDefinitions();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Görev durumu değiştirilemedi');
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
      toast.error('Görev durumu değiştirilirken hata oluştu');
    }
  };

  // Filtreleme
  const filteredTasks = taskDefinitions.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || task.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && task.isActive) ||
                         (statusFilter === 'inactive' && !task.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Rol bazında gruplandırma
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.role]) acc[task.role] = [];
    acc[task.role].push(task);
    return acc;
  }, {} as Record<string, TaskDefinition[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-gray-600">Görev tanımları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Görev Tanımları</h1>
          <p className="text-gray-600 mt-1">Rol bazında görev tanımlarını yönetin</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Görev Tanımı
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{taskDefinitions.length}</div>
            <p className="text-sm text-gray-600">Toplam Görev</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {taskDefinitions.filter(t => t.isActive).length}
            </div>
            <p className="text-sm text-gray-600">Aktif Görev</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {taskDefinitions.filter(t => t.requiresProductCode).length}
            </div>
            <p className="text-sm text-gray-600">Ürün Kodu Gerekli</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(groupedTasks).length}
            </div>
            <p className="text-sm text-gray-600">Rol Sayısı</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Görev ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Roller</option>
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Definitions by Role */}
      {Object.entries(groupedTasks).map(([role, tasks]) => {
        const IconComponent = ROLE_ICONS[role as keyof typeof ROLE_ICONS];
        const colorClass = ROLE_COLORS[role as keyof typeof ROLE_COLORS];
        
        return (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="w-5 h-5" />
                <span>{role}</span>
                <Badge variant="secondary" className={colorClass}>
                  {tasks.length} görev
                </Badge>
              </CardTitle>
              <CardDescription>
                {role} rolü için tanımlanmış görevler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{task.name}</span>
                        {task.requiresProductCode && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Ürün Kodu Gerekli
                          </Badge>
                        )}
                        <Badge variant={task.isActive ? "default" : "secondary"}>
                          {task.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Oluşturan: {task.createdBy.firstName} {task.createdBy.lastName} • 
                        {new Date(task.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(task.id, task.isActive)}
                      >
                        {task.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Görev Tanımı</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleCreateTask({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                role: formData.get('role') as string,
                requiresProductCode: formData.get('requiresProductCode') === 'on'
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Görev Adı *
                  </label>
                  <Input
                    name="name"
                    placeholder="Görev adını girin"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <Input
                    name="description"
                    placeholder="Görev açıklaması"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Rol seçin</option>
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="requiresProductCode"
                    id="requiresProductCode"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="requiresProductCode" className="text-sm font-medium text-gray-700">
                    Bu görev ürün kodu gerektirir
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  Oluştur
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Görev Tanımını Düzenle</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleUpdateTask(editingTask.id, {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                role: formData.get('role') as string,
                requiresProductCode: formData.get('requiresProductCode') === 'on'
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Görev Adı *
                  </label>
                  <Input
                    name="name"
                    defaultValue={editingTask.name}
                    placeholder="Görev adını girin"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <Input
                    name="description"
                    defaultValue={editingTask.description || ''}
                    placeholder="Görev açıklaması"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    name="role"
                    defaultValue={editingTask.role}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="requiresProductCode"
                    id="requiresProductCodeEdit"
                    defaultChecked={editingTask.requiresProductCode}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="requiresProductCodeEdit" className="text-sm font-medium text-gray-700">
                    Bu görev ürün kodu gerektirir
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                  İptal
                </Button>
                <Button type="submit">
                  Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
