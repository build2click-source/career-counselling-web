export interface RawPsychometricScores {
  extraversion: number; // 1-5
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
  numericalReasoning: number; // 0-1
  verbalReasoning: number; // 0-1
  logicalReasoning: number; // 0-1
}

export class ONetAdapter {
  /**
   * Adapter / Facade Pattern: Normalizes raw module scores into an n-dimensional
   * vector space to compute the Euclidean distance against O*NET target vectors.
   */
  static computeEuclideanDistance(
    candidateScores: RawPsychometricScores,
    targetVector: number[]
  ): number {
    // Convert named scores to a numerical array consistent with target vector schema
    const candidateVector = [
      candidateScores.extraversion,
      candidateScores.agreeableness,
      candidateScores.conscientiousness,
      candidateScores.neuroticism,
      candidateScores.openness,
      candidateScores.realistic,
      candidateScores.investigative,
      candidateScores.artistic,
      candidateScores.social,
      candidateScores.enterprising,
      candidateScores.conventional,
      candidateScores.numericalReasoning * 5, // scale 0-1 up to 0-5
      candidateScores.verbalReasoning * 5,
      candidateScores.logicalReasoning * 5,
    ];

    if (candidateVector.length !== targetVector.length) {
      throw new Error('Vector dimension mismatch');
    }

    let sumSquares = 0;
    for (let i = 0; i < candidateVector.length; i++) {
        sumSquares += Math.pow(candidateVector[i] - targetVector[i], 2);
    }

    return Math.sqrt(sumSquares);
  }

  /**
   * Translates mathematically boundless euclidean distances into a normalized 0-100 Fitment Score.
   */
  static toFitmentScore(distance: number, maxPossibleDistance: number = 20): number {
    // Inverse relationship: High distance = Low fitment.
    const rawMatch = 100 - ((distance / maxPossibleDistance) * 100);
    return Math.max(0, Math.min(100, rawMatch)); 
  }
}
