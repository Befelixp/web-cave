"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FAB } from "@/components/fab";
import { AddProductDialog } from "@/components/add-product-dialog";
import { AddPurchaseDialog } from "@/components/add-purchase-dialog";
import { ProductImage } from "@/components/product-image";
import { LogOut } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// Função para gerar cor baseada no nome do usuário
function getUserColor(userName: string) {
  const colors = [
    'bg-red-700/20 text-red-700 ring-red-600/30',
    'bg-blue-700/20 text-blue-700 ring-blue-600/30',
    'bg-green-700/20 text-green-700 ring-green-600/30',
    'bg-purple-700/20 text-purple-700 ring-purple-600/30',
    'bg-orange-700/20 text-orange-700 ring-orange-600/30',
    'bg-pink-700/20 text-pink-700 ring-pink-600/30',
    'bg-indigo-700/20 text-indigo-700 ring-indigo-600/30',
    'bg-teal-700/20 text-teal-700 ring-teal-600/30',
    'bg-amber-700/20 text-amber-700 ring-amber-600/30',
    'bg-emerald-700/20 text-emerald-700 ring-emerald-600/30',
  ];
  
  // Gera um hash simples baseado no nome
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Usa o hash para selecionar uma cor
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

interface Purchase {
  id: number;
  userId: number;
  productId: number;
  price?: number;
  purchaseDate: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    image?: string;
  };
  product: {
    id: number;
    name: string;
    category: string;
    image?: string;
  };
}

function HomeContent() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addPurchaseOpen, setAddPurchaseOpen] = useState(false);
  const router = useRouter();
  const hasFetched = useRef(false);

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/purchases');
      if (response.ok) {
        const data = await response.json();
        const recentPurchases = data.slice(0, 10);
        setPurchases(recentPurchases);
      }
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }
    
    hasFetched.current = true;
    fetchPurchases();
  }, []);

  const handleLogout = () => {
    // Remover token do localStorage
    localStorage.removeItem("token");
    // Redirecionar para a página de login
    router.push("/login");
  };

  const handleAddProduct = () => {
    setAddProductOpen(true);
  };

  const handleAddPurchase = () => {
    setAddPurchaseOpen(true);
  };

  const handleSuccess = () => {
    // Recarregar dados após sucesso
    hasFetched.current = false;
    setLoading(true);
    fetchPurchases();
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {/* Header com botão de logout */}
      <div className="absolute top-4 right-4">
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-2xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Histórico de Compras</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Skeleton className="w-10 h-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : purchases.length > 0 ? (
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <ProductImage
                      src={purchase.product.image}
                      alt={purchase.product.name}
                      width={40}
                      height={40}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{purchase.product.name}</h3>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getUserColor(purchase.user.name)}`}>
                          {purchase.user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{purchase.product.category}</span>
                        {purchase.price && (
                          <>
                            <span>•</span>
                            <span>€ {purchase.price.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {new Date(purchase.purchaseDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Nenhuma compra encontrada.</p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Button */}
      <FAB 
        onAddProduct={handleAddProduct}
        onAddPurchase={handleAddPurchase}
      />

      {/* Diálogos */}
      <AddProductDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        onSuccess={handleSuccess}
      />
      
      <AddPurchaseDialog
        open={addPurchaseOpen}
        onOpenChange={setAddPurchaseOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
