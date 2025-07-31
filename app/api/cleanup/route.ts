import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(_request: NextRequest) {
    try {
        // Calcular a data de 2 meses atrás
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        // Buscar compras antigas para logging
        const oldPurchases = await prisma.purchase.findMany({
            where: {
                purchaseDate: {
                    lt: twoMonthsAgo
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                product: {
                    select: {
                        name: true,
                        category: true
                    }
                }
            }
        });

        // Deletar compras antigas
        const deleteResult = await prisma.purchase.deleteMany({
            where: {
                purchaseDate: {
                    lt: twoMonthsAgo
                }
            }
        });

        // Log das compras deletadas
        console.log(`[CLEANUP] Deletadas ${deleteResult.count} compras antigas (anteriores a ${twoMonthsAgo.toISOString()})`);

        if (oldPurchases.length > 0) {
            console.log('[CLEANUP] Compras deletadas:');
            oldPurchases.forEach(purchase => {
                console.log(`- ${purchase.user.name} (@${purchase.user.username}) comprou ${purchase.product.name} (${purchase.product.category}) em ${purchase.purchaseDate.toISOString()}`);
            });
        }

        return NextResponse.json({
            success: true,
            message: `Limpeza concluída. ${deleteResult.count} compras antigas foram deletadas.`,
            deletedCount: deleteResult.count,
            cutoffDate: twoMonthsAgo.toISOString()
        });

    } catch (error: unknown) {
        console.error('[CLEANUP] Erro durante a limpeza:', error);
        return NextResponse.json({
            error: 'Erro durante a limpeza automática.'
        }, { status: 500 });
    }
}

// Endpoint GET para verificar compras que seriam deletadas (sem deletar)
export async function GET(_request: NextRequest) {
    try {
        // Calcular a data de 2 meses atrás
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        // Buscar compras antigas (apenas para visualização)
        const oldPurchases = await prisma.purchase.findMany({
            where: {
                purchaseDate: {
                    lt: twoMonthsAgo
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                product: {
                    select: {
                        name: true,
                        category: true
                    }
                }
            },
            orderBy: {
                purchaseDate: 'asc'
            }
        });

        return NextResponse.json({
            message: 'Compras que seriam deletadas na próxima limpeza',
            cutoffDate: twoMonthsAgo.toISOString(),
            count: oldPurchases.length,
            purchases: oldPurchases.map(purchase => ({
                id: purchase.id,
                user: purchase.user.name,
                username: purchase.user.username,
                product: purchase.product.name,
                category: purchase.product.category,
                purchaseDate: purchase.purchaseDate.toISOString(),
                price: purchase.price
            }))
        });

    } catch (error: unknown) {
        console.error('[CLEANUP] Erro ao verificar compras antigas:', error);
        return NextResponse.json({
            error: 'Erro ao verificar compras antigas.'
        }, { status: 500 });
    }
} 