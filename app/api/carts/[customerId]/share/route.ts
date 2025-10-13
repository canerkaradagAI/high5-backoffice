import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = params;
    const body = await request.json();
    const { customerName, totalAmount, cartItemsCount } = body;

    // Müşteriyi kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        id: true, 
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        assignedConsultantId: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Sadece kendi müşterisi için işlem yapabilir
    if (customer.assignedConsultantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu müşteri size atanmamış' }, 
        { status: 403 }
      );
    }

    // Açık sepeti al
    const cart = await prisma.cart.findFirst({
      where: {
        customerId: customerId,
        status: 'OPEN'
      },
      include: {
        items: {
          select: {
            id: true,
            sku: true,
            title: true,
            description: true,
            imageUrl: true,
            quantity: true,
            unitPrice: true
          }
        }
      }
    });

    if (!cart) {
      return NextResponse.json({ error: 'Açık sepet bulunamadı' }, { status: 404 });
    }

    // Sepet verilerini formatla
    const cartData = {
      customer: {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        email: customer.email
      },
      cart: {
        id: cart.id,
        totalAmount: cart.totalAmount,
        itemCount: cart.items.length,
        items: cart.items.map(item => ({
          sku: item.sku,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      },
      consultant: {
        id: session.user.id,
        name: `${(session.user as any).firstName} ${(session.user as any).lastName}`,
        email: session.user.email
      },
      timestamp: new Date().toISOString(),
      shareId: `SHARE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Burada harici uygulamaya gönderme işlemi yapılacak
    // Örnek: WhatsApp Business API, Telegram Bot, Email, SMS, vs.
    
    console.log('🛒 Sepet paylaşım isteği alındı:');
    console.log(`   Müşteri: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Toplam Tutar: ₺${cart.totalAmount.toLocaleString('tr-TR')}`);
    console.log(`   Ürün Sayısı: ${cart.items.length}`);
    console.log(`   Share ID: ${cartData.shareId}`);
    console.log(`   Danışman: ${(session.user as any).firstName} ${(session.user as any).lastName}`);

    // Simüle edilmiş harici API çağrısı
    const externalAppResponse = await simulateExternalAppCall(cartData);

    return NextResponse.json({
      success: true,
      message: 'Sepet başarıyla başka bir uygulamaya gönderildi!',
      shareId: cartData.shareId,
      externalAppResponse,
      cartSummary: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        totalAmount: cart.totalAmount,
        itemCount: cart.items.length
      }
    });

  } catch (error) {
    console.error('Error sharing cart:', error);
    return NextResponse.json(
      { error: 'Sepet gönderilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Harici uygulama çağrısını simüle eden fonksiyon
async function simulateExternalAppCall(cartData: any) {
  // Bu fonksiyon gerçek uygulamada şunları yapabilir:
  // 1. WhatsApp Business API'ye mesaj gönderme
  // 2. Telegram Bot API'ye mesaj gönderme
  // 3. Email servisine mail gönderme
  // 4. SMS servisine mesaj gönderme
  // 5. Webhook URL'ine POST request gönderme
  
  const delay = Math.random() * 1000 + 500; // 500-1500ms arası rastgele gecikme
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simüle edilmiş başarılı yanıt
  return {
    status: 'success',
    externalAppId: `EXT_${Date.now()}`,
    message: 'Sepet verileri harici uygulamaya başarıyla iletildi',
    timestamp: new Date().toISOString(),
    // Gerçek uygulamada burada harici uygulamanın yanıtı olacak
    response: {
      platform: 'simulated_external_app',
      received: true,
      processed: true
    }
  };
}
