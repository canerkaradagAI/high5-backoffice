
import LoginForm from './login-form';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-4">
        <div className="card backdrop-blur-xl bg-white/95 shadow-2xl">
          {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="w-52 h-52 mx-auto mb-2 flex items-center justify-center">
                <Image
                  src="/logo/high5.svg"
                  alt="High5 Logo"
                  width={208}
                  height={208}
                  className="object-contain"
                  priority
                />
              </div>
              <p className="text-gray-600 text-base font-medium">Premium Mağazacılık Deneyimi</p>
              <div className="w-24 h-1.5 bg-black mx-auto rounded-full mt-4 shadow-sm"></div>
            </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 font-medium">
              High5 Premium Mağaza Yönetim Sistemi
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2024 Tüm hakları saklıdır
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
