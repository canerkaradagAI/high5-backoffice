
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
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Parameter {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryInfo {
  value: string;
  label: string;
  icon: any;
  color: string;
}

interface ParametersListProps {
  parameters: Parameter[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onEdit: (parameter: Parameter) => void;
  onDelete: () => void;
  getCategoryInfo: (category: string | null) => CategoryInfo;
  getTypeLabel: (type: string) => string;
}

export function ParametersList({ 
  parameters, 
  loading, 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange, 
  onEdit, 
  onDelete,
  getCategoryInfo,
  getTypeLabel
}: ParametersListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showValues, setShowValues] = useState<{[key: string]: boolean}>({});

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/parameters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Parametre başarıyla silindi');
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

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('Değer kopyalandı');
  };

  const toggleValueVisibility = (id: string) => {
    setShowValues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: tr });
    } catch {
      return '-';
    }
  };

  const formatValue = (parameter: Parameter) => {
    const { value, type } = parameter;
    
    if (!showValues[parameter.id] && value.length > 50) {
      return value.substring(0, 50) + '...';
    }

    switch (type) {
      case 'BOOLEAN':
        return value === 'true' ? 'Evet' : 'Hayır';
      case 'JSON':
        try {
          return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
          return value;
        }
      default:
        return value;
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

  if (!parameters.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">⚙️</div>
            <p>Herhangi bir parametre bulunamadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Parametreler ({totalCount})</span>
          <Badge variant="outline" className="text-sm">
            Sayfa {currentPage} / {totalPages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {parameters.map((parameter) => {
            const categoryInfo = getCategoryInfo(parameter.category);
            const Icon = categoryInfo.icon;
            const isValueLong = parameter.value.length > 50;
            
            return (
              <div key={parameter.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {parameter.key}
                      </h3>
                      <Badge className={`text-xs ${categoryInfo.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {categoryInfo.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(parameter.type)}
                      </Badge>
                    </div>
                    
                    {parameter.description && (
                      <p className="text-sm text-gray-600 mb-2">{parameter.description}</p>
                    )}
                    
                    {/* Value Display */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Değer:</div>
                          <pre className={`text-sm text-gray-800 whitespace-pre-wrap break-words ${parameter.type === 'JSON' ? 'font-mono' : ''}`}>
                            {formatValue(parameter)}
                          </pre>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {isValueLong && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleValueVisibility(parameter.id)}
                              className="h-6 w-6 p-0"
                            >
                              {showValues[parameter.id] ? 
                                <EyeOff className="w-3 h-3" /> : 
                                <Eye className="w-3 h-3" />
                              }
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyValue(parameter.value)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div>Oluşturulma: {formatDate(parameter.createdAt)}</div>
                      <div>Güncelleme: {formatDate(parameter.updatedAt)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(parameter)}
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
                          disabled={deletingId === parameter.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Parametreyi Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{parameter.key}" parametresini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(parameter.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Toplam {totalCount} parametreden {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalCount)} arası gösteriliyor
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
