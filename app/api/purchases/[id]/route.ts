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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = verifyToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    try {
        const resolvedParams = await params;
        const purchaseId = parseInt(resolvedParams.id);

        if (isNaN(purchaseId)) {
            return NextResponse.json({ error: 'ID da compra inválido.' }, { status: 400 });
        }

        // Buscar a compra para verificar se pertence ao usuário
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        if (!purchase) {
            return NextResponse.json({ error: 'Compra não encontrada.' }, { status: 404 });
        }

        // Verificar se o usuário é o dono da compra ou é admin
        if (purchase.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Você não tem permissão para deletar esta compra.' }, { status: 403 });
        }

        // Deletar a compra
        await prisma.purchase.delete({
            where: { id: purchaseId }
        });

        return NextResponse.json({ message: 'Compra deletada com sucesso.' });
    } catch (error: any) {
        console.error('Erro ao deletar compra:', error);
        return NextResponse.json({ error: 'Erro ao deletar compra.' }, { status: 500 });
    }
} 