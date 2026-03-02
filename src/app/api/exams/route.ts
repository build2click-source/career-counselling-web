import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const exams = await prisma.exam.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                timeLimitMinutes: true,
                _count: {
                    select: {
                        sections: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(exams);
    } catch (error) {
        console.error('Error fetching exams:', error);
        return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
    }
}
