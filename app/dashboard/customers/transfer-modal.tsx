'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onTransfer: (consultantId: string) => void;
}

interface Consultant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customerCount: number;
  maxCustomers: number;
}

export default function TransferModal({ isOpen, onClose, customer, onTransfer }: TransferModalProps) {
  const { data: session } = useSession();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConsultants();
    }
  }, [isOpen]);

  const loadConsultants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/by-role?roleName=Satış Danışmanı');
      if (response.ok) {
        const data = await response.json();
        // Kendisini hariç tut
        const filteredConsultants = data.filter((c: Consultant) => c.id !== (session?.user as any)?.id);
        setConsultants(filteredConsultants);
      } else {
        throw new Error('Danışmanlar yüklenemedi');
      }
    } catch (error) {
      console.error('Error loading consultants:', error);
      toast.error('Danışmanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (consultantId: string) => {
    setTransferring(true);
    try {
      await onTransfer(consultantId);
      onClose();
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Müşteri Transfer Et</h3>
            <p className="text-sm text-gray-600 mt-1">
              {customer?.firstName} {customer?.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600">Danışmanlar yükleniyor...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Müşteriyi hangi danışmana transfer etmek istiyorsunuz?
              </p>
              
              {consultants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Transfer edilebilecek danışman bulunamadı</p>
                </div>
              ) : (
                consultants.map((consultant) => (
                  <div
                    key={consultant.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-sm">
                          {consultant.firstName?.[0]}{consultant.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {consultant.firstName} {consultant.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {consultant.customerCount}/{consultant.maxCustomers} müşteri
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTransfer(consultant.id)}
                      disabled={transferring}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {transferring ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Transfer Et
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
