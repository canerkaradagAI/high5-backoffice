
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
  Key,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
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

interface PermissionsListProps {
  permissions: Permission[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onEdit: (permission: Permission) => void;
  onDelete: () => void;
}

export function PermissionsList({ 
  permissions, 
  loading, 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange, 
  onEdit, 
  onDelete
}: PermissionsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/permissions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('İzin başarıyla silindi');
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!permissions.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Herhangi bir izin bulunamadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>İzinler ({totalCount})</span>
          <Badge variant="outline" className="text-sm">
            Sayfa {currentPage} / {totalPages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissions.map((permission) => (
            <div key={permission.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{permission.name}</h3>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <Key className="w-3 h-3 mr-1" />
                      İzin
                    </Badge>
                  </div>
                  
                  {permission.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {permission.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(permission)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 h-7 w-7 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        disabled={deletingId === permission.id || permission._count.rolePermissions > 0}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>İzni Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{permission.name}" iznini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          {permission._count.rolePermissions > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                              Bu izin {permission._count.rolePermissions} role atanmış olduğu için silinemez.
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(permission.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={permission._count.rolePermissions > 0}
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded p-2 mb-3">
                <Shield className="w-3 h-3" />
                <span>{permission._count.rolePermissions} rolde kullanılıyor</span>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-400">
                <div>Oluşturulma: {formatDate(permission.createdAt)}</div>
                <div>Güncelleme: {formatDate(permission.updatedAt)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Toplam {totalCount} izinden {((currentPage - 1) * 15) + 1}-{Math.min(currentPage * 15, totalCount)} arası gösteriliyor
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
