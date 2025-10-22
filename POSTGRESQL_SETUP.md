# PostgreSQL Database Oluşturma Rehberi

## 🚀 Vercel'de PostgreSQL Database Oluşturma:

### 1. Vercel Dashboard'a Git:
- https://vercel.com/dashboard
- Projenizi seçin

### 2. Storage Sekmesine Git:
- Sol menüden "Storage" seçin
- "Create Database" butonuna tıklayın
- "PostgreSQL" seçin

### 3. Database Ayarları:
- **Name**: `high5-backoffice-db`
- **Region**: `Frankfurt` (Avrupa'ya yakın)
- **Plan**: `Hobby` (ücretsiz)

### 4. Connection String'i Kopyala:
```
postgresql://username:password@host:port/database?schema=public
```

### 5. Environment Variables Ayarla:
Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL = postgresql://username:password@host:port/database?schema=public
NEXTAUTH_SECRET = your-secret-key-here
NEXTAUTH_URL = https://your-app.vercel.app
```

### 6. Local Test için .env Güncelle:
```bash
# .env dosyasında:
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
NEXTAUTH_SECRET="dev-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 📋 Sonraki Adımlar:

1. ✅ PostgreSQL database oluştur
2. ✅ Connection string'i kopyala
3. ✅ Environment variables ayarla
4. ⏳ Migration çalıştır
5. ⏳ Veri bütünlüğünü kontrol et

## 🔒 Güvenlik:
- Tüm veriler yedeklendi (6,980 kayıt)
- SQLite dosyası korundu
- Rollback mümkün
