"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Sparkles, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

export function Navbar() {
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center cursor-pointer">
          <Image
            src="/THE CAVE text.png"
            alt="THE CAVE"
            width={180}
            height={60}
            className="h-16 w-auto"
          />
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Link 
            href="/ask-cave"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:block">Pergunte à Cave</span>
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin/products"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:block">Gerenciar Produtos</span>
            </Link>
          )}
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center gap-4">
          {/* Profile */}
          <Link 
            href="/profile"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image} alt={user?.name} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">
              {user?.name || "Usuário"}
            </span>
          </Link>

          {/* Logout */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
} 