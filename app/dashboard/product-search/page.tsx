'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, ArrowLeft } from 'lucide-react';

export default function ProductSearchPage() {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
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

  if (status === 'loading') {
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

  const handleSearch = async () => {
    if (!barcode.trim()) {
      setError('Lütfen bir barkod girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ürün detay sayfasına yönlendir
      router.push(`/dashboard/product-search/${barcode}`);
    } catch (err) {
      setError('Ürün aranırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Ürün Sorgulama</h1>
          <p className="text-gray-600 mt-2">
            Barkod okutarak ürün bilgilerini sorgulayabilirsiniz
          </p>
        </div>

        {/* Barkod Okutma Kartı */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Barkod Okut
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Barkod
                </label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    type="text"
                    placeholder="Barkodu buraya girin veya okutun..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-lg flex-1"
                    autoFocus
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !barcode.trim()}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Örnek Barkodlar */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Örnek Barkodlar:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• 8683030770925 - GO WALK FLEX RAY</div>
                <div>• 198739626223 - GO WALK 8 PATE</div>
                <div>• 198739931709 - EQUALIZER 5.0 TRAIL</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kullanım Talimatları */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Nasıl Kullanılır?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Ürünün barkodunu yukarıdaki alana girin</li>
              <li>"Ürün Ara" butonuna tıklayın veya Enter tuşuna basın</li>
              <li>Ürün bilgileri ve görseli görüntülenecektir</li>
              <li>Barkod okutucu cihazınız varsa direkt okutabilirsiniz</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
