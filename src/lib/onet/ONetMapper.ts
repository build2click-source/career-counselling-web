import { RawPsychometricScores } from "../patterns/ONetAdapter";

/**
 * Maps O*NET data structures (Interests, Work Styles, Abilities) 
 * into the Career DNA 14-dimensional psychometric vector.
 */
export class ONetMapper {
  
  /**
   * Translates O*NET Likert-style importance/level scores (1-7) 
   * to our internal 0-5 scale.
   */
  private static scaleTo5(score: number): number {
    // (score - 1) / (7 - 1) * 5
    return Math.round(((score - 1) / 6) * 5 * 10) / 10;
  }

  /**
   * Processes raw O*NET API responses into a RawPsychometricScores object.
   */
  static mapToVector(interests: any, workStyles: any, abilities: any): RawPsychometricScores {
    const scores: RawPsychometricScores = {
      extraversion: 2.5,
      agreeableness: 2.5,
      conscientiousness: 2.5,
      neuroticism: 2.5,
      openness: 2.5,
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
      numericalReasoning: 0.5,
      verbalReasoning: 0.5,
      logicalReasoning: 0.5,
    };

    // 1. RIASEC (Interests) — typically provided as average/score 1-7
    if (interests?.interests) {
      for (const i of interests.interests) {
        const score = this.scaleTo5(i.occupational_interest || 3);
        switch (i.interest_code) {
          case 'R': scores.realistic = score; break;
          case 'I': scores.investigative = score; break;
          case 'A': scores.artistic = score; break;
          case 'S': scores.social = score; break;
          case 'E': scores.enterprising = score; break;
          case 'C': scores.conventional = score; break;
        }
      }
    }

    // 2. Personality (from Work Styles)
    if (workStyles?.work_styles) {
      const styles = workStyles.work_styles;
      const getS = (name: string) => styles.find((s: any) => s.name === name)?.score || 3.5;

      // Extraversion: Social Orientation + Independence (vaguely related)
      scores.extraversion = this.scaleTo5(getS('Social Orientation'));
      
      // Agreeableness: Cooperation + Concern for Others
      scores.agreeableness = this.scaleTo5((getS('Cooperation') + getS('Concern for Others')) / 2);
      
      // Conscientiousness: Attention to Detail + Dependability + Integrity
      scores.conscientiousness = this.scaleTo5((getS('Attention to Detail') + getS('Dependability') + getS('Integrity')) / 2.5);
      
      // Neuroticism: Inverse of (Stress Tolerance + Self Control)
      const stability = (getS('Stress Tolerance') + getS('Self Control')) / 2;
      scores.neuroticism = 5 - this.scaleTo5(stability); // High stability = Low neuroticism

      // Openness: Innovation + Analytical Thinking
      scores.openness = this.scaleTo5((getS('Innovation') + getS('Analytical Thinking')) / 2);
    }

    // 3. Cognitive Aptitudes (Abilities) — typically provided as Level/Importance (1-7)
    if (abilities?.ability) {
      const abs = abilities.ability;
      const findA = (id: string) => abs.find((a: any) => a.id === id)?.score?.value || 3;

      // Numerical (2.A.1.f: Mathematical Reasoning)
      // Level scores on O*NET are often 0-7. Scaling to 0-1 for our aptitude indicator.
      scores.numericalReasoning = Math.round((findA('2.A.1.f') / 7) * 10) / 10;
      
      // Verbal (2.A.1.a: Oral Comprehension / Written Comprehension)
      scores.verbalReasoning = Math.round((findA('2.A.1.a') / 7) * 10) / 10;
      
      // Logical (2.A.1.b: Deductive Reasoning)
      scores.logicalReasoning = Math.round((findA('2.A.1.b') / 7) * 10) / 10;
    }

    return scores;
  }

  /**
   * Converts the scores object into the flat array used for O*NET matching
   */
  static toTargetVector(scores: RawPsychometricScores): number[] {
    return [
      scores.extraversion,
      scores.agreeableness,
      scores.conscientiousness,
      scores.neuroticism,
      scores.openness,
      scores.realistic,
      scores.investigative,
      scores.artistic,
      scores.social,
      scores.enterprising,
      scores.conventional,
      scores.numericalReasoning * 5,
      scores.verbalReasoning * 5,
      scores.logicalReasoning * 5,
    ];
  }
}
