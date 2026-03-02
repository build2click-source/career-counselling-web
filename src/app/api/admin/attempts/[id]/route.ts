import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { id: attemptId } = await params;

        const attempt = await prisma.attempt.findUnique({
            where: {
                id: attemptId,
            },
            include: {
                exam: {
                    select: { title: true }
                },
                user: {
                    select: { email: true }
                },
                responses: {
                    include: {
                        question: true
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        return NextResponse.json(attempt);
    } catch (error) {
        console.error('Error fetching admin attempt details:', error);
        return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
    }
}
