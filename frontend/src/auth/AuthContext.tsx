import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: string;
};

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export enum UserRole {
  Admin = 'admin',
  Viewer = 'viewer',
}

export const permissions = {
  [UserRole.Admin]: ['edit', 'view', 'delete'],
  [UserRole.Viewer]: ['view'],
};
