import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, username, password, image } = body;

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
                // role será 'user' por padrão
            },
        });

        // Nunca retorne a senha!
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
    }
} 