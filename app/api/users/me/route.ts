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
    const user = verifyToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    try {
        const foundUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                role: true,
                createdAt: true,
            },
        });

        if (!foundUser) {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        }

        return NextResponse.json(foundUser);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar usuário.' }, { status: 500 });
    }
}