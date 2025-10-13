
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// Tabs component'i kaldırıldı, custom tabs kullanılacak
import { 
  Plus, 
  Search, 
  Shield,
  Users,
  Key,
  Settings
} from 'lucide-react';
import { RolesList } from './roles-list';
import { PermissionsList } from './permissions-list';
import { AddRoleModal } from './add-role-modal';
import { EditRoleModal } from './edit-role-modal';
import { AddPermissionModal } from './add-permission-modal';
import { EditPermissionModal } from './edit-permission-modal';
import toast from 'react-hot-toast';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions?: Array<{
    permission: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  _count: {
    userRoles: number;
    rolePermissions: number;
  };
}

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

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState('roles');
  
  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [rolesCurrentPage, setRolesCurrentPage] = useState(1);
  const [rolesTotalPages, setRolesTotalPages] = useState(1);
  const [rolesTotalCount, setRolesTotalCount] = useState(0);
  
  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [permissionsCurrentPage, setPermissionsCurrentPage] = useState(1);
  const [permissionsTotalPages, setPermissionsTotalPages] = useState(1);
  const [permissionsTotalCount, setPermissionsTotalCount] = useState(0);
  
  // Modals state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAddPermissionModalOpen, setIsAddPermissionModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const params = new URLSearchParams({
        page: rolesCurrentPage.toString(),
        limit: '10',
        search: roleSearchTerm,
        includePermissions: 'true'
      });

      const response = await fetch(`/api/roles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
        setRolesTotalPages(data.pagination.pages);
        setRolesTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Roller yüklenirken hata oluştu');
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const params = new URLSearchParams({
        page: permissionsCurrentPage.toString(),
        limit: '15',
        search: permissionSearchTerm
      });

      const response = await fetch(`/api/permissions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
        setPermissionsTotalPages(data.pagination.pages);
        setPermissionsTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('İzinler yüklenirken hata oluştu');
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'roles') {
      fetchRoles();
    }
  }, [activeTab, rolesCurrentPage, roleSearchTerm]);

  useEffect(() => {
    if (activeTab === 'permissions') {
      fetchPermissions();
    }
  }, [activeTab, permissionsCurrentPage, permissionSearchTerm]);

  const handleRoleAdded = () => {
    fetchRoles();
    setIsAddRoleModalOpen(false);
  };

  const handleRoleUpdated = () => {
    fetchRoles();
    setEditingRole(null);
  };

  const handleRoleDeleted = () => {
    fetchRoles();
  };

  const handlePermissionAdded = () => {
    fetchPermissions();
    setIsAddPermissionModalOpen(false);
  };

  const handlePermissionUpdated = () => {
    fetchPermissions();
    setEditingPermission(null);
  };

  const handlePermissionDeleted = () => {
    fetchPermissions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rol ve İzin Yönetimi</h1>
          <p className="text-gray-600 mt-1">Kullanıcı rollerini ve izinlerini yönetin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Toplam Rol</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{rolesTotalCount}</div>
            <p className="text-xs text-blue-600">Aktif roller</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Toplam İzin</CardTitle>
            <Key className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{permissionsTotalCount}</div>
            <p className="text-xs text-green-600">Mevcut izinler</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">En Çok İzin</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {Math.max(...roles.map(r => r._count.rolePermissions), 0)}
            </div>
            <p className="text-xs text-purple-600">Bir rolde olan izin sayısı</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Aktif Atamalar</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {roles.reduce((sum, role) => sum + role._count.userRoles, 0)}
            </div>
            <p className="text-xs text-orange-600">Toplam rol ataması</p>
          </CardContent>
        </Card>
      </div>

      {/* Custom Tabs */}
      <div className="w-full">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            Roller ({rolesTotalCount})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="w-4 h-4" />
            İzinler ({permissionsTotalCount})
          </button>
        </div>

        {activeTab === 'roles' && (
          <div className="space-y-4 mt-4">
          {/* Roles Header */}
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rol ara..."
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsAddRoleModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Rol
            </Button>
          </div>

          <RolesList 
            roles={roles}
            loading={rolesLoading}
            currentPage={rolesCurrentPage}
            totalPages={rolesTotalPages}
            totalCount={rolesTotalCount}
            onPageChange={setRolesCurrentPage}
            onEdit={setEditingRole}
            onDelete={handleRoleDeleted}
          />
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-4 mt-4">
          {/* Permissions Header */}
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="İzin ara..."
                value={permissionSearchTerm}
                onChange={(e) => setPermissionSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsAddPermissionModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni İzin
            </Button>
          </div>

          <PermissionsList 
            permissions={permissions}
            loading={permissionsLoading}
            currentPage={permissionsCurrentPage}
            totalPages={permissionsTotalPages}
            totalCount={permissionsTotalCount}
            onPageChange={setPermissionsCurrentPage}
            onEdit={setEditingPermission}
            onDelete={handlePermissionDeleted}
          />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddRoleModal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        onSuccess={handleRoleAdded}
      />

      <EditRoleModal
        role={editingRole}
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        onSuccess={handleRoleUpdated}
      />

      <AddPermissionModal
        isOpen={isAddPermissionModalOpen}
        onClose={() => setIsAddPermissionModalOpen(false)}
        onSuccess={handlePermissionAdded}
      />

      <EditPermissionModal
        permission={editingPermission}
        isOpen={!!editingPermission}
        onClose={() => setEditingPermission(null)}
        onSuccess={handlePermissionUpdated}
      />
    </div>
  );
}
