import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Career DNA Assessment Platform...')

  // ─── Seed demo users ────────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('student123', 10)
  const adminPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'student@careerdna.com' },
    update: {},
    create: { email: 'student@careerdna.com', password: studentPassword, role: 'STUDENT' },
  })
  await prisma.user.upsert({
    where: { email: 'admin@careerdna.com' },
    update: {},
    create: { email: 'admin@careerdna.com', password: adminPassword, role: 'ADMIN' },
  })

  console.log('✅ Demo users seeded')

  // ─── Seed O*NET Occupational Profiles ───────────────────────────────────────
  const profiles = [
    { title: 'UX/UI Designer', description: 'Designs digital interfaces by combining empathy and creative problem-solving.', targetVector: JSON.stringify([3.5, 4.2, 3.8, 2.5, 4.5, 2.0, 3.0, 4.8, 3.5, 3.0, 2.5, 3.0, 3.5, 4.0]) },
    { title: 'Product Manager', description: 'Drives product vision using analytical thinking and leadership.', targetVector: JSON.stringify([4.0, 3.5, 4.5, 2.0, 4.0, 2.5, 3.5, 2.5, 3.8, 4.5, 3.5, 4.0, 4.2, 4.5]) },
    { title: 'Data Scientist', description: 'Extracts insights from data using statistics and programming.', targetVector: JSON.stringify([3.0, 3.2, 4.8, 2.0, 4.5, 2.0, 5.0, 2.0, 2.5, 3.5, 3.0, 4.8, 3.8, 5.0]) },
    { title: 'Clinical Psychologist', description: 'Assesses and treats mental health conditions with empathy and scientific rigor.', targetVector: JSON.stringify([3.5, 4.8, 4.2, 3.0, 4.2, 1.5, 4.5, 2.5, 4.8, 3.0, 3.2, 3.5, 4.5, 4.2]) },
    { title: 'Software Engineer', description: 'Builds software systems with logical thinking and precision.', targetVector: JSON.stringify([3.0, 3.0, 4.5, 2.0, 4.0, 3.5, 4.8, 2.5, 2.0, 3.0, 3.5, 4.5, 3.5, 5.0]) },
    { title: 'Chartered Accountant', description: 'Manages financial records and compliance with meticulous detail.', targetVector: JSON.stringify([3.2, 3.0, 4.8, 2.5, 3.5, 3.0, 3.5, 2.0, 2.5, 4.0, 4.8, 5.0, 3.5, 3.8]) },
    { title: 'Entrepreneur', description: 'Builds ventures by combining leadership, risk tolerance, and innovation.', targetVector: JSON.stringify([4.5, 3.5, 4.2, 2.0, 4.5, 3.5, 3.5, 3.5, 3.5, 5.0, 3.0, 3.5, 3.8, 4.0]) },
    { title: 'Graphic Designer', description: 'Creates visual content for communication using artistic sensibility.', targetVector: JSON.stringify([3.0, 3.8, 3.5, 2.0, 4.8, 2.0, 2.5, 5.0, 3.5, 3.0, 2.5, 2.5, 3.5, 3.5]) },
    { title: 'Surgeon', description: 'Performs complex medical procedures requiring precision and composure.', targetVector: JSON.stringify([3.5, 3.5, 5.0, 2.0, 4.0, 4.5, 4.5, 2.5, 3.0, 3.5, 4.0, 4.2, 3.8, 4.5]) },
    { title: 'Management Consultant', description: 'Advises organizations on strategy by synthesizing data and stakeholder needs.', targetVector: JSON.stringify([4.2, 3.8, 4.5, 2.0, 4.0, 3.0, 4.0, 3.0, 3.5, 4.8, 3.8, 4.2, 4.5, 4.5]) },
  ]

  for (const profile of profiles) {
    await prisma.occupationalProfile.upsert({
      where: { title: profile.title },
      update: profile,
      create: profile,
    })
  }
  console.log('✅ 10 Occupational Profiles seeded')

  // ─── Clean old assessment ────────────────────────────────────────────────────
  await prisma.assessment.deleteMany({})

  // ─── Create Full Assessment ──────────────────────────────────────────────────
  const LIKERT_5 = JSON.stringify(["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"])
  const RIASEC_OPTS = JSON.stringify(["Strongly Dislike", "Slightly Dislike", "Neutral", "Slightly Enjoy", "Strongly Enjoy"])
  const VALUES_OPTS = JSON.stringify(["Totally Unimportant", "Unimportant", "Neutral", "Important", "Extremely Important"])

  const assessment = await prisma.assessment.create({
    data: {
      title: 'Career DNA — Comprehensive Psychometric Assessment',
      description: 'A 246-question science-backed assessment covering personality, interests, cognitive aptitude, values, and situational judgement.',
      timeLimitMinutes: 90,
      modules: {
        create: [

          // ═══════════════════════════════════════════════════════════
          // MODULE 1 — Big Five Personality (50 questions)
          // ═══════════════════════════════════════════════════════════
          {
            title: 'Five-Factor Personality Inventory',
            type: 'FFM',
            order: 1,
            questions: {
              create: [
                // EXTRAVERSION (10)
                { text: 'I am the life of the party.', traitDimension: 'Extraversion', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I feel comfortable around people.', traitDimension: 'Extraversion', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I start conversations easily.', traitDimension: 'Extraversion', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I talk to a lot of different people at parties.', traitDimension: 'Extraversion', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I don\'t mind being the center of attention.', traitDimension: 'Extraversion', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I don\'t talk a lot.', traitDimension: 'Extraversion', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I keep in the background.', traitDimension: 'Extraversion', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I have little to say.', traitDimension: 'Extraversion', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I don\'t like to draw attention to myself.', traitDimension: 'Extraversion', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I am quiet around strangers.', traitDimension: 'Extraversion', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                // AGREEABLENESS (10)
                { text: 'I am interested in people.', traitDimension: 'Agreeableness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I sympathize with others\' feelings.', traitDimension: 'Agreeableness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I have a soft heart.', traitDimension: 'Agreeableness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I take time out for others.', traitDimension: 'Agreeableness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I make people feel at ease.', traitDimension: 'Agreeableness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I feel little concern for others.', traitDimension: 'Agreeableness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I insult people.', traitDimension: 'Agreeableness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I am not really interested in others.', traitDimension: 'Agreeableness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I am indifferent to the feelings of others.', traitDimension: 'Agreeableness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I make people feel uncomfortable.', traitDimension: 'Agreeableness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                // CONSCIENTIOUSNESS (10)
                { text: 'I am always prepared.', traitDimension: 'Conscientiousness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I pay attention to details.', traitDimension: 'Conscientiousness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I get chores done right away.', traitDimension: 'Conscientiousness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I follow a schedule.', traitDimension: 'Conscientiousness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I am exacting in my work.', traitDimension: 'Conscientiousness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I leave my belongings around.', traitDimension: 'Conscientiousness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I make a mess of things.', traitDimension: 'Conscientiousness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I often forget to put things back in their proper place.', traitDimension: 'Conscientiousness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I shirk my duties.', traitDimension: 'Conscientiousness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I don\'t see things through.', traitDimension: 'Conscientiousness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                // NEUROTICISM (10)
                { text: 'I get stressed out easily.', traitDimension: 'Neuroticism', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I worry about things.', traitDimension: 'Neuroticism', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I am easily disturbed.', traitDimension: 'Neuroticism', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I get upset easily.', traitDimension: 'Neuroticism', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I change my mood a lot.', traitDimension: 'Neuroticism', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I am relaxed most of the time.', traitDimension: 'Neuroticism', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I seldom feel blue.', traitDimension: 'Neuroticism', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I am not easily bothered by things.', traitDimension: 'Neuroticism', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I am not easily annoyed.', traitDimension: 'Neuroticism', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I rarely get irritated.', traitDimension: 'Neuroticism', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                // OPENNESS (10)
                { text: 'I have a rich vocabulary.', traitDimension: 'Openness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I have a vivid imagination.', traitDimension: 'Openness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I have excellent ideas.', traitDimension: 'Openness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I am quick to understand things.', traitDimension: 'Openness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I spend time reflecting on things.', traitDimension: 'Openness', scoringPolarity: 'Positive (+)', options: LIKERT_5, marks: 1 },
                { text: 'I am not interested in abstract ideas.', traitDimension: 'Openness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I do not have a good imagination.', traitDimension: 'Openness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I have difficulty understanding abstract ideas.', traitDimension: 'Openness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I avoid difficult reading material.', traitDimension: 'Openness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
                { text: 'I do not enjoy going to art museums.', traitDimension: 'Openness', scoringPolarity: 'Negative (-)', options: LIKERT_5, marks: 1 },
              ],
            },
          },

          // ═══════════════════════════════════════════════════════════
          // MODULE 2 — RIASEC Interests (48 questions, 8 per type)
          // ═══════════════════════════════════════════════════════════
          {
            title: 'Occupational Interests Profiler (RIASEC)',
            type: 'RIASEC',
            order: 2,
            questions: {
              create: [
                // REALISTIC (8)
                { text: 'Build kitchen cabinets.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Lay brick or tile.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Repair electrical wiring.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Drive a truck or heavy vehicle.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Test the quality of parts before shipment.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Assemble electronic components.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Operate heavy machinery.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Work on an outdoor agriculture project.', traitDimension: 'Realistic', options: RIASEC_OPTS, marks: 1 },
                // INVESTIGATIVE (8)
                { text: 'Study the structure of the human body.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                { text: 'Conduct chemical experiments.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                { text: 'Study animal behaviour in the wild.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                { text: 'Develop a new medical drug or treatment.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                { text: 'Work in a research laboratory.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                { text: 'Investigate a crime using forensic methods.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                { text: 'Analyse data from a scientific study.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                { text: 'Read scientific or technical journals.', traitDimension: 'Investigative', options: RIASEC_OPTS, marks: 1 },
                // ARTISTIC (8)
                { text: 'Write short stories or poems.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Design clothing or accessories.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Perform in a play or musical.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Compose or arrange music.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Draw or paint pictures.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Direct a film or theatre production.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Create a website or digital art.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                { text: 'Photograph people, landscapes, or events.', traitDimension: 'Artistic', options: RIASEC_OPTS, marks: 1 },
                // SOCIAL (8)
                { text: 'Teach children how to read.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                { text: 'Help people with personal or emotional problems.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                { text: 'Volunteer at a community organization.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                { text: 'Conduct a group training session.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                { text: 'Care for children or the elderly.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                { text: 'Provide first aid at community events.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                { text: 'Organize a charity fundraiser.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                { text: 'Counsel students on career choices.', traitDimension: 'Social', options: RIASEC_OPTS, marks: 1 },
                // ENTERPRISING (8)
                { text: 'Manage a retail store.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                { text: 'Start and operate your own business.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                { text: 'Negotiate a contract or deal.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                { text: 'Market a new product.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                { text: 'Campaign for a political cause.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                { text: 'Make a speech to a large group.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                { text: 'Supervise and manage a team.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                { text: 'Represent a client in a sales meeting.', traitDimension: 'Enterprising', options: RIASEC_OPTS, marks: 1 },
                // CONVENTIONAL (8)
                { text: 'Keep the financial records for a business.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
                { text: 'Calculate and file taxes.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
                { text: 'Manage a filing system or database.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
                { text: 'Proofread documents for errors.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
                { text: 'Operate office machinery.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
                { text: 'Inventory supplies using a computer.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
                { text: 'Process payroll for a company.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
                { text: 'Schedule appointments and meetings.', traitDimension: 'Conventional', options: RIASEC_OPTS, marks: 1 },
              ],
            },
          },

          // ═══════════════════════════════════════════════════════════
          // MODULE 3 — Cognitive Aptitude (40 questions)
          // ═══════════════════════════════════════════════════════════
          {
            title: 'Cognitive Abilities & Professional Aptitude',
            type: 'Cognitive',
            order: 3,
            questions: {
              create: [
                // NUMERICAL REASONING (14)
                { text: 'Solve without a calculator: 8 ÷ 0.4 = ?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["2", "20", "0.5", "3.2"]), correctAnswer: "20", marks: 1 },
                { text: 'If 3x + 7 = 22, what is x?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["3", "4", "5", "6"]), correctAnswer: "5", marks: 1 },
                { text: 'A shirt costs ₹800 after a 20% discount. What was the original price?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["₹960", "₹1000", "₹1050", "₹1100"]), correctAnswer: "₹1000", marks: 1 },
                { text: 'What is 15% of 240?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["30", "36", "40", "42"]), correctAnswer: "36", marks: 1 },
                { text: 'A train travels 120 km in 90 minutes. What is its speed in km/h?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["60", "80", "90", "100"]), correctAnswer: "80", marks: 1 },
                { text: 'If A:B = 3:5 and B:C = 2:3, what is A:C?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["2:5", "2:3", "6:15", "1:3"]), correctAnswer: "2:5", marks: 1 },
                { text: 'The average of 5 numbers is 18. If four of the numbers are 15, 20, 12, and 25, what is the fifth?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["16", "18", "20", "22"]), correctAnswer: "18", marks: 1 },
                { text: 'What is the next number in the series: 2, 6, 18, 54, ?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["108", "144", "162", "216"]), correctAnswer: "162", marks: 1 },
                { text: 'A retailer marks up a product by 40% and then offers a 10% discount. What is the net profit %?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["26%", "30%", "32%", "28%"]), correctAnswer: "26%", marks: 1 },
                { text: 'If p = 4, q = 3, what is p² + 2pq + q²?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["25", "49", "36", "42"]), correctAnswer: "49", marks: 1 },
                { text: 'A pipe fills a tank in 6 hours. Another drains it in 8 hours. How long to fill the tank if both are open?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["20 hours", "24 hours", "18 hours", "22 hours"]), correctAnswer: "24 hours", marks: 1 },
                { text: 'What is 7/8 expressed as a percentage?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["82.5%", "87%", "87.5%", "88%"]), correctAnswer: "87.5%", marks: 1 },
                { text: 'Simple interest on ₹5000 at 8% per year for 3 years = ?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["₹1000", "₹1200", "₹1500", "₹1800"]), correctAnswer: "₹1200", marks: 1 },
                { text: 'If 20 workers complete a job in 15 days, how many days for 12 workers?', traitDimension: 'Numerical Reasoning', options: JSON.stringify(["20", "25", "28", "30"]), correctAnswer: "25", marks: 1 },
                // VERBAL REASONING (13)
                { text: 'Complete the analogy — CUP : LIP :: BIRD : ?', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["GRASS", "FOREST", "BEAK", "BUSH"]), correctAnswer: "BEAK", marks: 1 },
                { text: 'Choose the word most opposite to LOQUACIOUS.', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Talkative", "Silent", "Energetic", "Hostile"]), correctAnswer: "Silent", marks: 1 },
                { text: 'All roses are flowers. Some flowers fade quickly. Therefore:', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["All roses fade quickly", "Some roses may fade quickly", "No roses fade", "Some flowers are roses"]), correctAnswer: "Some roses may fade quickly", marks: 1 },
                { text: 'Choose the correctly spelled word.', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Accomodate", "Accommodate", "Acommodate", "Acomodate"]), correctAnswer: "Accommodate", marks: 1 },
                { text: 'Choose the word that means the same as EPHEMERAL.', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Permanent", "Transient", "Expensive", "External"]), correctAnswer: "Transient", marks: 1 },
                { text: '"Break the ice" means:', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["To destroy something frozen", "To initiate a conversation in a tense situation", "To reveal a secret", "To break a promise"]), correctAnswer: "To initiate a conversation in a tense situation", marks: 1 },
                { text: 'DOCTOR : PATIENT :: LAWYER : ?', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Court", "Judge", "Client", "Jury"]), correctAnswer: "Client", marks: 1 },
                { text: 'Select the odd one out: Violin, Guitar, Piano, Flute, Tabla', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Violin", "Piano", "Flute", "Tabla"]), correctAnswer: "Flute", marks: 1 },
                { text: 'Which word does NOT belong: Apple, Mango, Potato, Banana?', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Apple", "Mango", "Potato", "Banana"]), correctAnswer: "Potato", marks: 1 },
                { text: 'The passage implies that early specialization in career counselling...', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Leads to regret", "Improves career satisfaction", "Is irrelevant to success", "Should be avoided"]), correctAnswer: "Improves career satisfaction", marks: 1 },
                { text: 'Complete the sentence: Despite his best efforts, the project _____ short of expectations.', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["fell", "failed", "dropped", "went"]), correctAnswer: "fell", marks: 1 },
                { text: 'Select the antonym of BENEVOLENT:', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Kind", "Malevolent", "Generous", "Caring"]), correctAnswer: "Malevolent", marks: 1 },
                { text: 'BOON : BANE :: FRIEND : ?', traitDimension: 'Verbal Reasoning', options: JSON.stringify(["Enemy", "Companion", "Acquaintance", "Rival"]), correctAnswer: "Enemy", marks: 1 },
                // LOGICAL REASONING (13)
                { text: 'What is the missing letter in: W, S, O, K, ?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["F", "G", "H", "I"]), correctAnswer: "G", marks: 1 },
                { text: 'All A are B. Some B are C. Therefore:', traitDimension: 'Logical Reasoning', options: JSON.stringify(["All A are C", "Some A are C", "No A are C", "None can be determined"]), correctAnswer: "None can be determined", marks: 1 },
                { text: 'In a row, A is 7th from the left and 11th from the right. How many people are in the row?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["16", "17", "18", "19"]), correctAnswer: "17", marks: 1 },
                { text: 'Find the odd one out: 3, 5, 7, 9, 11', traitDimension: 'Logical Reasoning', options: JSON.stringify(["3", "9", "11", "5"]), correctAnswer: "9", marks: 1 },
                { text: 'If FRIEND is coded as GSJFOE, how is ENEMY coded?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["FOFNZ", "FOGMZ", "FNFOZ", "GOFNZ"]), correctAnswer: "FOFNZ", marks: 1 },
                { text: 'A clock shows 3:15. What is the angle between the hour and minute hand?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["0°", "7.5°", "15°", "22.5°"]), correctAnswer: "7.5°", marks: 1 },
                { text: 'Which number should replace ?: 4, 9, 16, 25, ?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["30", "35", "36", "49"]), correctAnswer: "36", marks: 1 },
                { text: 'Today is Tuesday. What day will it be 100 days from now?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday"]), correctAnswer: "Wednesday", marks: 1 },
                { text: 'A man walks 4 km North, then 3 km East. How far is he from the start?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["5 km", "6 km", "7 km", "4 km"]), correctAnswer: "5 km", marks: 1 },
                { text: 'If in a certain code, 246 means "good sweet fruit" and 843 means "sweet water fruit", what is "good"?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["2", "4", "6", "8"]), correctAnswer: "2", marks: 1 },
                { text: 'Find the pattern: 1, 4, 9, 16, ?, 36', traitDimension: 'Logical Reasoning', options: JSON.stringify(["20", "25", "27", "28"]), correctAnswer: "25", marks: 1 },
                { text: 'If South is East, then West is?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["North", "South", "East", "West"]), correctAnswer: "North", marks: 1 },
                { text: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. What is A to D?', traitDimension: 'Logical Reasoning', options: JSON.stringify(["Grandmother", "Granddaughter", "Daughter", "Great-granddaughter"]), correctAnswer: "Granddaughter", marks: 1 },
              ],
            },
          },

          // ═══════════════════════════════════════════════════════════
          // MODULE 4 — Work Values & Motivations (40 questions)
          // ═══════════════════════════════════════════════════════════
          {
            title: 'Work Values & Intrinsic Motivators',
            type: 'Values',
            order: 4,
            questions: {
              create: [
                { text: 'Having complete job security and stability.', traitDimension: 'Stability', options: VALUES_OPTS, marks: 1 },
                { text: 'Earning a high salary and financial rewards.', traitDimension: 'Material Reward', options: VALUES_OPTS, marks: 1 },
                { text: 'Continuously learning new skills and knowledge.', traitDimension: 'Learning', options: VALUES_OPTS, marks: 1 },
                { text: 'Working in an environment with creative freedom.', traitDimension: 'Creativity', options: VALUES_OPTS, marks: 1 },
                { text: 'Making a meaningful contribution to society.', traitDimension: 'Altruism', options: VALUES_OPTS, marks: 1 },
                { text: 'Having authority and influence over important decisions.', traitDimension: 'Influence', options: VALUES_OPTS, marks: 1 },
                { text: 'Being recognized and appreciated for your work.', traitDimension: 'Recognition', options: VALUES_OPTS, marks: 1 },
                { text: 'Having flexible working hours and autonomy.', traitDimension: 'Autonomy', options: VALUES_OPTS, marks: 1 },
                { text: 'Working in a team-oriented, collaborative environment.', traitDimension: 'Teamwork', options: VALUES_OPTS, marks: 1 },
                { text: 'Tackling intellectually stimulating problems.', traitDimension: 'Intellectual Challenge', options: VALUES_OPTS, marks: 1 },
                { text: 'Having a clear and predictable work structure.', traitDimension: 'Stability', options: VALUES_OPTS, marks: 1 },
                { text: 'Receiving regular performance-based bonuses.', traitDimension: 'Material Reward', options: VALUES_OPTS, marks: 1 },
                { text: 'Attending training programs and workshops.', traitDimension: 'Learning', options: VALUES_OPTS, marks: 1 },
                { text: 'Creating original products or artistic outputs.', traitDimension: 'Creativity', options: VALUES_OPTS, marks: 1 },
                { text: 'Helping underprivileged communities.', traitDimension: 'Altruism', options: VALUES_OPTS, marks: 1 },
                { text: 'Leading and motivating a team.', traitDimension: 'Influence', options: VALUES_OPTS, marks: 1 },
                { text: 'Receiving public awards or media recognition.', traitDimension: 'Recognition', options: VALUES_OPTS, marks: 1 },
                { text: 'Deciding how and when to complete your work.', traitDimension: 'Autonomy', options: VALUES_OPTS, marks: 1 },
                { text: 'Building close working relationships with colleagues.', traitDimension: 'Teamwork', options: VALUES_OPTS, marks: 1 },
                { text: 'Solving problems that have no known solution.', traitDimension: 'Intellectual Challenge', options: VALUES_OPTS, marks: 1 },
                { text: 'Guaranteed pension and retirement benefits.', traitDimension: 'Stability', options: VALUES_OPTS, marks: 1 },
                { text: 'Profit sharing and stock options.', traitDimension: 'Material Reward', options: VALUES_OPTS, marks: 1 },
                { text: 'Earning a higher academic qualification.', traitDimension: 'Learning', options: VALUES_OPTS, marks: 1 },
                { text: 'Designing innovative solutions to old problems.', traitDimension: 'Creativity', options: VALUES_OPTS, marks: 1 },
                { text: 'Working for a non-profit or social cause.', traitDimension: 'Altruism', options: VALUES_OPTS, marks: 1 },
                { text: 'Shaping company strategy and vision.', traitDimension: 'Influence', options: VALUES_OPTS, marks: 1 },
                { text: 'Being promoted quickly through the ranks.', traitDimension: 'Recognition', options: VALUES_OPTS, marks: 1 },
                { text: 'Working remotely on your own schedule.', traitDimension: 'Autonomy', options: VALUES_OPTS, marks: 1 },
                { text: 'Collaborating across departments.', traitDimension: 'Teamwork', options: VALUES_OPTS, marks: 1 },
                { text: 'Doing cutting-edge research.', traitDimension: 'Intellectual Challenge', options: VALUES_OPTS, marks: 1 },
                { text: 'Knowing your job cannot be eliminated easily.', traitDimension: 'Stability', options: VALUES_OPTS, marks: 1 },
                { text: 'Earning more than your peers.', traitDimension: 'Material Reward', options: VALUES_OPTS, marks: 1 },
                { text: 'Cross-training in multiple roles.', traitDimension: 'Learning', options: VALUES_OPTS, marks: 1 },
                { text: 'Expressing unique personal ideas.', traitDimension: 'Creativity', options: VALUES_OPTS, marks: 1 },
                { text: 'Improving access to education or healthcare.', traitDimension: 'Altruism', options: VALUES_OPTS, marks: 1 },
                { text: 'Having a decisive voice in hiring and firing.', traitDimension: 'Influence', options: VALUES_OPTS, marks: 1 },
                { text: 'Being featured in industry publications.', traitDimension: 'Recognition', options: VALUES_OPTS, marks: 1 },
                { text: 'Setting your own performance targets.', traitDimension: 'Autonomy', options: VALUES_OPTS, marks: 1 },
                { text: 'Building a high-performing team culture.', traitDimension: 'Teamwork', options: VALUES_OPTS, marks: 1 },
                { text: 'Working on unsolved scientific problems.', traitDimension: 'Intellectual Challenge', options: VALUES_OPTS, marks: 1 },
              ],
            },
          },

          // ═══════════════════════════════════════════════════════════
          // MODULE 5 — SJT & VARK (30 questions)
          // ═══════════════════════════════════════════════════════════
          {
            title: 'Situational Judgement & Learning Styles',
            type: 'SJT',
            order: 5,
            questions: {
              create: [
                // SJT (20)
                {
                  text: 'Your manager assigns a high-priority project, but you are mentoring a junior colleague on a critical deadline. You would:',
                  traitDimension: 'Leadership',
                  options: JSON.stringify(["Decline the new project", "Accept and drop the mentoring immediately", "Accept and give the colleague controlled autonomy with daily check-ins", "Ask the manager to assign the project to someone else"]),
                  correctAnswer: "Accept and give the colleague controlled autonomy with daily check-ins",
                  marks: 1,
                },
                {
                  text: 'During a presentation, a colleague contradicts your data publicly. You would:',
                  traitDimension: 'Conflict Resolution',
                  options: JSON.stringify(["Argue back immediately", "Ignore the comment and continue", "Acknowledge the point, note you will discuss after the presentation", "Stop the presentation and defend your data"]),
                  correctAnswer: "Acknowledge the point, note you will discuss after the presentation",
                  marks: 1,
                },
                {
                  text: 'You notice a team member consistently missing deadlines. You would:',
                  traitDimension: 'Team Dynamics',
                  options: JSON.stringify(["Report them to HR immediately", "Do their work for them", "Have a private, supportive conversation to understand the issue", "Announce the issue in the next team meeting"]),
                  correctAnswer: "Have a private, supportive conversation to understand the issue",
                  marks: 1,
                },
                {
                  text: 'You receive credit for a project that was mostly done by your team. You would:',
                  traitDimension: 'Integrity',
                  options: JSON.stringify(["Accept the credit gratefully", "Publicly acknowledge and redirect the credit to the team", "Privately tell your manager", "Say nothing — it balances out over time"]),
                  correctAnswer: "Publicly acknowledge and redirect the credit to the team",
                  marks: 1,
                },
                {
                  text: 'Your company asks you to implement a policy you personally disagree with. You would:',
                  traitDimension: 'Professionalism',
                  options: JSON.stringify(["Refuse to implement it", "Implement it while formally voicing concerns through proper channels", "Implement it and say nothing", "Leak the policy to the press"]),
                  correctAnswer: "Implement it while formally voicing concerns through proper channels",
                  marks: 1,
                },
                {
                  text: 'You made a significant error that cost the company money. You would:',
                  traitDimension: 'Accountability',
                  options: JSON.stringify(["Blame it on a team member", "Proactively disclose the error and propose a corrective plan", "Wait to see if anyone notices", "Quietly try to fix it without telling anyone"]),
                  correctAnswer: "Proactively disclose the error and propose a corrective plan",
                  marks: 1,
                },
                {
                  text: 'A client is furious about a delay that was not your fault. You would:',
                  traitDimension: 'Client Management',
                  options: JSON.stringify(["Explain it wasn't your fault", "Apologize genuinely and offer a compensating solution", "Escalate to your manager immediately", "Promise a timeline you can't keep"]),
                  correctAnswer: "Apologize genuinely and offer a compensating solution",
                  marks: 1,
                },
                {
                  text: 'You are asked to cut staff by 20% to meet cost targets. You would:',
                  traitDimension: 'Decision Making',
                  options: JSON.stringify(["Refuse to do it", "Identify inefficiencies first and propose alternative cost-saving measures", "Cut the 20% immediately", "Ask senior management to decide for you"]),
                  correctAnswer: "Identify inefficiencies first and propose alternative cost-saving measures",
                  marks: 1,
                },
                {
                  text: 'A new colleague with less experience is promoted over you. You would:',
                  traitDimension: 'Resilience',
                  options: JSON.stringify(["Resign immediately", "Seek feedback to understand the decision and focus on your growth", "Complain to HR", "Become disengaged from your work"]),
                  correctAnswer: "Seek feedback to understand the decision and focus on your growth",
                  marks: 1,
                },
                {
                  text: 'Two key team members have a serious personal conflict affecting work. As their manager, you would:',
                  traitDimension: 'Conflict Resolution',
                  options: JSON.stringify(["Separate them into different teams", "Mediate a structured conversation between both parties", "Tell them to resolve it themselves", "Issue a formal warning to both"]),
                  correctAnswer: "Mediate a structured conversation between both parties",
                  marks: 1,
                },
                {
                  text: 'You are given an extremely tight deadline that seems impossible. You would:',
                  traitDimension: 'Time Management',
                  options: JSON.stringify(["Agree without question", "Immediately communicate the risks and negotiate a realistic scope", "Work 24 hours straight and deliver something", "Decline the task"]),
                  correctAnswer: "Immediately communicate the risks and negotiate a realistic scope",
                  marks: 1,
                },
                {
                  text: 'You discover a colleague is falsifying expense reports. You would:',
                  traitDimension: 'Integrity',
                  options: JSON.stringify(["Ignore it — not your problem", "Confront the colleague directly and give them a chance to self-report", "Report it directly to finance/HR", "Tell other colleagues"]),
                  correctAnswer: "Report it directly to finance/HR",
                  marks: 1,
                },
                {
                  text: 'Your team has different opinions on the best technical approach. You would:',
                  traitDimension: 'Collaboration',
                  options: JSON.stringify(["Decide unilaterally", "Facilitate a structured discussion and make an evidence-based decision", "Vote and go with the majority", "Defer to the most senior person"]),
                  correctAnswer: "Facilitate a structured discussion and make an evidence-based decision",
                  marks: 1,
                },
                {
                  text: 'You are assigned a project outside your area of expertise. You would:',
                  traitDimension: 'Learning Agility',
                  options: JSON.stringify(["Refuse the project", "Accept and immediately begin learning the domain while seeking mentors", "Accept and fake your way through", "Ask for help from a more qualified colleague"]),
                  correctAnswer: "Accept and immediately begin learning the domain while seeking mentors",
                  marks: 1,
                },
                {
                  text: 'A top performer on your team is considering leaving for a competitor. You would:',
                  traitDimension: 'Leadership',
                  options: JSON.stringify(["Say nothing and let them go", "Understand their frustrations and explore solutions internally", "Immediately offer them a raise", "Report it to HR"]),
                  correctAnswer: "Understand their frustrations and explore solutions internally",
                  marks: 1,
                },
                {
                  text: 'You are working on a group project and realize the team is going in the wrong direction. You would:',
                  traitDimension: 'Proactivity',
                  options: JSON.stringify(["Keep working without saying anything", "Raise the concern clearly and constructively to the group", "Stop working until the direction is correct", "Tell the manager privately"]),
                  correctAnswer: "Raise the concern clearly and constructively to the group",
                  marks: 1,
                },
                {
                  text: 'You have three urgent tasks and insufficient time to complete all. You would:',
                  traitDimension: 'Prioritization',
                  options: JSON.stringify(["Work on all three simultaneously", "Prioritize by impact and deadline, and communicate trade-offs upward", "Ask a colleague to do all three", "Rush through all three at lower quality"]),
                  correctAnswer: "Prioritize by impact and deadline, and communicate trade-offs upward",
                  marks: 1,
                },
                {
                  text: 'A stakeholder keeps changing requirements mid-project. You would:',
                  traitDimension: 'Stakeholder Management',
                  options: JSON.stringify(["Accept every change", "Implement a formal change request process and document impact on scope", "Refuse all changes", "Escalate to your manager"]),
                  correctAnswer: "Implement a formal change request process and document impact on scope",
                  marks: 1,
                },
                {
                  text: 'You are asked to give critical feedback to a senior colleague. You would:',
                  traitDimension: 'Communication',
                  options: JSON.stringify(["Avoid giving feedback", "Prepare specific, evidence-based points and share privately and professionally", "Share it in the next team meeting", "Email the feedback so there is a record"]),
                  correctAnswer: "Prepare specific, evidence-based points and share privately and professionally",
                  marks: 1,
                },
                {
                  text: 'You are deeply burnt out but your team is depending on you. You would:',
                  traitDimension: 'Self-Awareness',
                  options: JSON.stringify(["Power through indefinitely", "Acknowledge the burnout, take a short recovery break, and plan sustainable workload", "Quit suddenly", "Pretend everything is fine"]),
                  correctAnswer: "Acknowledge the burnout, take a short recovery break, and plan sustainable workload",
                  marks: 1,
                },
                // VARK (10)
                { text: 'When learning a new software tool, you prefer to:', traitDimension: 'VARK', options: JSON.stringify(["Watch a video tutorial", "Read the documentation first", "Jump in and experiment hands-on", "Discuss it with someone who already knows"]), marks: 1 },
                { text: 'When preparing for an important presentation, you:', traitDimension: 'VARK', options: JSON.stringify(["Create visual slides with diagrams", "Write detailed speaker notes", "Practice out loud repeatedly", "Draw a mind-map of the key ideas"]), marks: 1 },
                { text: 'When you need to remember a complex process, you:', traitDimension: 'VARK', options: JSON.stringify(["Watch someone demonstrate it", "Read step-by-step instructions", "Do it yourself once to remember", "Explain it to someone else"]), marks: 1 },
                { text: 'In a meeting, you absorb information best when:', traitDimension: 'VARK', options: JSON.stringify(["There are slides and visuals", "A written agenda is provided", "You take hands-on notes yourself", "There is open group discussion"]), marks: 1 },
                { text: 'You study most effectively by:', traitDimension: 'VARK', options: JSON.stringify(["Using colour-coded mind-maps", "Reading and re-reading the textbook", "Taking practice tests", "Discussing with a study group"]), marks: 1 },
                { text: 'When giving someone directions, you prefer to:', traitDimension: 'VARK', options: JSON.stringify(["Draw a map", "Write out step-by-step directions", "Walk them there physically", "Describe landmarks verbally"]), marks: 1 },
                { text: 'When encountering a new concept, you first:', traitDimension: 'VARK', options: JSON.stringify(["Look for a diagram or chart", "Read an explanation", "Try to apply it immediately", "Ask someone to explain it"]), marks: 1 },
                { text: 'For a subject you find difficult, you would:', traitDimension: 'VARK', options: JSON.stringify(["Watch educational videos", "Hire a tutor and take notes", "Do many practice problems", "Form a study group"]), marks: 1 },
                { text: 'When solving a complex problem at work, you prefer to:', traitDimension: 'VARK', options: JSON.stringify(["Sketch it out visually", "Write a structured analysis", "Build a prototype or mock-up", "Brainstorm verbally with colleagues"]), marks: 1 },
                { text: 'When buying a new device, you:', traitDimension: 'VARK', options: JSON.stringify(["Watch unboxing/review videos", "Read the full product manual", "Set it up and figure it out", "Call support and ask questions"]), marks: 1 },
              ],
            },
          },
        ],
      },
    },
  })

  console.log(`✅ Full Assessment seeded with ID: ${assessment.id}`)
  console.log('📊 Total questions seeded: 50 + 48 + 40 + 40 + 30 = 208 questions')
  console.log('\n🔑 Demo credentials:')
  console.log('   Student: student@careerdna.com / student123')
  console.log('   Admin:   admin@careerdna.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
