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
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: examId } = await params;

        // Fetch the exam with all its nested sections, groups, and questions
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        questionGroups: {
                            include: {
                                questions: {
                                    select: { // Exclude correctAnswer from standard payload so students can't cheat
                                        id: true,
                                        groupId: true,
                                        text: true,
                                        options: true,
                                        marks: true,
                                        audioUrl: true,
                                        imageUrl: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.error('Error fetching exam structure:', error);
        return NextResponse.json({ error: 'Failed to fetch exam structure' }, { status: 500 });
    }
}
