'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Package, DollarSign, Tag, Palette, Ruler, Search, Warehouse, ShoppingCart, ZoomIn, PackagePlus } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  brand: string;
  color: string;
  size: string;
  isActive: boolean;
}

export default function ProductDetailPage({ params }: { params: { barcode: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Rol kontrolü
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    const userRoles = session.user?.roles ?? [];
    const hasAccess = userRoles.some((role: any) => 
      role.name === 'Mağaza Müdürü' || role.name === 'Satış Danışmanı'
    );

    if (!hasAccess) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/search?sku=${params.barcode}`);
        
        if (!response.ok) {
          throw new Error('Ürün bulunamadı');
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ürün yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.barcode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ürün bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>

          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Ürün bulunamadı'}
            </AlertDescription>
          </Alert>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <p className="text-gray-600 text-center">
                Barkod: <strong>{params.barcode}</strong> ile eşleşen ürün bulunamadı.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center">
            {/* Başlık kaldırıldı */}
          </div>
          
          <div className="w-8 h-8">
            {/* Mor 3 yazısı kaldırıldı */}
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sol Taraf - Ürün Görseli ve Aksiyonlar */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          {/* Ürün Görseli */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative">
              <img
                src={`${product.imageUrl}?v=${Date.now()}&force=${Math.random()}`}
                alt={product.name}
                className="w-full max-w-md h-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.svg';
                }}
              />
              
              {/* Zoom İkonu */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/80 backdrop-blur-sm"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="p-6 space-y-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
              onClick={() => router.push(`/dashboard/product-search/${params.barcode}/stock`)}
            >
              <Warehouse className="w-4 h-4 mr-2" />
              Stok Sorgulama
            </Button>
            
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Satış Yap
            </Button>
            
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
              onClick={() => router.push(`/dashboard/tasks/new?productCode=${params.barcode}`)}
            >
              <PackagePlus className="w-4 h-4 mr-2" />
              Ürün İste
            </Button>
          </div>
        </div>

        {/* Sağ Taraf - Ürün Detayları */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Ürün Detayları</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Fiyat(Peşin Satış)</span>
                <span className="text-gray-900 font-semibold">{product.price.toFixed(2)} ₺</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Barkod</span>
                <span className="text-gray-900">{product.sku}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Ürün Kod</span>
                <span className="text-gray-900">{product.sku} {product.color}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Renk</span>
                <span className="text-gray-900">{product.color}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Beden</span>
                <span className="text-gray-900">{product.size}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Ürün Açıklama</span>
                <span className="text-gray-900">{product.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Menşei</span>
                <span className="text-gray-900">Türkiye</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Ek Özellik2</span>
                <span className="text-gray-900">{product.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Hiy.Seviye 1</span>
                <span className="text-gray-900">{product.brand}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Hiy.Seviye 2</span>
                <span className="text-gray-900">Footwear</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Hiy.Seviye 3</span>
                <span className="text-gray-900">Shoe</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Cinsiyet</span>
                <span className="text-gray-900">Men</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">İndirim</span>
                <span className="text-gray-900">%00</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700">Logo</span>
                <span className="text-gray-900">{product.brand}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
