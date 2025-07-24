import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Username e senha são obrigatórios.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            return NextResponse.json({ error: 'Usuário ou senha inválidos.' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return NextResponse.json({ error: 'Usuário ou senha inválidos.' }, { status: 401 });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return NextResponse.json({ token });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao autenticar.' }, { status: 500 });
    }
} 