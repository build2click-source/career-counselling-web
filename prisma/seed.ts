const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ielts.com' },
    update: {},
    create: {
      email: 'admin@ielts.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@ielts.com' },
    update: {},
    create: {
      email: 'student@ielts.com',
      password: studentPassword,
      role: 'STUDENT',
    },
  });

  console.log('Created users:', { admin: admin.email, student: student.email });

  // 2. Create Exams (1 Full Mock Test to start)
  const exam = await prisma.exam.create({
    data: {
      title: 'IELTS Academic Mock Test 1',
      description: 'A full-length practice test for the Academic module.',
      timeLimitMinutes: 120, // 60 Reading + 60 Listening + approx
      sections: {
        create: [
          {
            title: 'Listening Section 1',
            order: 1,
            questionGroups: {
              create: [
                {
                  type: 'Multiple Choice',
                  context: 'Listen to the audio and answer the questions.',
                  audioUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3', // Sample audio placeholder
                  questions: {
                    create: [
                      {
                        text: 'What time is the meeting?',
                        options: JSON.stringify(['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM']),
                        correctAnswer: '10:00 AM',
                        marks: 1.0,
                      },
                      {
                        text: 'Where is the meeting taking place?',
                        options: JSON.stringify(['Room A', 'Room B', 'Conference Hall', 'Cafeteria']),
                        correctAnswer: 'Room A',
                        marks: 1.0,
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            title: 'Reading Section 1',
            order: 2,
            questionGroups: {
              create: [
                {
                  type: 'True/False/Not Given',
                  context: 'Read the passage about ancient Rome. The Roman Empire was one of the largest in history...',
                  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Roman_Empire_Trajan_117AD.png', // Sample image placeholder
                  questions: {
                    create: [
                      {
                        text: 'The Roman Empire was the absolute largest empire in history.',
                        options: JSON.stringify(['True', 'False', 'Not Given']),
                        correctAnswer: 'False', // British/Mongol were larger
                        marks: 1.0,
                      },
                      {
                        text: 'The capital of the empire was Rome.',
                        options: JSON.stringify(['True', 'False', 'Not Given']),
                        correctAnswer: 'True',
                        marks: 1.0,
                      }
                    ]
                  }
                },
                {
                  type: 'Fill in the blanks',
                  context: 'Complete the sentences based on the diagram.',
                  questions: {
                    create: [
                      {
                        text: 'The aqueducts were used to transport ____.',
                        options: JSON.stringify([]), // No options because it's fill in the blanks
                        correctAnswer: 'water',
                        marks: 1.0,
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('Created Exam:', exam.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
