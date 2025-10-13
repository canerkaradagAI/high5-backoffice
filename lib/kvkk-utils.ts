/**
 * KVKK Uyumlu Veri Maskeleme Fonksiyonları
 * Kişisel Verilerin Korunması Kanunu gereği hassas verileri maskeleyerek gösterir
 */

/**
 * Telefon numarasını maskeleyerek gösterir
 * Örnek: 05551234567 -> 0555***4567
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'Belirtilmemiş';
  
  // Sadece rakamları al
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 7) return phone; // Çok kısa numaraları maskeleme
  
  // İlk 4 ve son 4 rakamı göster, ortayı maskele
  const start = cleanPhone.slice(0, 4);
  const end = cleanPhone.slice(-4);
  const masked = '*'.repeat(Math.max(3, cleanPhone.length - 8));
  
  return `${start}${masked}${end}`;
}

/**
 * E-posta adresini maskeleyerek gösterir
 * Örnek: test@example.com -> t***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'Belirtilmemiş';
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  if (localPart.length <= 2) return email; // Çok kısa e-postaları maskeleme
  
  const maskedLocal = localPart[0] + '*'.repeat(Math.max(2, localPart.length - 2)) + localPart.slice(-1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Adresi maskeleyerek gösterir
 * Örnek: "İstanbul Kadıköy Moda Mahallesi" -> "İstanbul Kadıköy *** Mahallesi"
 */
export function maskAddress(address: string | null | undefined): string {
  if (!address) return 'Belirtilmemiş';
  
  const words = address.split(' ');
  if (words.length <= 2) return address; // Çok kısa adresleri maskeleme
  
  // Ortadaki kelimeleri maskele (ilk ve son kelimeyi koru)
  const maskedWords = words.map((word, index) => {
    if (index === 0 || index === words.length - 1) {
      return word; // İlk ve son kelimeyi koru
    }
    return '*'.repeat(Math.max(2, word.length)); // Ortadaki kelimeleri maskele
  });
  
  return maskedWords.join(' ');
}

/**
 * TC Kimlik numarasını maskeleyerek gösterir
 * Örnek: 12345678901 -> 123****8901
 */
export function maskTCNumber(tcNumber: string | null | undefined): string {
  if (!tcNumber) return 'Belirtilmemiş';
  
  const cleanTC = tcNumber.replace(/\D/g, '');
  if (cleanTC.length !== 11) return tcNumber; // Geçerli TC formatı değilse maskeleme
  
  const start = cleanTC.slice(0, 3);
  const end = cleanTC.slice(-4);
  const masked = '*'.repeat(4);
  
  return `${start}${masked}${end}`;
}

/**
 * Tam adı maskeleyerek gösterir
 * Örnek: "Ahmet Yılmaz" -> "A*** Y***"
 */
export function maskFullName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const first = firstName || '';
  const last = lastName || '';
  
  if (!first && !last) return 'Belirtilmemiş';
  
  const maskedFirst = first.length > 1 ? first[0] + '*'.repeat(Math.max(2, first.length - 1)) : first;
  const maskedLast = last.length > 1 ? last[0] + '*'.repeat(Math.max(2, last.length - 1)) : last;
  
  return `${maskedFirst} ${maskedLast}`.trim();
}

/**
 * KVKK izin durumunu kontrol eder
 * Eğer kullanıcı tam veri görme izni varsa maskeleme yapmaz
 */
export function shouldMaskData(userRole: string | null | undefined, hasFullAccess: boolean = false): boolean {
  // Manager ve admin rolleri tam veri görebilir
  if (userRole === 'MANAGER' || userRole === 'ADMIN' || hasFullAccess) {
    return false;
  }
  
  // Diğer roller için maskeleme yap
  return true;
}

/**
 * KVKK uyumlu veri gösterimi için ana fonksiyon
 */
export function getKVKKCompliantData(
  data: {
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    tcNumber?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
  userRole?: string | null,
  hasFullAccess: boolean = false
) {
  const shouldMask = shouldMaskData(userRole, hasFullAccess);
  
  return {
    phone: shouldMask ? maskPhoneNumber(data.phone) : data.phone || 'Belirtilmemiş',
    email: shouldMask ? maskEmail(data.email) : data.email || 'Belirtilmemiş',
    address: shouldMask ? maskAddress(data.address) : data.address || 'Belirtilmemiş',
    tcNumber: shouldMask ? maskTCNumber(data.tcNumber) : data.tcNumber || 'Belirtilmemiş',
    fullName: shouldMask ? maskFullName(data.firstName, data.lastName) : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Belirtilmemiş'
  };
}
