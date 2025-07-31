"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ShoppingBag, Edit, Trash2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ProductImage } from "@/components/product-image";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { DeletePurchaseDialog } from "@/components/delete-purchase-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface UserProfile {
  id: number;
  name: string;
  username: string;
  image?: string;
  role: string;
  createdAt: string;
}

interface Purchase {
  id: number;
  userId: number;
  productId: number;
  price?: number;
  purchaseDate: string;
  createdAt: string;
  product: {
    id: number;
    name: string;
    category: string;
    image?: string;
  };
}

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const userId = params.id as string;
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        
        // Buscar perfil e compras em paralelo
        const [profileResponse, purchasesResponse] = await Promise.all([
          fetch(`/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/purchases?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData);
        } else {
          setError("Usuário não encontrado");
        }

        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setPurchases(purchasesData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleProfileUpdate = () => {
    // Recarregar dados do perfil após edição
    if (userId) {
      const token = localStorage.getItem("token");
      fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => response.json())
      .then(data => setUserProfile(data))
      .catch(error => console.error("Erro ao atualizar perfil:", error));
    }
  };

  const handleDeletePurchase = async (purchaseId: number) => {
    setDeletingPurchaseId(purchaseId);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remover a compra da lista local
        setPurchases(prev => prev.filter(purchase => purchase.id !== purchaseId));
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao deletar compra");
      }
    } catch (error) {
      console.error("Erro ao deletar compra:", error);
      alert("Erro de conexão ao deletar compra");
    } finally {
      setDeletingPurchaseId(null);
    }
  };

  const openDeleteDialog = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <AuthGuard>
        <div className="font-sans min-h-screen">
          <Navbar />
          <div className="pt-20 p-8">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-destructive">{error}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (loading || !userProfile) {
    return (
      <AuthGuard>
        <div className="font-sans min-h-screen">
          <Navbar />
          <div className="pt-20 p-8">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-32 w-32 bg-muted rounded-full mx-auto mb-4"></div>
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <AuthGuard>
      <div className="font-sans min-h-screen">
        <Navbar />
        <div className="pt-20 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Perfil do Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {isOwnProfile ? "Meu Perfil" : `Perfil de ${userProfile.name}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Avatar e Info do Usuário */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="h-28 w-28 mx-auto sm:mx-0">
                      <AvatarImage src={userProfile.image} alt={userProfile.name} />
                      <AvatarFallback className="text-2xl">
                        <User className="h-14 w-14" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1 text-center sm:text-left">
                      <h2 className="text-xl font-bold">{userProfile.name}</h2>
                      <p className="text-muted-foreground">@{userProfile.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Membro desde {new Date(userProfile.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Botão Editar - Só aparece se for o próprio usuário */}
                  {isOwnProfile && (
                    <Button 
                      className="flex items-center gap-2 w-full sm:w-auto"
                      onClick={() => setEditDialogOpen(true)}
                    >
                      <Edit className="w-4 h-4" />
                      Editar Perfil
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Compras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Histórico de Compras
                  {!isOwnProfile && <span className="text-sm font-normal text-muted-foreground">de {userProfile.name}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">
                              {new Date(purchase.purchaseDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {/* Botão de deletar - só aparece se for o próprio usuário */}
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(purchase)}
                              disabled={deletingPurchaseId === purchase.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingPurchaseId === purchase.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "Você ainda não fez nenhuma compra." : `${userProfile.name} ainda não fez nenhuma compra.`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Comece adicionando produtos ao seu histórico!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Diálogo de Edição de Perfil */}
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleProfileUpdate}
        />

        {/* Diálogo de Confirmação de Deletar Compra */}
        {purchaseToDelete && (
          <DeletePurchaseDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={() => handleDeletePurchase(purchaseToDelete.id)}
            purchaseName={purchaseToDelete.product.name}
            loading={deletingPurchaseId === purchaseToDelete.id}
          />
        )}
      </div>
    </AuthGuard>
  );
}