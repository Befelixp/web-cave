import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const where = category ? { category } : {};

        const products = await prisma.product.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(products);
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao buscar produtos.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, image, category } = body;

        if (!name) {
            return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                image,
                category,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            // Prisma unique constraint failed
            return NextResponse.json({ error: 'Produto já existe.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Erro ao criar produto.' }, { status: 500 });
    }
}