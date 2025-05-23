// src/hooks/use-auth.tsx
"use client";

import type { User } from '@/lib/types';
import { MOCK_USERS } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_COOKIE_NAME = 'mockAuthToken';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check cookie on initial load
    const token = document.cookie.split('; ').find(row => row.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (token && token.split('=')[1] === 'true') {
      // In a real app, you'd verify the token and fetch user details
      // For mock purposes, find user by some stored ID or default to one
      // This example just sets the first user, which might not be correct if multiple users could log in and out.
      // A better mock would store the user ID in the cookie or local storage.
      const storedUser = MOCK_USERS[0]; // Simplified: assume first user if token exists
      if (storedUser) {
        setUser(storedUser);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    // Mock authentication logic
    return new Promise(resolve => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(u => u.email === email); // Password check omitted for simplicity
        if (foundUser) {
          setUser(foundUser);
          document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 24 * 7}`; // Expires in 7 days
          router.push('/dashboard');
          resolve(true);
        } else {
          resolve(false);
        }
        setLoading(false);
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`; // Delete cookie
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
