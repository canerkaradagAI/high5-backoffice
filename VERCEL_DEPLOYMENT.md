# 🚀 Vercel Deployment Rehberi

## Adım 1: Vercel'de Proje Oluşturma

### GitHub Repository'yi Bağlama:
1. **Vercel Dashboard'a gidin**: https://vercel.com/dashboard
2. **"Add New..." → "Project"** tıklayın
3. **GitHub repository'nizi seçin**: `canerkaradagAI/high5-backoffice`
4. **Import** butonuna tıklayın

### Proje Ayarları:
- **Framework Preset**: Next.js (otomatik algılanacak)
- **Root Directory**: `./` (root'ta)
- **Build Command**: `npx prisma generate && npm run build` (otomatik)
- **Output Directory**: `.next` (otomatik)
- **Install Command**: `npm install` (otomatik)

---

## Adım 2: Environment Variables Ayarlama

### Vercel Dashboard → Settings → Environment Variables

Aşağıdaki environment variable'ları **Production, Preview ve Development** için ekleyin:

### 1. DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://username:password@host:port/database?schema=public
```
**Not**: Vercel Storage'da oluşturduğunuz PostgreSQL database'in connection string'ini kullanın.

### 2. NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: [Güçlü bir secret key - en az 32 karakter]
```
**Oluşturma**: Terminal'de çalıştırın:
```bash
openssl rand -base64 32
```
veya online: https://generate-secret.vercel.app/32

### 3. NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://your-app-name.vercel.app
```
**Not**: Deploy sonrası otomatik URL'i buraya yapıştırın.

---

## Adım 3: Build Ayarlarını Kontrol Etme

Vercel otomatik olarak Next.js projelerini algılar. Ama manuel kontrol için:

**Settings → General → Build & Development Settings**:
- **Build Command**: `npx prisma generate && npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

## Adım 4: İlk Deploy

1. **"Deploy"** butonuna tıklayın
2. Deploy işlemi tamamlanana kadar bekleyin (2-5 dakika)
3. Deploy tamamlandıktan sonra **URL'i kopyalayın**

---

## Adım 5: Database Migration'ları Çalıştırma

Deploy sonrası database'i hazırlamak için:

### Seçenek 1: Vercel CLI ile (Önerilen)
```bash
# Vercel CLI kurulumu
npm i -g vercel

# Vercel'e login
vercel login

# Proje dizinine git
cd c:\Users\caner.karadag\Cursor_Projeler\BackOffice_high5\app

# Production environment variables'ı yükle
vercel env pull .env.production

# Migration'ları çalıştır
npx prisma migrate deploy
```

### Seçenek 2: Vercel Postgres Studio ile
1. Vercel Dashboard → Storage → PostgreSQL database'inizi seçin
2. **"Query"** veya **"Studio"** sekmesine gidin
3. Prisma migration SQL'lerini manuel çalıştırın

### Seçenek 3: Seed Script ile
```bash
# Environment variables'ı production'a göre ayarlayın
export DATABASE_URL="production-connection-string"

# Seed script'i çalıştır
npm run seed
```

---

## Adım 6: Seed Data Eklemek (Opsiyonel)

Production database'ine seed data eklemek için:

```bash
# Production DATABASE_URL'i set edin
export DATABASE_URL="production-connection-string"

# Seed script'i çalıştır
npx tsx --require dotenv/config scripts/seed.ts
```

**Not**: Production'a seed data eklemek istemiyorsanız, sadece migration'ları çalıştırmanız yeterlidir.

---

## Adım 7: NEXTAUTH_URL'i Güncelleme

Deploy sonrası gerçek URL'i aldıktan sonra:

1. **Vercel Dashboard → Settings → Environment Variables**
2. **NEXTAUTH_URL** değerini güncelleyin: `https://your-app-name.vercel.app`
3. **"Redeploy"** butonuna tıklayın (varsa)

---

## 🔧 Troubleshooting

### Build Hatası:
- **Prisma Client not generated**: Build command'da `prisma generate` olduğundan emin olun
- **Module not found**: Import path'lerini kontrol edin (@/lib/auth gibi)

### Database Connection Hatası:
- Connection string'i kontrol edin
- PostgreSQL database'in aktif olduğundan emin olun
- Network access ayarlarını kontrol edin

### NextAuth Hatası:
- NEXTAUTH_SECRET'in set olduğundan emin olun
- NEXTAUTH_URL'in production URL'i ile eşleştiğinden emin olun
- Browser cookie'lerini temizleyin

---

## 📋 Checklist

- [ ] GitHub repository Vercel'e bağlandı
- [ ] DATABASE_URL environment variable eklendi
- [ ] NEXTAUTH_SECRET environment variable eklendi
- [ ] NEXTAUTH_URL environment variable eklendi (deploy sonrası güncellendi)
- [ ] İlk deploy tamamlandı
- [ ] Database migration'ları çalıştırıldı
- [ ] Seed data eklendi (opsiyonel)
- [ ] Production URL test edildi

---

## 🎉 Başarılı Deploy Sonrası

- **Production URL**: `https://your-app-name.vercel.app`
- **Database**: Vercel Storage → PostgreSQL
- **Logs**: Vercel Dashboard → Deployment → Logs
- **Environment Variables**: Settings → Environment Variables

