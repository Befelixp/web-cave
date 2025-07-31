import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY não configurada no .env');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

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

interface AskGeminiRequest {
    productId: number;
    productName: string;
    productCategory: string;
    purchases: Purchase[];
}

interface UserStats {
    user: {
        id: number;
        name: string;
        username: string;
        image?: string;
    };
    totalPurchases: number;
    categories: Record<string, number>;
    recentPurchases: number;
    averagePrice: number;
    lastPurchaseDate: string;
}

export async function POST(request: NextRequest) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'API Key do Gemini não configurada' },
                { status: 500 }
            );
        }

        const body: AskGeminiRequest = await request.json();
        const { productName, productCategory, purchases } = body;

        // Buscar todos os usuários do banco de dados
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Analisar padrões de compra para usuários que já compraram
        const userPurchasePatterns = analyzePurchasePatterns(purchases);

        // Criar estatísticas para todos os usuários, incluindo aqueles que nunca compraram
        const allUserStats = createCompleteUserStats(allUsers, userPurchasePatterns);

        // Escolher usuário usando lógica de fallback (sem Gemini)
        const selectedUser = selectUserWithFallback(allUserStats);

        // Gerar razão com Gemini
        const reason = await generateReasonWithGemini(productName, productCategory, selectedUser, allUserStats);

        const suggestion = {
            suggestedUser: selectedUser.user,
            reason: reason
        };

        return NextResponse.json(suggestion);

    } catch (error: unknown) {
        console.error('Erro ao consultar Gemini:', error);
        return NextResponse.json(
            { error: 'Erro ao processar consulta com IA' },
            { status: 500 }
        );
    }
}

function selectUserWithFallback(userStats: Record<number, UserStats>) {
    const users = Object.values(userStats);

    // Primeiro, priorizar usuários que nunca compraram (totalPurchases = 0)
    const usersWhoNeverBought = users.filter(user => user.totalPurchases === 0);
    if (usersWhoNeverBought.length > 0) {
        // Se há usuários que nunca compraram, escolher um aleatoriamente
        const randomIndex = Math.floor(Math.random() * usersWhoNeverBought.length);
        return usersWhoNeverBought[randomIndex];
    }

    // Se todos já compraram, usar lógica que considera gastos
    const bestMatch = users.reduce((best, current) => {
        // 1. Priorizar quem menos contribuiu nos últimos 30 dias
        if (current.recentPurchases !== best.recentPurchases) {
            return current.recentPurchases < best.recentPurchases ? current : best;
        }

        // 2. Se empatar em compras recentes, priorizar quem gastou menos dinheiro
        const currentTotalSpent = current.averagePrice * current.totalPurchases;
        const bestTotalSpent = best.averagePrice * best.totalPurchases;

        if (Math.abs(currentTotalSpent - bestTotalSpent) > 0.01) { // Evitar problemas de precisão float
            return currentTotalSpent < bestTotalSpent ? current : best;
        }

        // 3. Se empatar em gastos, priorizar quem não contribui há mais tempo
        const currentDaysSinceLast = Math.floor((new Date().getTime() - new Date(current.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        const bestDaysSinceLast = Math.floor((new Date().getTime() - new Date(best.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        return currentDaysSinceLast > bestDaysSinceLast ? current : best;
    }, users[0]);

    return bestMatch;
}

function analyzePurchasePatterns(purchases: Purchase[]) {
    const userStats: Record<number, UserStats> = {};

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    purchases.forEach(purchase => {
        const userId = purchase.userId;
        const purchaseDate = new Date(purchase.purchaseDate);
        const isRecent = purchaseDate >= thirtyDaysAgo;

        if (!userStats[userId]) {
            userStats[userId] = {
                user: purchase.user,
                totalPurchases: 0,
                categories: {},
                recentPurchases: 0,
                averagePrice: 0,
                lastPurchaseDate: purchase.purchaseDate
            };
        }

        const stats = userStats[userId];
        stats.totalPurchases++;

        if (isRecent) {
            stats.recentPurchases++;
        }

        stats.categories[purchase.product.category] = (stats.categories[purchase.product.category] || 0) + 1;

        if (purchase.price) {
            const currentTotal = stats.averagePrice * (stats.totalPurchases - 1);
            stats.averagePrice = (currentTotal + purchase.price) / stats.totalPurchases;
        }

        if (purchaseDate > new Date(stats.lastPurchaseDate)) {
            stats.lastPurchaseDate = purchase.purchaseDate;
        }
    });

    return userStats;
}

function createCompleteUserStats(allUsers: Array<{
    id: number;
    name: string;
    username: string;
    image: string | null;
    role: string;
    createdAt: Date;
}>, userPurchasePatterns: Record<number, UserStats>) {
    const allUserStats: Record<number, UserStats> = {};
    const now = new Date();

    allUsers.forEach(user => {
        const userPurchaseData = userPurchasePatterns[user.id];

        if (userPurchaseData) {
            // Usuário já tem histórico de compras
            allUserStats[user.id] = userPurchaseData;
        } else {
            // Usuário nunca comprou - criar estatísticas vazias
            allUserStats[user.id] = {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    image: user.image || undefined
                },
                totalPurchases: 0,
                categories: {},
                recentPurchases: 0,
                averagePrice: 0,
                lastPurchaseDate: user.createdAt.toISOString() // Usar data de criação como "última compra"
            };
        }
    });

    return allUserStats;
}

async function generateReasonWithGemini(
    productName: string,
    productCategory: string,
    selectedUser: UserStats,
    userStats: Record<number, UserStats>
) {
    try {
        const users = Object.values(userStats);
        const daysSinceLast = Math.floor((new Date().getTime() - new Date(selectedUser.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));

        // Verificar se o usuário nunca comprou
        const neverBought = selectedUser.totalPurchases === 0;

        const totalSpent = selectedUser.averagePrice * selectedUser.totalPurchases;

        const userInfo = neverBought
            ? `- Total de contribuições: NUNCA CONTRIBUÍU (0)`
            : `- Total de contribuições: ${selectedUser.totalPurchases}`;

        const spendingInfo = neverBought
            ? `- Total gasto: R$ 0,00`
            : `- Total gasto: R$ ${totalSpent.toFixed(2)}`;

        const lastContribution = neverBought
            ? `- Última contribuição: NUNCA CONTRIBUÍU`
            : `- Última contribuição: ${new Date(selectedUser.lastPurchaseDate).toLocaleDateString('pt-BR')}`;

        const prompt = `
Você é um membro da comunidade "Cave" que está CANSADO de sempre os mesmos contribuírem. Seja DIRETO, ASSERTIVO e até AGRESSIVO - como alguém que está falando a verdade na cara mesmo.

O usuário ${selectedUser.user.name} (@${selectedUser.user.username}) foi selecionado para contribuir com "${productName}" (${productCategory}).

INFORMAÇÕES DO USUÁRIO SELECIONADO:
${userInfo}
${spendingInfo}
- Contribuições recentes (últimos 30 dias): ${selectedUser.recentPurchases}
${lastContribution}
- Dias desde a última contribuição: ${daysSinceLast} dias

CONTEXTO DA COMUNIDADE:
${users.map(user => {
            const userDaysSinceLast = Math.floor((new Date().getTime() - new Date(user.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
            const userLastContribution = user.totalPurchases === 0
                ? 'NUNCA CONTRIBUÍU'
                : new Date(user.lastPurchaseDate).toLocaleDateString('pt-BR');

            const userTotalSpent = user.averagePrice * user.totalPurchases;
            const userSpendingInfo = user.totalPurchases === 0
                ? '- Total gasto: R$ 0,00'
                : `- Total gasto: R$ ${userTotalSpent.toFixed(2)}`;

            return `
${user.user.name} (@${user.user.username}):
- Total de contribuições: ${user.totalPurchases}
${userSpendingInfo}
- Contribuições recentes (últimos 30 dias): ${user.recentPurchases}
- Última contribuição: ${userLastContribution}
- Dias desde a última contribuição: ${userDaysSinceLast} dias`;
        }).join('\n')}

TAREFA:
Gere uma mensagem CURTA, AGRESSIVA e DIRETA (máximo 2 frases) explicando por que ${selectedUser.user.name} deve contribuir com "${productName}".

REQUISITOS:
- Mencione o nome do usuário (${selectedUser.user.name})
- Seja assertivo e use tom de cobrança
${neverBought
                ? '- Destaque que ele NUNCA contribuiu e está na hora de começar'
                : `- Mencione quando foi a última contribuição (${daysSinceLast} dias atrás) e quanto ele gastou (R$ ${totalSpent.toFixed(2)})`
            }
- Use linguagem natural e gírias
- Seja DIRETO e gere uma mensagem CURTA e ÚNICA
- Máximo 2 frases

RESPONDA APENAS COM A MENSAGEM, sem JSON ou formatação adicional.
`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text.trim();

    } catch (error) {
        console.error('Erro ao gerar razão com Gemini:', error);

        // Fallback para a razão
        const daysSinceLast = Math.floor((new Date().getTime() - new Date(selectedUser.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        const totalSpent = selectedUser.averagePrice * selectedUser.totalPurchases;

        if (selectedUser.totalPurchases === 0) {
            return `Chega de moleza! Hora do ${selectedUser.user.name} começar a contribuir! Ele nunca contribuiu com nada! 💪`;
        }

        return `Chega de moleza! Hora do ${selectedUser.user.name} contribuir! Ele só gastou R$ ${totalSpent.toFixed(2)} e não contribui há ${daysSinceLast} dias. 💪`;
    }
}

