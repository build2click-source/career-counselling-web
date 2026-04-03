# Career DNA — Psychometric Career Assessment

This document provides context, database schema details, and development rules for AI assistants working on this repository to help you understand the architecture of the platform.

## 1. Project Overview
**Name**: Career DNA
**Description**: A full-stack psychometric assessment platform designed to map student personality (Big 5), occupational interests (RIASEC), and cognitive aptitude. The platform calculates "Fitment Scores" by comparing a user's multidimensional profile against ideal occupational vectors (O*NET profiles).

## 2. Tech Stack
- **Framework**: Next.js (Version 16.1.6)
- **Language**: TypeScript
- **Database ORM**: Prisma Client (`postgresql` provider)
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js (v4), with `bcrypt` for password hashing
- **Runtime**: Node.js ecosystem

## 3. Database Schema Overview
The database uses PostgreSQL and is managed via Prisma (`prisma/schema.prisma`). Here are the core models and their relationships:

- **User**: Has `email`, `password`, and a `Role` enum (`STUDENT` or `ADMIN`). Can have multiple `Attempt`s.
- **Assessment**: Represents a battery of tests (e.g., "Standard Career Match"). Contains multiple `AssessmentModule`s.
- **AssessmentModule**: Individual test blocks.
  - `type`: E.g., "FFM" (Big 5), "RIASEC", "Cognitive", "Values".
  - `order`: Integer for sequential navigation.
- **Question**: The atomic unit of measurement.
  - `traitDimension`: The target metric (e.g., "Extraversion", "Numerical Reasoning").
  - `scoringPolarity`: "Positive (+)" or "Negative (-)" for personality scaling.
  - `options`: A JSON string array (e.g., Likert 1-5 scales or MCQ choices).
  - `correctAnswer`: Expected exact match for cognitive/SJTs.
  - `isArchived`: Soft-delete flag (Questions are hidden from future tests but preserved for past attempt integrity).
- **Attempt**: Represents a user's session. Links a `User` to an `Assessment`. Tracks `startTime`, optional `endTime`, and a 5-day `sessionExpiry` validity window. 
- **Response**: An individual answer. 
  - `answerText`: Direct choice/text.
  - `scoreValue`: The numerical intensity of the answer (e.g., 1-5 for Likert).
  - `isCorrect`: Boolean evaluation for aptitude questions.
- **OccupationalProfile**: Reference ideal profiles for career matching (based on O*NET).
  - `targetVector`: JSON representing the multidimensional "ideal" score.
- **FitmentScore**: The result of career matching.
  - `euclideanDistance`: Mathematical distance from the ideal profile.
  - `fitmentPercentage`: Scaled 0-100 score.

## 4. Assessment Data Structure
`Assessment` -> `AssessmentModule` (e.g., FFM) -> `Question` (e.g., "I enjoy meeting new people").

**Example configuration for a "Personality" exercise:**
- **Module Type**: `FFM` (Five-Factor Model)
- **Question**: `"I am the life of the party."`
- **Trait Dimension**: `Extraversion`
- **Scoring Polarity**: `Positive (+)` (Rating 5 = High Extraversion)
- **Options**: `["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]`

## 5. Development Guidelines
- **Soft Archiving**: NEVER delete questions from the database if they have associated `Response` records. Use `isArchived: true` instead.
- **Psychometric Scaling**: When fetching responses, check `scoringPolarity`. If negative, the scale might need to be inverted (e.g., 6 - score) for the final dimension tally.
- **Security**: Routes restricted to `ADMIN` must be verified using the user's role from the NextAuth session.
- **Formatting**: Adhere to Tailwind CSS v4 utility classes. Keep the "Career DNA" premium aesthetic (Rounded-full buttons, soft shadows, vibrant orange/slate palette).
