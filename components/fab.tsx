"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Package, ShoppingCart } from "lucide-react";

interface FABProps {
  onAddProduct?: () => void;
  onAddPurchase?: () => void;
}

export function FAB({ onAddProduct, onAddPurchase }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddProduct = () => {
    setIsOpen(false);
    onAddProduct?.();
  };

  const handleAddPurchase = () => {
    setIsOpen(false);
    onAddPurchase?.();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 p-2 space-y-1"
          side="top"
          sideOffset={8}
        >
          <DropdownMenuItem
            onClick={handleAddProduct}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent rounded-md"
          >
            <Package className="h-4 w-4" />
            <span>Adicionar Produto</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleAddPurchase}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent rounded-md"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Adicionar Compra</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 