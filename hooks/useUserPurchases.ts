import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

export function useUserPurchases() {
    const { user } = useAuth();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const hasLoaded = useRef<number | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        // Se já carregamos para este usuário, não carregar novamente
        if (hasLoaded.current === user.id) return;

        const fetchUserPurchases = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`/api/purchases?userId=${user.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setPurchases(data);
                    hasLoaded.current = user.id; // Marcar como carregado
                }
            } catch (error) {
                console.error("Erro ao buscar compras do usuário:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPurchases();
    }, [user?.id]);

    const deletePurchase = async (purchaseId: number) => {
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
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || "Erro ao deletar compra" };
            }
        } catch (error) {
            console.error("Erro ao deletar compra:", error);
            return { success: false, error: "Erro de conexão ao deletar compra" };
        }
    };

    return { purchases, loading, deletePurchase };
}