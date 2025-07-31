"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [lastServerCheck, setLastServerCheck] = useState<number>(0);
  const isChecking = useRef(false);
  const router = useRouter();

  const checkAuth = useCallback(async (forceServerCheck = false) => {
    // Evitar verificações simultâneas
    if (isChecking.current) {
      return isAuthenticated === true;
    }

    isChecking.current = true;
    
    try {
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

      // Decodificar token para obter informações básicas do usuário
      const decoded = decodeJWT(token);

      // Verificar se já fizemos uma verificação no servidor recentemente (últimos 5 minutos)
      const now = Date.now();
      const timeSinceLastCheck = now - lastServerCheck;
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (!forceServerCheck && timeSinceLastCheck < FIVE_MINUTES) {
        // Se verificamos recentemente, confiar na verificação local
        setIsAuthenticated(true);
        // Buscar dados completos do usuário apenas se não temos dados ou se são incompletos
        if (!user || !user.image) {
          try {
            const userResponse = await fetch("/api/users/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
            }
          } catch (error) {
            // Silenciar erro
          }
        }
        return true;
      }

      // Se não verificamos recentemente ou forçamos verificação, fazer verificação no servidor
      setLastServerCheck(now);
      
      const response = await fetch("/api/verify-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        
        // Buscar dados completos do usuário apenas se não temos dados completos
        if (!user || !user.image) {
          try {
            const userResponse = await fetch("/api/users/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
            }
          } catch (error) {
            // Se não conseguir buscar dados completos, usar dados do token
            setUser(decoded);
          }
        } else {
          // Se já temos dados completos, usar os existentes
          setUser(user);
        }
        
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
      const token = localStorage.getItem("token");
      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
        return true;
      } else {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } finally {
      isChecking.current = false;
    }
  }, [lastServerCheck, isAuthenticated]);

  const login = useCallback(async (token: string) => {
    localStorage.setItem("token", token);
    const result = await checkAuth(true); // Aguardar verificação no servidor após login
    return result;
  }, [checkAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setLastServerCheck(0);
    router.push("/login");
  }, [router]);

  const refreshUserData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const userResponse = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }
    } catch (error) {
      // Silenciar erro
    }
  }, []);

  useEffect(() => {
    // Só executar checkAuth se ainda não foi executado
    if (isAuthenticated === null) {
      checkAuth();
    }
  }, [checkAuth, isAuthenticated]);

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
    refreshUserData,
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