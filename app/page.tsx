"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FAB } from "@/components/fab";
import { AddProductDialog } from "@/components/add-product-dialog";
import { AddPurchaseDialog } from "@/components/add-purchase-dialog";
import { ProductImage } from "@/components/product-image";
import { Navbar } from "@/components/navbar";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

// Função para gerar cor baseada no nome do usuário
function getUserColor(userName: string) {
  const colors = [
    'bg-red-500/20 text-red-700 ring-red-500/30',
    'bg-blue-500/20 text-blue-700 ring-blue-500/30',
    'bg-green-500/20 text-green-700 ring-green-500/30',
    'bg-purple-500/20 text-purple-700 ring-purple-500/30',
    'bg-orange-500/20 text-orange-700 ring-orange-500/30',
    'bg-pink-500/20 text-pink-700 ring-pink-500/30',
    'bg-indigo-500/20 text-indigo-700 ring-indigo-500/30',
    'bg-teal-500/20 text-teal-700 ring-teal-500/30',
    'bg-amber-500/20 text-amber-700 ring-amber-500/30',
    'bg-emerald-500/20 text-emerald-700 ring-emerald-500/30',
    'bg-cyan-500/20 text-cyan-700 ring-cyan-500/30',
    'bg-lime-500/20 text-lime-700 ring-lime-500/30',
    'bg-rose-500/20 text-rose-700 ring-rose-500/30',
    'bg-violet-500/20 text-violet-700 ring-violet-500/30',
    'bg-sky-500/20 text-sky-700 ring-sky-500/30',
    'bg-fuchsia-500/20 text-fuchsia-700 ring-fuchsia-500/30',
  ];
  
  // Gera um hash mais robusto baseado no nome
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    const char = userName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32-bit integer
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
    <div className="font-sans min-h-screen">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <div className="pt-20 p-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Histórico de Compras Geral</CardTitle>
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
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{purchase.product.name}</h3>
                        <Link 
                          href={`/profile/${purchase.user.id}`}
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getUserColor(purchase.user.name)} hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0`}
                        >
                          {purchase.user.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{purchase.product.category}</span>
                        {purchase.price && (
                          <>
                            <span>•</span>
                            <span>€ {purchase.price.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
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
        </div>

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
