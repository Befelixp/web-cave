import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
    const { user } = useAuth();

    // Se não há usuário, não é admin
    if (!user) {
        return { isAdmin: false, loading: false };
    }

    // Verifica se o usuário tem role admin
    const isAdmin = user.role === 'admin';

    return { isAdmin, loading: false };
} 