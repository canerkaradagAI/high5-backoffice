
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Select component'i kaldırıldı, custom dropdown kullanılacak
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Settings,
  Database,
  ShoppingCart,
  BarChart3,
  Shield
} from 'lucide-react';
import { ParametersList } from './parameters-list';
import { AddParameterModal } from './add-parameter-modal';
import { EditParameterModal } from './edit-parameter-modal';
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

const PARAMETER_CATEGORIES = [
  { value: 'SYSTEM', label: 'Sistem', icon: Settings, color: 'text-blue-600 bg-blue-50' },
  { value: 'SALES', label: 'Satış', icon: ShoppingCart, color: 'text-green-600 bg-green-50' },
  { value: 'LIMITS', label: 'Limitler', icon: Shield, color: 'text-orange-600 bg-orange-50' },
  { value: 'REPORTS', label: 'Raporlar', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
  { value: 'DATABASE', label: 'Veritabanı', icon: Database, color: 'text-gray-600 bg-gray-50' }
];

const PARAMETER_TYPES = [
  { value: 'STRING', label: 'Metin' },
  { value: 'NUMBER', label: 'Sayı' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'JSON', label: 'JSON' }
];

export default function ParametersPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchParameters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        category: categoryFilter,
        type: typeFilter
      });

      const response = await fetch(`/api/parameters?${params}`);
      if (response.ok) {
        const data = await response.json();
        setParameters(data.parameters);
        setTotalPages(data.pagination.pages);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
      toast.error('Parametreler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, [currentPage, searchTerm, categoryFilter, typeFilter]);

  const handleParameterAdded = () => {
    fetchParameters();
    setIsAddModalOpen(false);
  };

  const handleParameterUpdated = () => {
    fetchParameters();
    setEditingParameter(null);
  };

  const handleParameterDeleted = () => {
    fetchParameters();
  };

  const getCategoryInfo = (category: string | null) => {
    return PARAMETER_CATEGORIES.find(c => c.value === category) || PARAMETER_CATEGORIES[0];
  };

  const getTypeLabel = (type: string) => {
    return PARAMETER_TYPES.find(t => t.value === type)?.label || type;
  };

  // Stats calculation
  const categoryStats = PARAMETER_CATEGORIES.map(category => ({
    ...category,
    count: parameters.filter(p => p.category === category.value).length
  }));

  const typeStats = PARAMETER_TYPES.map(type => ({
    ...type,
    count: parameters.filter(p => p.type === type.value).length
  }));

  if (loading && !parameters.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parametre Yönetimi</h1>
          <p className="text-gray-600 mt-1">Sistem parametrelerini yönetin ve yapılandırın</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Parametre
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Toplam Parametre</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalCount}</div>
            <p className="text-xs text-blue-600">Aktif parametreler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Kategoriye Göre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoryStats.slice(0, 3).map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3 h-3 text-gray-500" />
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{stat.count}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Türe Göre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {typeStats.map((stat) => (
              <div key={stat.value} className="flex items-center justify-between">
                <span className="text-xs">{stat.label}</span>
                <Badge variant="outline" className="text-xs">{stat.count}</Badge>
              </div>
            ))}
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
                placeholder="Parametre ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowTypeDropdown(false);
                }}
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categoryFilter === 'all' ? 'Tüm Kategoriler' : PARAMETER_CATEGORIES.find(c => c.value === categoryFilter)?.label || 'Kategori seçin'}
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2">▼</span>
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('all');
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100"
                  >
                    Tüm Kategoriler
                  </button>
                  {PARAMETER_CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(category.value);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowCategoryDropdown(false);
                }}
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {typeFilter === 'all' ? 'Tüm Türler' : PARAMETER_TYPES.find(t => t.value === typeFilter)?.label || 'Tür seçin'}
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2">▼</span>
              </button>
              
              {showTypeDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('all');
                      setShowTypeDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100"
                  >
                    Tüm Türler
                  </button>
                  {PARAMETER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setTypeFilter(type.value);
                        setShowTypeDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters List */}
      <ParametersList 
        parameters={parameters}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onEdit={setEditingParameter}
        onDelete={handleParameterDeleted}
        getCategoryInfo={getCategoryInfo}
        getTypeLabel={getTypeLabel}
      />

      {/* Modals */}
      <AddParameterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleParameterAdded}
        categories={PARAMETER_CATEGORIES}
        types={PARAMETER_TYPES}
      />

      <EditParameterModal
        parameter={editingParameter}
        isOpen={!!editingParameter}
        onClose={() => setEditingParameter(null)}
        onSuccess={handleParameterUpdated}
        categories={PARAMETER_CATEGORIES}
        types={PARAMETER_TYPES}
      />
    </div>
  );
}
