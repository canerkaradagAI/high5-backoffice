'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone,
  Banknote,
  CheckCircle,
  XCircle,
  Receipt,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getKVKKCompliantData } from '@/lib/kvkk-utils';

interface CartItem {
  id: string;
  sku?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
}

interface Cart {
  id: string;
  customerId: string;
  status: string;
  totalAmount: number;
  items: CartItem[];
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const customerId = params.customerId as string;
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'NFC',
      name: 'NFC Ödeme',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'Telefon ile yakın ödeme',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'CREDIT_CARD',
      name: 'Kredi Kartı',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Kredi kartı ile ödeme',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Havale/EFT',
      icon: <Banknote className="h-6 w-6" />,
      description: 'Banka havalesi ile ödeme',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'CASH',
      name: 'Nakit',
      icon: <Banknote className="h-6 w-6" />,
      description: 'Nakit para ile ödeme',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  useEffect(() => {
    if (customerId) {
      fetchCart();
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/carts/${customerId}`);
      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      } else {
        toast.error('Sepet bulunamadı');
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

  const handlePayment = async () => {
    if (!selectedMethod || !cart) return;

    setProcessingPayment(true);
    try {
      // Önce reyon fişi oluştur
      const receiptResponse = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          receiptNumber: generateReceiptNumber(),
          totalAmount: cart.totalAmount,
          cartItemsCount: cart.items.length,
          type: 'PAYMENT_RECEIPT'
        }),
      });

      if (!receiptResponse.ok) {
        throw new Error('Fiş oluşturulamadı');
      }

      const receipt = await receiptResponse.json();

      // Ödeme işlemi
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: receipt.id,
          amount: cart.totalAmount,
          method: selectedMethod,
          reference: generatePaymentReference()
        }),
      });

      if (paymentResponse.ok) {
        toast.success('Ödeme başarıyla alındı!');
        router.push(`/dashboard/receipts/${receipt.receiptNumber}`);
      } else {
        throw new Error('Ödeme alınamadı');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Ödeme işlemi başarısız');
    } finally {
      setProcessingPayment(false);
    }
  };

  const generateReceiptNumber = (): string => {
    const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `OL${randomNumber}`;
  };

  const generatePaymentReference = (): string => {
    const randomNumber = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `PAY${randomNumber}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ödeme sayfası yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sepet Boş</h2>
            <p className="text-gray-600 mb-4">Ödeme yapmak için sepete ürün ekleyin</p>
            <button
              onClick={() => router.push(`/dashboard/cart/${customerId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sepete Git
            </button>
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
                onClick={() => router.push(`/dashboard/cart/${customerId}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Geri
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {customer ? `${customer.firstName} ${customer.lastName}` : 'Müşteri'} - Ödeme
                </h1>
                <p className="text-sm text-gray-500">
                  {customer ? getKVKKCompliantData(
                    { phone: customer.phone },
                    (session?.user as any)?.role
                  ).phone : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Toplam Tutar</p>
              <p className="text-2xl font-bold text-green-600">
                ₺{cart.totalAmount.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol Taraf - Ödeme Yöntemleri */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ödeme Yöntemi Seçin
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg text-white ${method.color}`}>
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ödeme Butonu */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <button
                onClick={handlePayment}
                disabled={!selectedMethod || processingPayment}
                className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Ödeme İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="h-5 w-5" />
                    <span>Ödeme Al</span>
                  </>
                )}
              </button>
              
              {selectedMethod && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {paymentMethods.find(m => m.id === selectedMethod)?.name} ile ödeme alınacak
                </p>
              )}
            </div>
          </div>

          {/* Sağ Taraf - Sepet Özeti */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Sepet Özeti ({cart.items.length} ürün)
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {/* Ürün Görseli */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.quantity} adet × ₺{item.unitPrice.toLocaleString('tr-TR')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₺{(item.quantity * item.unitPrice).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Toplam:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₺{cart.totalAmount.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
