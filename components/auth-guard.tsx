"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsAuthenticated(false);
        router.push("/login");
        return;
      }

      // Verificar se o token é válido fazendo uma requisição para a API
      fetch("/api/verify-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Token inválido ou expirado
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            router.push("/login");
          }
        })
        .catch(() => {
          // Erro na requisição
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          router.push("/login");
        });
    };

    checkAuth();
  }, [router]);

  // Mostrar loading enquanto verifica autenticação
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada (já redirecionou)
  if (!isAuthenticated) {
    return null;
  }

  // Se estiver autenticado, renderiza os children
  return <>{children}</>;
} 