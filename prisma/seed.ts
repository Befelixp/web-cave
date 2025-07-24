import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const adminPass = process.env.ADMINPASS;
    if (!adminPass) {
        throw new Error('ADMINPASS não definida no .env');
    }
    const password = await bcrypt.hash(adminPass, 10);

    await prisma.user.upsert({
        where: { username: 'beflex' },
        update: {},
        create: {
            name: 'Admin',
            username: 'admin',
            password,
            role: 'admin',
        },
    });

    console.log('Usuário admin criado!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 