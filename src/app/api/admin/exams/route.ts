import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const data = await request.json();

        // Data should contain title, description, timeLimitMinutes, and sections array.
        if (!data.title || !data.timeLimitMinutes) {
            return NextResponse.json({ error: 'Title and timeLimitMinutes are required' }, { status: 400 });
        }

        // Creating the exam natively in Prisma with deeply nested writes
        const newExam = await prisma.exam.create({
            data: {
                title: data.title,
                description: data.description,
                timeLimitMinutes: parseInt(data.timeLimitMinutes),
                sections: {
                    create: data.sections?.map((section: any, sIdx: number) => ({
                        title: section.title,
                        order: sIdx + 1,
                        questionGroups: {
                            create: section.questionGroups?.map((group: any) => ({
                                type: group.type,
                                context: group.context,
                                audioUrl: group.audioUrl || null,
                                imageUrl: group.imageUrl || null,
                                questions: {
                                    create: group.questions?.map((q: any) => ({
                                        text: q.text,
                                        options: JSON.stringify(q.options || []),
                                        correctAnswer: q.correctAnswer,
                                        marks: parseFloat(q.marks || 1),
                                        audioUrl: q.audioUrl || null,
                                        imageUrl: q.imageUrl || null,
                                    }))
                                }
                            }))
                        }
                    }))
                }
            },
            include: {
                sections: {
                    include: {
                        questionGroups: {
                            include: {
                                questions: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(newExam);
    } catch (error) {
        console.error('Error creating exam:', error);
        return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
    }
}
