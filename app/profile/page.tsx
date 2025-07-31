"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      // Redirecionar para a página dinâmica do próprio perfil
      router.replace(`/profile/${user.id}`);
    }
  }, [user?.id, router]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="font-sans min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    </div>
  );
} 