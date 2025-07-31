"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/navbar";
import { ProductImage } from "@/components/product-image";
import { EditProductDialog } from "@/components/edit-product-dialog";
import { DeleteProductDialog } from "@/components/delete-product-dialog";
import { useAdmin } from "@/hooks/useAdmin";
import { Edit, Trash2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  category: string;
  image?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/');
      return;
    }

    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin, adminLoading, router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDeleteSuccess = () => {
    setDeletingProduct(null);
    fetchProducts();
  };

  if (adminLoading) {
    return (
      <AuthGuard>
        <div className="font-sans min-h-screen">
          <Navbar />
          <div className="mt-28 px-4 py-4 sm:px-8 sm:py-8">
            <div className="max-w-4xl mx-auto">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Gerenciar Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(5)].map((_item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Skeleton className="w-10 h-10 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!isAdmin) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <AuthGuard>
      <div className="font-sans min-h-screen">
        <Navbar />
        <div className="mt-28 px-4 py-4 sm:px-8 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Gerenciar Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Skeleton className="w-10 h-10 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm break-words">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Categoria: {product.category}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingProduct(product)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Nenhum produto encontrado.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Diálogos */}
        <EditProductDialog
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          product={editingProduct}
          onSuccess={handleEditSuccess}
        />
        
        <DeleteProductDialog
          open={!!deletingProduct}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
          product={deletingProduct}
          onSuccess={handleDeleteSuccess}
        />
      </div>
    </AuthGuard>
  );
} 