# High5 BackOffice

Modern bir back office yönetim sistemi. Next.js, Prisma ve PostgreSQL ile geliştirilmiştir.

## 🚀 Özellikler

- **Kullanıcı Yönetimi**: Rol tabanlı erişim kontrolü
- **Ürün Yönetimi**: 6,900+ ürün ile kapsamlı katalog
- **Görev Yönetimi**: Atama ve takip sistemi
- **Müşteri Yönetimi**: Detaylı müşteri bilgileri
- **Satış Yönetimi**: Sepet ve ödeme işlemleri
- **Dashboard**: Kapsamlı analitik ve raporlama

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS, shadcn/ui
- **Deployment**: Vercel

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL database
- npm veya yarn

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/canerkaradagAI/high5-backoffice.git
cd high5-backoffice
```

2. **Dependencies'leri yükleyin**
```bash
npm install
```

3. **Environment variables'ları ayarlayın**
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Database'i hazırlayın**
```bash
npx prisma generate
npx prisma migrate deploy
```

5. **Development server'ı başlatın**
```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 🗄️ Database Schema

### Ana Tablolar
- **User**: Kullanıcı bilgileri ve rolleri
- **Product**: Ürün kataloğu (6,900+ ürün)
- **Customer**: Müşteri bilgileri
- **Task**: Görev yönetimi
- **Cart/CartItem**: Sepet işlemleri
- **Sale/Payment**: Satış ve ödeme kayıtları

### İlişkiler
- Kullanıcılar rollere sahip
- Görevler kullanıcılara atanır
- Sepetler müşterilere bağlı
- Satışlar sepetlerden oluşur

## 🚀 Deployment

### Vercel Deployment

1. **Vercel'e bağlayın**
```bash
npx vercel
```

2. **Environment variables'ları ayarlayın**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Güvenli secret key
- `NEXTAUTH_URL`: Production URL

3. **Database'i bağlayın**
- Vercel Storage → PostgreSQL
- Connection string'i kopyalayın
- Environment variables'a ekleyin

### Build Kontrolü
```bash
npm run build
```

## 📊 Veri İstatistikleri

- **Toplam Kayıt**: 6,980
- **Ürünler**: 6,904 adet
- **Kullanıcılar**: 5 adet
- **Müşteriler**: 8 adet
- **Görevler**: 3 adet

## 🔧 Scripts

- `npm run dev`: Development server
- `npm run build`: Production build
- `npm run start`: Production server
- `npm run setup`: İlk kurulum
- `npm run dev:ready`: Kurulum + development

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signin`
- `POST /api/auth/signout`

### Products
- `GET /api/products` - Ürün listesi
- `GET /api/products/search` - Ürün arama
- `GET /api/products/recommendations` - Öneriler

### Tasks
- `GET /api/tasks` - Görev listesi
- `POST /api/tasks` - Yeni görev
- `PUT /api/tasks/[id]` - Görev güncelleme

### Customers
- `GET /api/customers` - Müşteri listesi
- `GET /api/customers/search` - Müşteri arama

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Caner Karadağ**
- GitHub: [@canerkaradagAI](https://github.com/canerkaradagAI)
- LinkedIn: [Caner Karadağ](https://linkedin.com/in/canerkaradag)

## 🆘 Destek

Herhangi bir sorun yaşarsanız:
1. Issues bölümünden bildirin
2. Detaylı açıklama yapın
3. Hata mesajlarını paylaşın

---

**Not**: Bu proje production-ready durumda ve Vercel'de deploy edilmiştir.