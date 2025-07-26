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
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
    }
} 