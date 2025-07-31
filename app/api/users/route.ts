import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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

function verifyAdmin(request: NextRequest) {
    const token = getTokenFromHeader(request);
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
        if (decoded.role !== 'admin') return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    const admin = verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Apenas admin pode criar usuários.' }, { status: 403 });
    }
    try {
        const body = await request.json();
        const { name, username, password, image, role } = body;

        if (!name || !username || !password) {
            return NextResponse.json({ error: 'Nome, username e senha são obrigatórios.' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            return NextResponse.json({ error: 'Username já existe.' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                username,
                password: hashedPassword,
                image,
                role: role || 'user',
            },
        });

        // Nunca retorne a senha!
        const { password: _password, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (_error) {
        return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, name, username, password, image, role } = body;

        // Verificar se o usuário está tentando atualizar outro usuário
        const targetUserId = id || user.id;

        // Se não for admin e estiver tentando atualizar outro usuário, negar
        if (user.role !== 'admin' && targetUserId !== user.id) {
            return NextResponse.json({ error: 'Você só pode atualizar seus próprios dados.' }, { status: 403 });
        }

        // Se for admin, pode atualizar qualquer usuário
        // Se não for admin, só pode atualizar a si mesmo
        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name;
        if (image !== undefined) updateData.image = image;
        if (role !== undefined && user.role === 'admin') updateData.role = role;

        // Se estiver atualizando username, verificar se já existe
        if (username !== undefined) {
            const existingUser = await prisma.user.findUnique({
                where: { username },
            });
            if (existingUser && existingUser.id !== targetUserId) {
                return NextResponse.json({ error: 'Username já existe.' }, { status: 409 });
            }
            updateData.username = username;
        }

        // Se estiver atualizando senha, fazer hash
        if (password !== undefined) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: updateData,
        });

        // Nunca retorne a senha!
        const { password: _password, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
    }
} 