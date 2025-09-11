
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    roles?: Array<{
      id: string;
      name: string;
      description?: string | undefined;
    }>;
    permissions?: Array<{
      id: string;
      name: string;
      description?: string | undefined;
    }>;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      firstName?: string | undefined;
      lastName?: string | undefined;
      phone?: string | undefined;
      roles?: Array<{
        id: string;
        name: string;
        description?: string | undefined;
      }>;
      permissions?: Array<{
        id: string;
        name: string;
        description?: string | undefined;
      }>;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles?: Array<{
      id: string;
      name: string;
      description?: string | undefined;
    }>;
    permissions?: Array<{
      id: string;
      name: string;
      description?: string | undefined;
    }>;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
  }
}
