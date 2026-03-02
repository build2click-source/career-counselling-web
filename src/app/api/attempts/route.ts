import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Start a new attempt
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { examId } = await request.json();

        if (!examId) {
            return NextResponse.json({ error: 'examId is required' }, { status: 400 });
        }

        const attempt = await prisma.attempt.create({
            data: {
                userId: (session.user as any).id,
                examId,
                isCompleted: false,
            }
        });

        return NextResponse.json(attempt);
    } catch (error) {
        console.error('Error starting attempt:', error);
        return NextResponse.json({ error: 'Failed to start attempt' }, { status: 500 });
    }
}

// Submit an attempt
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { attemptId, responses } = await request.json();

        if (!attemptId || !responses) {
            return NextResponse.json({ error: 'attemptId and responses are required' }, { status: 400 });
        }

        // Verify attempt belongs to user
        const attempt = await prisma.attempt.findUnique({
            where: { id: attemptId }
        });

        if (!attempt || attempt.userId !== (session.user as any).id || attempt.isCompleted) {
            return NextResponse.json({ error: 'Invalid attempt or already completed' }, { status: 400 });
        }

        // Process responses and calculate score
        const processedResponses = [];

        for (const res of responses) {
            // Fetch the actual question to verify the correct answer
            const question = await prisma.question.findUnique({
                where: { id: res.questionId }
            });

            if (question) {
                // Simple string comparison for correctness. In reality, we might need more nuanced grading (trim, lowercase).
                const isCorrect = (question.correctAnswer.trim().toLowerCase() === res.answerText.trim().toLowerCase());
                const marksObtained = isCorrect ? question.marks : 0;

                processedResponses.push({
                    questionId: question.id,
                    answerText: res.answerText,
                    isCorrect,
                    marksObtained
                });
            }
        }

        // Update the attempt with the responses
        const updatedAttempt = await prisma.$transaction(async (prisma) => {
            // Insert all responses
            for (const pr of processedResponses) {
                await prisma.response.create({
                    data: {
                        attemptId,
                        questionId: pr.questionId,
                        answerText: pr.answerText,
                        isCorrect: pr.isCorrect,
                        marksObtained: pr.marksObtained
                    }
                });
            }

            // Mark attempt as completed
            return await prisma.attempt.update({
                where: { id: attemptId },
                data: {
                    isCompleted: true,
                    endTime: new Date(),
                },
                include: {
                    responses: true
                }
            });
        });

        return NextResponse.json(updatedAttempt);
    } catch (error) {
        console.error('Error submitting attempt:', error);
        return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
    }
}
