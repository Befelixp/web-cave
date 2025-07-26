import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(request: NextRequest) {
    try {
        const auth = request.headers.get('authorization');

        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token não fornecido.' }, { status: 401 });
        }

        const token = auth.replace('Bearer ', '');

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return NextResponse.json({ valid: true, user: decoded });
        } catch (error) {
            return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao verificar token.' }, { status: 500 });
    }
} 