import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Função para verificar se o usuário é admin
async function verifyAdmin(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user || user.role !== 'admin') {
            return null;
        }

        return user;
    } catch (_error) {
        return null;
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await verifyAdmin(request);
        if (!admin) {
            return NextResponse.json(
                { error: 'Acesso negado. Apenas administradores podem editar produtos.' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { name, image, category } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Nome do produto é obrigatório.' },
                { status: 400 }
            );
        }

        // Verificar se o produto existe
        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: 'Produto não encontrado.' },
                { status: 404 }
            );
        }

        // Verificar se o novo nome já existe (exceto para o produto atual)
        if (name !== existingProduct.name) {
            const duplicateProduct = await prisma.product.findUnique({
                where: { name }
            });

            if (duplicateProduct) {
                return NextResponse.json(
                    { error: 'Já existe um produto com este nome.' },
                    { status: 409 }
                );
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                name,
                image,
                category,
            },
        });

        return NextResponse.json(updatedProduct);
    } catch (error: unknown) {
        console.error('Erro ao atualizar produto:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar produto.' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await verifyAdmin(request);
        if (!admin) {
            return NextResponse.json(
                { error: 'Acesso negado. Apenas administradores podem deletar produtos.' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Verificar se o produto existe
        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                purchases: true
            }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: 'Produto não encontrado.' },
                { status: 404 }
            );
        }

        // Verificar se há compras associadas ao produto
        if (existingProduct.purchases.length > 0) {
            return NextResponse.json(
                { error: 'Não é possível deletar um produto que possui compras associadas.' },
                { status: 400 }
            );
        }

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json(
            { message: 'Produto deletado com sucesso.' },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error('Erro ao deletar produto:', error);
        return NextResponse.json(
            { error: 'Erro ao deletar produto.' },
            { status: 500 }
        );
    }
} 