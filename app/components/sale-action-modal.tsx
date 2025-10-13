'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Receipt, CreditCard, ShoppingBag, Share2, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SaleActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  cartItemsCount: number;
}

export default function SaleActionModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  totalAmount,
  cartItemsCount
}: SaleActionModalProps) {
  const router = useRouter();
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);
  const [isSharingCart, setIsSharingCart] = useState(false);
  const [cartData, setCartData] = useState<{totalAmount: number, itemsCount: number} | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [createdReceipt, setCreatedReceipt] = useState<{number: string, type: string} | null>(null);

  // Sepet verilerini al
  useEffect(() => {
    if (isOpen && customerId) {
      fetchCartData();
    }
  }, [isOpen, customerId]);

  const fetchCartData = async () => {
    try {
      const response = await fetch(`/api/carts/${customerId}`);
      if (response.ok) {
        const cart = await response.json();
        setCartData({
          totalAmount: cart.totalAmount,
          itemsCount: cart.items.length
        });
      } else {
        setCartData({ totalAmount: 0, itemsCount: 0 });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartData({ totalAmount: 0, itemsCount: 0 });
    }
  };

  const handleCreateReceipt = useCallback(async () => {
    setIsCreatingReceipt(true);
    try {
      // Fiş numarasını oluştur
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      const newReceiptNumber = `OL${randomNum}`;
      
      // Reyondan fiş oluşturma API'si
      const requestData = {
        customerId,
        receiptNumber: newReceiptNumber,
        totalAmount: cartData?.totalAmount || totalAmount,
        cartItemsCount: cartData?.itemsCount || cartItemsCount,
        type: 'REYON_RECEIPT'
      };
      
      console.log('🛒 Receipt request data:', requestData);
      
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success(`Reyon fişi oluşturuldu: ${newReceiptNumber}`);
        setCreatedReceipt({ number: newReceiptNumber, type: 'REYON_RECEIPT' });
        // Modal kapanmasın, fiş bilgisi gösterilsin
        // onClose();
      } else {
        const errorData = await response.json();
        console.error('Receipt creation error:', errorData);
        throw new Error(errorData.error || 'Fiş oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast.error('Reyon fişi oluşturulamadı');
    } finally {
      setIsCreatingReceipt(false);
    }
  }, [customerId, receiptNumber, cartData, totalAmount, cartItemsCount, onClose, router]);

  const handlePayment = () => {
    onClose();
    router.push(`/dashboard/payment/${customerId}`);
  };

  const handleCreateBarcodeReceipt = useCallback(async () => {
    setIsCreatingReceipt(true);
    try {
      // Fiş numarasını oluştur
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      const newReceiptNumber = `OL${randomNum}`;
      
      // Barkodlu fiş oluşturma API'si
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          receiptNumber: newReceiptNumber,
          totalAmount: cartData?.totalAmount || totalAmount,
          cartItemsCount: cartData?.itemsCount || cartItemsCount,
          type: 'BARCODE_RECEIPT'
        }),
      });

      if (response.ok) {
        toast.success(`Barkodlu fiş oluşturuldu: ${newReceiptNumber}`);
        setCreatedReceipt({ number: newReceiptNumber, type: 'BARCODE_RECEIPT' });
        // Modal kapanmasın, fiş bilgisi gösterilsin
        // onClose();
      } else {
        throw new Error('Barkodlu fiş oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating barcode receipt:', error);
      toast.error('Barkodlu fiş oluşturulamadı');
    } finally {
      setIsCreatingReceipt(false);
    }
  }, [customerId, receiptNumber, cartData, totalAmount, cartItemsCount, onClose, router]);

  const handleShareCart = async () => {
    setIsSharingCart(true);
    try {
      const response = await fetch(`/api/carts/${customerId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          totalAmount: cartData?.totalAmount || totalAmount,
          cartItemsCount: cartData?.itemsCount || cartItemsCount,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Sepet başarıyla başka bir uygulamaya gönderildi!');
        console.log('🛒 Sepet paylaşım sonucu:', result);
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Sepet gönderilemedi');
      }
    } catch (error) {
      console.error('Error sharing cart:', error);
      toast.error('Sepet gönderilirken bir hata oluştu');
    } finally {
      setIsSharingCart(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Satış İşlemi</h2>
            <p className="text-sm text-gray-500 mt-1">
              {customerName ? `${customerName} için` : 'Müşteri için'} satış işlemi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sepet İçeriği</p>
                <p className="font-medium text-gray-900">{cartData?.itemsCount || cartItemsCount} ürün</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Toplam Tutar</p>
                <p className="text-xl font-bold text-green-600">
                  ₺{(cartData?.totalAmount || totalAmount).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Reyon Fişi Oluştur */}
            <button
              onClick={handleCreateReceipt}
              disabled={isCreatingReceipt}
              className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              <Receipt className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Reyon Fişi Oluştur</div>
                <div className="text-sm opacity-90">
                  {isCreatingReceipt ? 'Fiş oluşturuluyor...' : 'OL ile başlayan fiş numarası'}
                </div>
              </div>
            </button>

            {/* Ödeme Al */}
            <button
              onClick={handlePayment}
              className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Ödeme Al</div>
                <div className="text-sm opacity-90">
                  NFC, Kredi Kartı, Havale ile ödeme
                </div>
              </div>
            </button>

            {/* App'e Gönder */}
            <button
              onClick={handleShareCart}
              disabled={isSharingCart}
              className="w-full flex items-center justify-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">App'e Gönder</div>
                <div className="text-sm opacity-90">
                  {isSharingCart ? 'Gönderiliyor...' : 'Sepeti başka uygulamaya paylaş'}
                </div>
              </div>
            </button>

            {/* Fiş Oluşturulmuşsa - Fiş Bilgisi ve Barkod */}
            {createdReceipt && (
              <div className="space-y-3">
                {/* Fiş Bilgisi ve Barkod */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      {createdReceipt.type === 'REYON_RECEIPT' ? 'Reyon Fişi' : 'Barkodlu Fiş'}
                    </span>
                  </div>
                  
                  {/* Fiş Numarası */}
                  <div className="text-lg font-bold text-green-700 mb-3">
                    {createdReceipt.number}
                  </div>
                  
                  {/* Barkod */}
                  <div className="bg-white p-3 rounded border-2 border-green-300">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">BARKOD</div>
                      <div className="font-mono text-sm font-bold text-black tracking-wider">
                        {createdReceipt.number}
                      </div>
                      {/* Basit barkod görseli */}
                      <div className="mt-2 flex justify-center">
                        <div className="flex gap-1">
                          {Array.from({ length: 20 }, (_, i) => (
                            <div
                              key={i}
                              className={`h-8 w-1 ${
                                Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-green-600 mt-2 text-center">
                    {createdReceipt.type === 'REYON_RECEIPT' ? 'Mağaza içi satış fişi' : 'Barkodlu satış fişi'}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Info */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">İpucu:</p>
                <p>• Reyon fişi: Fiş numarası ve barkod oluşturur</p>
                <p>• Ödeme al: Müşteriden ödeme toplama için</p>
                <p>• App'e Gönder: Sepeti harici uygulamalarla entegre etmek için</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
