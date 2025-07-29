"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const hasChecked = useRef(false);
  const isChecking = useRef(false);

  useEffect(() => {
    // Evitar verificações duplicadas
    if (hasChecked.current || isChecking.current) {
      return;
    }

    const checkAuth = () => {
      console.log("🔐 AuthGuard: Iniciando verificação de token");
      hasChecked.current = true;
      isChecking.current = true;
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("🔐 AuthGuard: Nenhum token encontrado");
        setIsAuthenticated(false);
        router.push("/login");
        return;
      }  

      console.log("🔐 AuthGuard: Verificando token no servidor");
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
            console.log("🔐 AuthGuard: Token válido");
            setIsAuthenticated(true);
          } else {
            console.log("🔐 AuthGuard: Token inválido");
            // Token inválido ou expirado
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            router.push("/login");
          }
        })
        .catch((error) => {
          console.log("🔐 AuthGuard: Erro na verificação", error);
          // Erro na requisição
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          router.push("/login");
        })
        .finally(() => {
          isChecking.current = false;
        });
    };

    checkAuth();
  }, []); // Removido router das dependências

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