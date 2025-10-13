'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  CreditCard,
  Barcode,
  Star,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getKVKKCompliantData } from '@/lib/kvkk-utils';
import SaleActionModal from '../../../components/sale-action-modal';

interface CartItem {
  id: string;
  sku?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

interface Cart {
  id: string;
  customerId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Recommendation {
  id: string;
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const customerId = params.customerId as string;
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchCart();
      fetchCustomer();
    }
  }, [customerId]);

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      fetchRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [cart]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/carts/${customerId}`);
      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      } else if (response.status === 404) {
        // Sepet yok - bu normal, ürün eklendiğinde oluşturulacak
        setCart(null);
      } else {
        toast.error('Sepet yüklenirken hata oluştu');
        router.push('/dashboard/customers');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Sepet yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const fetchRecommendations = async () => {
    if (!cart || cart.items.length === 0) return;
    
    setLoadingRecommendations(true);
    try {
      const cartItemIds = cart.items.map(item => item.id).join(',');
      const response = await fetch(`/api/products/recommendations?cartItemIds=${cartItemIds}&limit=6`);
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleAddProduct = async () => {
    if (!barcodeInput.trim()) {
      toast.error('Barkod giriniz');
      return;
    }

    setIsAddingProduct(true);
    try {
      // Gerçek ürün API'sini kullan
      console.log('🔍 Barkod aranıyor:', barcodeInput.trim());
      const productResponse = await fetch(`/api/products/search?sku=${barcodeInput.trim()}`);
      
      console.log('📡 API Response:', productResponse.status, productResponse.ok);
      
      if (!productResponse.ok) {
        toast.error('Ürün bulunamadı');
        return;
      }

      const product = await productResponse.json();
      console.log('📦 Bulunan ürün:', product);
      
      if (product) {
        // Ürün bulundu, sepete ekle
        const response = await fetch(`/api/carts/${customerId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku: product.sku,
            title: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            quantity: 1,
            unitPrice: product.price
          }),
        });

        if (response.ok) {
          toast.success(`${product.name} sepete eklendi`);
          setBarcodeInput('');
          setShowBarcodeInput(false);
          fetchCart();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Ürün eklenemedi');
        }
      } else {
        // Ürün bulunamadı, manuel ekle
        const response = await fetch(`/api/carts/${customerId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku: barcodeInput.trim(),
            title: `Ürün ${barcodeInput.trim()}`,
            description: 'Manuel eklenen ürün',
            imageUrl: null,
            quantity: 1,
            unitPrice: 100.00 // Varsayılan fiyat
          }),
        });

        if (response.ok) {
          toast.success('Ürün sepete eklendi');
          setBarcodeInput('');
          setShowBarcodeInput(false);
          fetchCart();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Ürün eklenemedi');
        }
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Ürün eklenirken hata oluştu');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch(`/api/carts/${customerId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setCart(prev => prev ? {
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId ? updatedItem : item
          ),
          totalAmount: prev.items.reduce((total, item) => 
            total + (item.id === itemId ? updatedItem.quantity * updatedItem.unitPrice : item.quantity * item.unitPrice)
          , 0)
        } : null);
        toast.success('Miktar güncellendi');
      } else {
        toast.error('Miktar güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Miktar güncellenirken hata oluştu');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Bu ürünü sepetten çıkarmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/carts/${customerId}/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCart(prev => prev ? {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId),
          totalAmount: prev.items
            .filter(item => item.id !== itemId)
            .reduce((total, item) => total + (item.quantity * item.unitPrice), 0)
        } : null);
        toast.success('Ürün sepetten çıkarıldı');
      } else {
        toast.error('Ürün çıkarılamadı');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Ürün çıkarılırken hata oluştu');
    }
  };

  const handleAddRecommendation = async (recommendation: Recommendation) => {
    try {
      const response = await fetch(`/api/carts/${customerId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: recommendation.sku,
          title: recommendation.name,
          description: recommendation.description,
          imageUrl: recommendation.imageUrl,
          quantity: 1,
          unitPrice: recommendation.price
        }),
      });

      if (response.ok) {
        toast.success(`${recommendation.name} sepete eklendi`);
        fetchCart(); // Sepeti yenile
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ürün eklenemedi');
      }
    } catch (error) {
      console.error('Error adding recommendation:', error);
      toast.error('Ürün eklenirken hata oluştu');
    }
  };

  const handleCheckout = () => {
    setShowSaleModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sepet yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard/customers')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Geri
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {customer ? `${customer.firstName} ${customer.lastName}` : 'Müşteri'} - Sepet
                  </h1>
                  <p className="text-sm text-gray-500">
                    {customer ? getKVKKCompliantData(
                      { phone: customer.phone },
                      (session?.user as any)?.role
                    ).phone : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sol Taraf - Ürün Ekleme */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Ürün Ekle
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barkod Okut
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                        placeholder="Barkod numarasını girin"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleAddProduct}
                        disabled={isAddingProduct || !barcodeInput.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Barcode className="h-4 w-4" />
                        {isAddingProduct ? 'Ekleniyor...' : 'Ekle'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>• Barkod okuyucu ile ürün okutun</p>
                    <p>• Manuel olarak barkod numarası girin</p>
                    <p>• Enter tuşu ile hızlı ekleme yapın</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Taraf - Boş Sepet */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sepet İçeriği (0 ürün)
                  </h2>
                </div>
                
                <div className="p-8 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Sepet boş</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Ürün eklemek için sol taraftaki barkod formunu kullanın
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Nasıl ürün eklenir?</strong><br/>
                      • Barkod okuyucu ile ürün okutun<br/>
                      • Manuel olarak barkod numarası girin<br/>
                      • Enter tuşu ile hızlı ekleme yapın
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/customers')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Geri
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {customer ? `${customer.firstName} ${customer.lastName}` : 'Müşteri'} - Sepet
                </h1>
                <p className="text-sm text-gray-500">
                  {customer ? getKVKKCompliantData(
                    { phone: customer.phone },
                    (session?.user as any)?.role
                  ).phone : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Toplam Tutar</p>
                <p className="text-2xl font-bold text-green-600">
                  ₺{cart.totalAmount.toLocaleString('tr-TR')}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CreditCard className="h-5 w-5" />
                Satış Yap
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Taraf - Ürün Ekleme */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ürün Ekle
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barkod Okut
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                      placeholder="Barkod numarasını girin"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleAddProduct}
                      disabled={isAddingProduct || !barcodeInput.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Barcode className="h-4 w-4" />
                      {isAddingProduct ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>• Barkod okuyucu ile ürün okutun</p>
                  <p>• Manuel olarak barkod numarası girin</p>
                  <p>• Enter tuşu ile hızlı ekleme yapın</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Sepet İçeriği */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sepet İçeriği ({cart.items.length} ürün)
                </h2>
              </div>
              
              {cart.items.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Sepet boş</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Ürün eklemek için sol taraftaki barkod formunu kullanın
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Nasıl ürün eklenir?</strong><br/>
                      • Barkod okuyucu ile ürün okutun<br/>
                      • Manuel olarak barkod numarası girin<br/>
                      • Enter tuşu ile hızlı ekleme yapın
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.items.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Ürün Görseli */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img 
                                src={`${item.imageUrl}?v=${Date.now()}&cache=${Math.random()}&force=${Math.random()}`} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-product.svg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {item.title}
                            </h3>
                            {item.sku && (
                              <p className="text-sm text-gray-500">
                                SKU: {item.sku}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.description}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              ₺{item.unitPrice.toLocaleString('tr-TR')} / adet
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1 rounded-full hover:bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-full hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₺{(item.quantity * item.unitPrice).toLocaleString('tr-TR')}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Öneriler Bölümü */}
        {cart && cart.items.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Size Önerilen Ürünler
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Sepetinizdeki ürünlere benzer öneriler
                </p>
              </div>
              
              {loadingRecommendations ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Öneriler yükleniyor...</p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="p-6">
                  {/* Horizontal Scroll Container */}
                  <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 #F1F5F9' }}>
                    {recommendations.map((recommendation) => (
                      <div
                        key={recommendation.id}
                        className="flex-shrink-0 w-48 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => handleAddRecommendation(recommendation)}
                      >
                        {/* Ürün Görseli - Küçük */}
                        <div className="w-full h-20 bg-gray-100 rounded-lg overflow-hidden mb-2">
                          {recommendation.imageUrl ? (
                            <img 
                              src={`${recommendation.imageUrl}?v=${Date.now()}&cache=${Math.random()}&force=${Math.random()}`} 
                              alt={recommendation.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.svg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ShoppingCart className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Ürün Bilgileri */}
                        <div className="space-y-1">
                          <h3 className="font-medium text-gray-900 text-xs line-clamp-2 group-hover:text-blue-600">
                            {recommendation.name}
                          </h3>
                          
                          {recommendation.brand && (
                            <div className="flex items-center gap-1">
                              {recommendation.brand === 'Skechers' ? (
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                  SKECHERS
                                </span>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  {recommendation.brand}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-green-600 text-sm">
                              ₺{recommendation.price.toLocaleString('tr-TR')}
                            </p>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>İpucu:</strong> Önerilen ürünlere tıklayarak sepete ekleyebilirsiniz • Sağa-sola kaydırarak daha fazla ürün görün
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Henüz öneri yok</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sepetinize daha fazla ürün ekleyerek önerileri görün
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Satış İşlemi Popup */}
      {cart && (
        <SaleActionModal
          isOpen={showSaleModal}
          onClose={() => setShowSaleModal(false)}
          customerId={customerId}
          customerName={customer ? `${customer.firstName} ${customer.lastName}` : undefined}
          totalAmount={cart.totalAmount}
          cartItemsCount={cart.items.length}
        />
      )}
    </div>
  );
}
