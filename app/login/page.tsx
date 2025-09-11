
import LoginForm from './login-form';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center olka-gradient-light">
      <div className="max-w-md w-full mx-4">
        <div className="card backdrop-blur-xl bg-white/95 shadow-2xl">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 olka-gradient rounded-3xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.739 8.9 9.99.34.02.67.01 1.1.01s.76.01 1.1-.01C18.16 26.739 22 22.55 22 17V7l-10-5z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold olka-text-dark mb-3">OLKA</h1>
            <p className="text-gray-500 text-base font-medium">Premium Mağaza Backoffice</p>
            <div className="w-24 h-1.5 olka-gradient mx-auto rounded-full mt-4 shadow-sm"></div>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 font-medium">
              OLKA Premium Mağaza Yönetim Sistemi
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2024 Tüm hakları saklıdır
            </p>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="mt-6 card bg-white/80 backdrop-blur-sm border border-white/50">
          <p className="text-base font-semibold olka-text-dark mb-3 text-center">Demo Hesaplar:</p>
          <div className="space-y-3">
            <div className="p-3 olka-bg-light rounded-xl border border-white/50">
              <p className="font-medium text-gray-700 text-sm">Mağaza Müdürü</p>
              <p className="text-xs text-gray-500 mt-1">mudur@olka.com • 123456</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <p className="font-medium text-gray-700 text-sm">Satış Danışmanı</p>
              <p className="text-xs text-gray-500 mt-1">satis@olka.com • 123456</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <p className="font-medium text-gray-700 text-sm">Runner</p>
              <p className="text-xs text-gray-500 mt-1">runner@olka.com • 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
