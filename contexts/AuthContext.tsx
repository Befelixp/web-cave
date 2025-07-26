"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Função para decodificar JWT no cliente (sem verificar assinatura)
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Função para verificar se o token está expirado
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  // Verificar se expirou (com margem de 5 minutos)
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: any;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: (forceServerCheck?: boolean) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [lastServerCheck, setLastServerCheck] = useState<number>(0);
  const router = useRouter();

  const checkAuth = useCallback(async (forceServerCheck = false) => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }

    // Primeiro, verificar localmente se o token expirou
    if (isTokenExpired(token)) {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }

    // Decodificar token para obter informações do usuário
    const decoded = decodeJWT(token);
    setUser(decoded);

    // Verificar se já fizemos uma verificação no servidor recentemente (últimos 5 minutos)
    const now = Date.now();
    const timeSinceLastCheck = now - lastServerCheck;
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (!forceServerCheck && timeSinceLastCheck < FIVE_MINUTES) {
      // Se verificamos recentemente, confiar na verificação local
      setIsAuthenticated(true);
      return true;
    }

    // Se não verificamos recentemente ou forçamos verificação, fazer verificação no servidor
    setLastServerCheck(now);
    
    try {
      const response = await fetch("/api/verify-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      } else {
        // Token inválido no servidor - remover e redirecionar
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      // Em caso de erro de rede, manter o usuário logado se o token não expirou localmente
      if (!isTokenExpired(token)) {
        setIsAuthenticated(true);
        return true;
      } else {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    }
  }, [lastServerCheck]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setLastServerCheck(0);
    router.push("/login");
  }, [router]);

  const login = useCallback((token: string) => {
    localStorage.setItem("token", token);
    checkAuth(true); // Forçar verificação no servidor após login
  }, [checkAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
    isLoading: isAuthenticated === null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 