"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ProductImage({ 
  src, 
  alt, 
  width = 40, 
  height = 40, 
  className 
}: ProductImageProps) {
  if (!src) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-md",
          className
        )}
        style={{ width, height }}
      >
        <Package className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("rounded-md object-cover", className)}
      onError={(e) => {
        // Se a imagem falhar ao carregar, mostra o fallback
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = target.nextElementSibling as HTMLElement;
        if (fallback) {
          fallback.style.display = 'flex';
        }
      }}
    />
  );
} 