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

// GET - Buscar usuário por ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = verifyToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    try {
        const userId = parseInt(params.id);

        // Verificar se o usuário está tentando buscar outro usuário
        if (user.role !== 'admin' && userId !== user.id) {
            return NextResponse.json({ error: 'Você só pode buscar seus próprios dados.' }, { status: 403 });
        }

        const foundUser = await prisma.user.findUnique({
            where: { id: userId },
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

// PUT - Atualizar usuário específico por ID
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = verifyToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    try {
        const userId = parseInt(params.id);
        const body = await request.json();
        const { name, username, password, image, role } = body;

        // Verificar se o usuário está tentando atualizar outro usuário
        if (user.role !== 'admin' && userId !== user.id) {
            return NextResponse.json({ error: 'Você só pode atualizar seus próprios dados.' }, { status: 403 });
        }

        // Se for admin, pode atualizar qualquer usuário
        // Se não for admin, só pode atualizar a si mesmo
        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (image !== undefined) updateData.image = image;
        if (role !== undefined && user.role === 'admin') updateData.role = role;

        // Se estiver atualizando username, verificar se já existe
        if (username !== undefined) {
            const existingUser = await prisma.user.findUnique({
                where: { username },
            });
            if (existingUser && existingUser.id !== userId) {
                return NextResponse.json({ error: 'Username já existe.' }, { status: 409 });
            }
            updateData.username = username;
        }

        // Se estiver atualizando senha, fazer hash
        if (password !== undefined) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
    }
} 