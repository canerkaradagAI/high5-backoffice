
'use client';

import { useState, useEffect } from 'react';
import { User, Role, UserRole } from '@prisma/client';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddUserModal from './add-user-modal';
import EditUserModal from './edit-user-modal';

type UserWithRoles = User & {
  userRoles: (UserRole & {
    role: Role;
  })[];
};

interface UsersListProps {
  initialUsers: UserWithRoles[];
  availableRoles: Role[];
}

export default function UsersList({ initialUsers, availableRoles }: UsersListProps) {
  const [users, setUsers] = useState<UserWithRoles[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter users based on search term, status, and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    const matchesRole = 
      roleFilter === 'all' || 
      user.userRoles.some(ur => ur.role.id === roleFilter);

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, isActive: !currentStatus } : user
          )
        );
        toast.success(
          currentStatus 
            ? 'Kullanıcı pasif hale getirildi' 
            : 'Kullanıcı aktif hale getirildi'
        );
      } else {
        throw new Error('Status değiştirilemedi');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Status değiştirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" kullanıcısını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        toast.success('Kullanıcı başarıyla silindi');
      } else {
        throw new Error('Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Kullanıcı silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (newUser: UserWithRoles) => {
    setUsers(prev => [newUser, ...prev]);
    setShowAddModal(false);
    toast.success('Kullanıcı başarıyla eklendi');
  };

  const handleUpdateUser = (updatedUser: UserWithRoles) => {
    setUsers(prev => 
      prev.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
    setEditingUser(null);
    toast.success('Kullanıcı başarıyla güncellendi');
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'mağaza müdürü': return 'role-manager';
      case 'satış danışmanı': return 'role-consultant';
      case 'runner': return 'role-runner';
      default: return 'role-manager';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Kullanıcı ara (isim, e-posta)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 pr-4"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="form-input min-w-[120px]"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input min-w-[150px]"
            >
              <option value="all">Tüm Roller</option>
              {availableRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            {/* Add User Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Kullanıcı Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Users Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {filteredUsers.length} kullanıcı bulundu
          {users.length !== filteredUsers.length && ` (${users.length} toplam)`}
        </p>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Kullanıcı</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">E-posta</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Rol</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Durum</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Kayıt Tarihi</th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Shield className="h-12 w-12 text-gray-300" />
                      <p>Kullanıcı bulunamadı</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-900">{user.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.userRoles.length === 0 ? (
                          <span className="text-sm text-gray-500">Rol atanmamış</span>
                        ) : (
                          user.userRoles.map((userRole) => (
                            <span
                              key={userRole.role.id}
                              className={`${getRoleBadgeColor(userRole.role.name)} text-xs`}
                            >
                              {userRole.role.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={user.isActive ? 'status-active' : 'status-inactive'}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          disabled={loading}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive 
                              ? 'text-orange-600 hover:bg-orange-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddUserModal
          availableRoles={availableRoles}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddUser}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          availableRoles={availableRoles}
          onClose={() => setEditingUser(null)}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
}
