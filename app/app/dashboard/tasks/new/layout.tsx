import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default function NewTaskLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

