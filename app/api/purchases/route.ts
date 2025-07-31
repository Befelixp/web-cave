import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function getTokenFromHeader(request: NextRequest) {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return auth.replace('Bearer ', '');
}

function verifyToken(request: NextRequest) {
    const token = getTokenFromHeader(request);
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
        return decoded;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Filtrar por usuário se especificado
        const where: Record<string, unknown> = {};
        if (userId) {
            where.userId = parseInt(userId);
        }

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        image: true,
                    }
                }
            },
            orderBy: {
                purchaseDate: 'desc',
            },
        });

        return NextResponse.json(purchases);
    } catch {
        return NextResponse.json({ error: 'Erro ao buscar compras.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { productId, price } = body;

        if (!productId) {
            return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });
        }

        // Verificar se o produto existe
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
        }

        // Criar a compra
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                productId: productId,
                price: price || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        image: true,
                    }
                }
            }
        });

        return NextResponse.json(purchase, { status: 201 });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
            return NextResponse.json({ error: 'Produto ou usuário não encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erro ao criar compra.' }, { status: 500 });
    }
} 