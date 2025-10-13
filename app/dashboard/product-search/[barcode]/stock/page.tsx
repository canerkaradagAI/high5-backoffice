'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Package, Warehouse, ShoppingCart, ZoomIn } from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
}

interface StockVariant {
  color: string;
  size: string;
  quantity: number;
  warehouse: string;
}

export default function StockQueryPage({ params }: { params: { barcode: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [stockVariants, setStockVariants] = useState<StockVariant[]>([]);
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
    const fetchProductAndStock = async () => {
      try {
        setLoading(true);
        
        // Ürün bilgilerini getir
        const productResponse = await fetch(`/api/products/search?sku=${params.barcode}`);
        if (!productResponse.ok) {
          throw new Error('Ürün bulunamadı');
        }
        
        const productData = await productResponse.json();
        if (!productData) {
          throw new Error('Ürün bulunamadı');
        }
        
        setProduct(productData);
        
        // Bu ürünün tüm bedenlerinin stoklarını göster
        const mockStockVariants: StockVariant[] = [
          { color: productData.color, size: '7.5', quantity: 1, warehouse: 'HF01' },
          { color: productData.color, size: '8', quantity: 2, warehouse: 'HF01' },
          { color: productData.color, size: '8.5', quantity: 1, warehouse: 'HF01' },
          { color: productData.color, size: '9', quantity: 3, warehouse: 'HF01' },
          { color: productData.color, size: '9.5', quantity: 2, warehouse: 'HF01' },
          { color: productData.color, size: '10', quantity: 1, warehouse: 'HF01' },
          { color: productData.color, size: '10.5', quantity: 2, warehouse: 'HF01' },
          { color: productData.color, size: '11', quantity: 1, warehouse: 'HF01' },
          { color: productData.color, size: '11.5', quantity: 1, warehouse: 'HF01' },
        ];
        
        setStockVariants(mockStockVariants);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (params.barcode) {
      fetchProductAndStock();
    }
  }, [params.barcode]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Alert className="max-w-md">
            <AlertDescription>{error || 'Ürün bulunamadı'}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  const totalStock = stockVariants.reduce((sum, variant) => sum + variant.quantity, 0);

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
          
        </div>
      </div>

      {/* Barkod */}
      <div className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
        <div className="text-center">
          <p className="text-lg font-mono font-semibold text-gray-900">{product.sku}</p>
        </div>
      </div>

      {/* Ürün Özeti */}
      <div className="flex bg-white mx-4 mt-4 rounded-lg shadow-sm">
        {/* Sol Taraf - Ürün Görseli */}
        <div className="w-1/2 p-4 flex items-center justify-center">
          <div className="relative">
            <img
              src={`${product.imageUrl}?v=${Date.now()}&force=${Math.random()}`}
              alt={product.name}
              className="w-full max-w-xs h-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.svg';
              }}
            />
            
            {/* Zoom İkonu */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
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

        {/* Sağ Taraf - Ürün Bilgileri */}
        <div className="w-1/2 p-4 space-y-3">
          <div>
            <p className="text-sm text-gray-500">Ürün</p>
            <p className="text-lg font-semibold text-gray-900">{product.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Beden</p>
            <p className="text-lg font-semibold text-gray-900">{product.size}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Depo Stok</p>
            <p className="text-lg font-semibold text-gray-900">{totalStock}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Fiyat</p>
            <p className="text-lg font-semibold text-gray-900">{product.price.toFixed(2)} ₺</p>
          </div>
        </div>
      </div>

      {/* Tüm Varyantlar Ayırıcısı */}
      <div className="flex items-center mx-4 mt-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <div className="px-4">
          <span className="text-sm text-gray-500">- Tüm Varyantlar -</span>
        </div>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Stok Tablosu */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm overflow-hidden">
        {/* Tablo Başlığı */}
        <div className="bg-blue-600 text-white px-4 py-3">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium">
            <div>Renk</div>
            <div>Beden</div>
            <div>Adet</div>
            <div>Depo</div>
          </div>
        </div>
        
        {/* Tablo İçeriği */}
        <div className="overflow-visible">
          {stockVariants.map((variant, index) => (
            <div 
              key={index}
              className={`px-4 py-3 border-b border-gray-100 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-gray-900">{variant.color}</div>
                <div className="text-gray-900">{variant.size}</div>
                <div className="text-gray-900 font-medium">{variant.quantity}</div>
                <div className="text-gray-900">{variant.warehouse}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tüm Mağazaların Stokları Butonu kaldırıldı */}

      {/* Alt Navigasyon kaldırıldı */}
    </div>
  );
}
