import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        if (!purchases || purchases.length === 0) {
            return NextResponse.json(
                { error: 'Histórico de compras necessário para análise' },
                { status: 400 }
            );
        }

        // Analisar padrões de compra
        const userPurchasePatterns = analyzePurchasePatterns(purchases);

        // Escolher usuário usando lógica de fallback (sem Gemini)
        const selectedUser = selectUserWithFallback(userPurchasePatterns);

        // Gerar razão com Gemini
        const reason = await generateReasonWithGemini(productName, productCategory, selectedUser, userPurchasePatterns);

        const suggestion = {
            suggestedUser: selectedUser.user,
            reason: reason
        };

        return NextResponse.json(suggestion);

    } catch (error: any) {
        console.error('Erro ao consultar Gemini:', error);
        return NextResponse.json(
            { error: 'Erro ao processar consulta com IA' },
            { status: 500 }
        );
    }
}

function selectUserWithFallback(userStats: Record<number, any>) {
    const users = Object.values(userStats);
    const bestMatch = users.reduce((best, current) => {
        // Priorizar quem menos contribuiu nos últimos 30 dias
        if (current.recentPurchases !== best.recentPurchases) {
            return current.recentPurchases < best.recentPurchases ? current : best;
        }
        // Se empatar, priorizar quem não contribui há mais tempo
        const currentDaysSinceLast = Math.floor((new Date().getTime() - new Date(current.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        const bestDaysSinceLast = Math.floor((new Date().getTime() - new Date(best.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        return currentDaysSinceLast > bestDaysSinceLast ? current : best;
    }, users[0]);

    return bestMatch;
}

function analyzePurchasePatterns(purchases: Purchase[]) {
    const userStats: Record<number, {
        user: Purchase['user'];
        totalPurchases: number;
        categories: Record<string, number>;
        recentPurchases: number;
        averagePrice: number;
        lastPurchaseDate: string;
    }> = {};

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

async function generateReasonWithGemini(
    productName: string,
    productCategory: string,
    selectedUser: any,
    userStats: Record<number, any>
) {
    try {
        const users = Object.values(userStats);
        const daysSinceLast = Math.floor((new Date().getTime() - new Date(selectedUser.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24));

        const prompt = `
Você é um membro da comunidade "Cave" que está CANSADO de sempre os mesmos contribuírem. Seja DIRETO, ASSERTIVO e até AGRESSIVO - como alguém que está falando a verdade na cara mesmo.

O usuário ${selectedUser.user.name} (@${selectedUser.user.username}) foi selecionado para contribuir com "${productName}" (${productCategory}).

INFORMAÇÕES DO USUÁRIO SELECIONADO:
- Total de contribuições: ${selectedUser.totalPurchases}
- Contribuições recentes (últimos 30 dias): ${selectedUser.recentPurchases}
- Última contribuição: ${new Date(selectedUser.lastPurchaseDate).toLocaleDateString('pt-BR')}
- Dias desde a última contribuição: ${daysSinceLast} dias

CONTEXTO DA COMUNIDADE:
${users.map(user => `
${user.user.name} (@${user.user.username}):
- Total de contribuições: ${user.totalPurchases}
- Contribuições recentes (últimos 30 dias): ${user.recentPurchases}
- Última contribuição: ${new Date(user.lastPurchaseDate).toLocaleDateString('pt-BR')}
`).join('\n')}

TAREFA:
Gere uma mensagem CURTA, AGRESSIVA e DIRETA (máximo 2 frases) explicando por que ${selectedUser.user.name} deve contribuir com "${productName}".

REQUISITOS:
- Mencione o nome do usuário (${selectedUser.user.name})
- Seja assertivo e use tom de cobrança
- Mencione quando foi a última contribuição (${daysSinceLast} dias atrás)
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
        return `Chega de moleza! Hora do ${selectedUser.user.name} contribuir! Ele não contribui há ${daysSinceLast} dias. 💪`;
    }
}

