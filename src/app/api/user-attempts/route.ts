import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const attempts = await prisma.attempt.findMany({
            where: {
                userId: (session.user as any).id,
                isCompleted: true
            },
            include: {
                exam: {
                    select: {
                        title: true,
                    }
                },
                responses: {
                    select: {
                        marksObtained: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(attempts);
    } catch (error) {
        console.error('Error fetching user attempts:', error);
        return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }
}
