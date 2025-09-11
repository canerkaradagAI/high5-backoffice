
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Key,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
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

interface RolesListProps {
  roles: Role[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onEdit: (role: Role) => void;
  onDelete: () => void;
}

export function RolesList({ 
  roles, 
  loading, 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange, 
  onEdit, 
  onDelete
}: RolesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Rol başarıyla silindi');
        onDelete();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Silme işlemi başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: tr });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roles.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Herhangi bir rol bulunamadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Roller ({totalCount})</span>
          <Badge variant="outline" className="text-sm">
            Sayfa {currentPage} / {totalPages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{role.name}</h3>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Rol
                    </Badge>
                  </div>
                  
                  {role.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {role.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(role)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === role.id || role._count.userRoles > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Rolü Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{role.name}" rolünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          {role._count.userRoles > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                              Bu rol {role._count.userRoles} kullanıcıya atanmış olduğu için silinemez.
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(role.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={role._count.userRoles > 0}
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 rounded p-2 mb-3">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{role._count.userRoles} kullanıcı</span>
                </div>
                <div className="flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>{role._count.rolePermissions} izin</span>
                </div>
              </div>

              {/* Permissions Preview */}
              {role.rolePermissions && role.rolePermissions.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">İzinler:</div>
                  <div className="flex flex-wrap gap-1">
                    {role.rolePermissions.slice(0, 3).map((rp) => (
                      <Badge key={rp.permission.id} variant="outline" className="text-xs">
                        {rp.permission.name}
                      </Badge>
                    ))}
                    {role.rolePermissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.rolePermissions.length - 3} daha
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex justify-between text-xs text-gray-400">
                <span>Oluşturulma: {formatDate(role.createdAt)}</span>
                <span>Güncelleme: {formatDate(role.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Toplam {totalCount} rolden {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalCount)} arası gösteriliyor
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Önceki
              </Button>
              
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sonraki
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
