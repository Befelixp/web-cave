"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/navbar";
import { ProductImage } from "@/components/product-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  category: string;
  image?: string;
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

interface GeminiSuggestion {
  suggestedUser: {
    id: number;
    name: string;
    username: string;
    image?: string;
  };
  reason: string;
}

export default function AskCavePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [suggestion, setSuggestion] = useState<GeminiSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, purchasesResponse] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/purchases')
        ]);

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData);
        }

        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setPurchases(purchasesData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAskGemini = async () => {
    if (!selectedProduct) return;

    setSuggesting(true);
    setSuggestion(null);

    try {
      const response = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productCategory: selectedProduct.category,
          purchases: purchases.slice(0, 20) // Enviar as 20 compras mais recentes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestion(data);
      } else {
        console.error('Erro ao obter sugestão do Gemini');
      }
    } catch (error) {
      console.error('Erro ao comunicar com Gemini:', error);
    } finally {
      setSuggesting(false);
    }
  };

          if (loading) {
    return (
      <AuthGuard>
        <div className="font-sans min-h-screen">
          <Navbar />
          <div className="mt-32 px-4 py-4 sm:px-8 sm:py-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Pergunte à Cave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="font-sans min-h-screen">
        <Navbar />
        <div className="mt-28 px-4 py-4 sm:px-8 sm:py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Pergunte à Cave
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Selecione um produto que precisa ser contribuído para a Cave:
                    </label>
                    <Select
                      value={selectedProduct?.id?.toString() || ""}
                      onValueChange={(value) => {
                        const product = products.find(p => p.id.toString() === value);
                        setSelectedProduct(product || null);
                        setSuggestion(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            <div className="flex items-center gap-2">
                              <ProductImage
                                src={product.image}
                                alt={product.name}
                                width={20}
                                height={20}
                                className="rounded-sm"
                              />
                              <span>{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({product.category})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProduct && (
                    <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg border bg-muted/20">
                      <ProductImage
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        width={40}
                        height={40}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{selectedProduct.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Categoria: {selectedProduct.category}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleAskGemini}
                    disabled={!selectedProduct || suggesting}
                    className="w-full"
                  >
                    {suggesting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Consultando a Cave...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Perguntar à Cave
                      </div>
                    )}
                  </Button>
                </div>

                {suggestion && (
                  <div className="mt-6 p-6 rounded-lg border bg-muted/50 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        <div className="relative">
                          <Avatar className="h-14 w-14 ring-2 ring-primary/20 shadow-md">
                            <AvatarImage src={suggestion.suggestedUser.image} alt={suggestion.suggestedUser.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border border-background shadow-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start mb-3">
                          <h3 className="text-base font-semibold text-foreground leading-tight">
                            Cave sugere que <span className="text-primary font-bold">{suggestion.suggestedUser.name}</span> contribua
                          </h3>
                        </div>
                        <div className="p-3 bg-background/50 rounded-md border">
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {suggestion.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {purchases.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Histórico recente de contribuições (usado para análise):
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {purchases.slice(0, 5).map((purchase) => (
                        <div key={purchase.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                          <ProductImage
                            src={purchase.product.image}
                            alt={purchase.product.name}
                            width={20}
                            height={20}
                            className="rounded-sm flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium text-sm truncate">{purchase.user.name}</span>
                              <span className="text-muted-foreground text-xs sm:text-sm">contribuiu com</span>
                              <span className="font-medium text-sm truncate">{purchase.product.name}</span>
                            </div>
                          </div>
                          <span className="text-muted-foreground text-xs flex-shrink-0">
                            {new Date(purchase.purchaseDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 