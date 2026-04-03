import { Assessment } from '@prisma/client';

export type UserDemographic = 'student_9th_grade' | 'undergraduate' | 'professional';

export class AssessmentFactory {
  /**
   * Factory Method: Dynamically configures the test complexity
   * based on the user demographic.
   */
  static createAssessmentSession(demographic: UserDemographic, baseAssessment: Assessment) {
    let includeCorporateSJT = true;
    let timeLimitBonus = 0;

    switch (demographic) {
      case 'student_9th_grade':
        includeCorporateSJT = false;
        timeLimitBonus = 30; // Extra time for younger students
        break;
      case 'undergraduate':
        includeCorporateSJT = true;
        timeLimitBonus = 10;
        break;
      case 'professional':
        includeCorporateSJT = true;
        timeLimitBonus = 0; // Strict standard time
        break;
    }

    return {
      assessmentId: baseAssessment.id,
      adjustedTimeLimit: baseAssessment.timeLimitMinutes + timeLimitBonus,
      includeCorporateSJT,
      demographicApplied: demographic,
    };
  }
}
