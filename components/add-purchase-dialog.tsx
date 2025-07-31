"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImage } from "@/components/product-image";
import { ShoppingCart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  image?: string;
}

interface AddPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPurchaseDialog({ open, onOpenChange, onSuccess }: AddPurchaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    price: "",
  });

  // Buscar produtos quando o diálogo abrir
  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      alert("Selecione um produto");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: parseInt(formData.productId),
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      });

      if (response.ok) {
        setFormData({ productId: "", price: "" });
        setSelectedProduct(null);
        onOpenChange(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar compra");
      }
    } catch (error) {
      console.error("Erro ao criar compra:", error);
      alert("Erro ao criar compra");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId: string) => {
    setFormData(prev => ({ ...prev, productId }));
    const product = products.find(p => p.id.toString() === productId);
    setSelectedProduct(product || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Adicionar Compra
          </DialogTitle>
          <DialogDescription>
            Selecione um produto e adicione os detalhes da compra.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">
                Produto *
              </Label>
              <div className="col-span-3">
                <Select value={formData.productId} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Produto Selecionado</Label>
                <div className="col-span-3 p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      width={32}
                      height={32}
                    />
                    <div>
                      <p className="font-medium text-sm">{selectedProduct.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProduct.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Preço
              </Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.productId}>
              {loading ? "Criando..." : "Criar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 