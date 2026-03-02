import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const attempts = await prisma.attempt.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    }
                },
                exam: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                responses: true
            }
        });

        return NextResponse.json(attempts);
    } catch (error) {
        console.error('Error fetching admin attempts:', error);
        return NextResponse.json({ error: 'Failed to fetch attempts list' }, { status: 500 });
    }
}
