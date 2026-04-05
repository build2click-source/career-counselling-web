import { RawPsychometricScores } from "../patterns/ONetAdapter";

/**
 * Maps O*NET data structures (Interests, Work Styles, Abilities) 
 * into the Career DNA 14-dimensional psychometric vector.
 */
export class ONetMapper {
  
  /**
   * Translates 0-100 scales to our internal 0-5 scale.
   */
  private static scale100to5(score: number): number {
    return Math.round((score / 100) * 5 * 10) / 10;
  }

  /**
   * Translates O*NET Likert-style importance/level scores (1-7) 
   * to our internal 0-5 scale.
   */
  private static scaleTo5(score: number): number {
    // (score - 1) / (7 - 1) * 5
    return Math.round(((score - 1) / 6) * 5 * 10) / 10;
  }

  /**
   * Translates value to a 0-5 scale robustly based on input range.
   */
  private static autoScaleTo5(score: number): number {
     return score <= 7 ? this.scaleTo5(score) : this.scale100to5(score);
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

    // 1. RIASEC (Interests) — typically provided as average/score 1-7 or 0-100
    const interestArr = interests?.element || interests?.interests || [];
    for (const i of interestArr) {
      let val = i.occupational_interest ?? i.score ?? 50; 
      const score = this.autoScaleTo5(val);
      const code = i.interest_code || (i.name ? i.name.charAt(0).toUpperCase() : "X");
      
      switch (code) {
        case 'R': scores.realistic = score; break;
        case 'I': scores.investigative = score; break;
        case 'A': scores.artistic = score; break;
        case 'S': scores.social = score; break;
        case 'E': scores.enterprising = score; break;
        case 'C': scores.conventional = score; break;
      }
    }

    // 2. Personality (from Work Styles)
    const workStylesArr = workStyles?.element || workStyles?.work_styles || [];
    const getS = (name: string) => {
      const found = workStylesArr.find((s: any) => s.name === name);
      if (!found) return 3.5;
      let val = found.importance ?? found.score ?? 50;
      return this.autoScaleTo5(val);
    };

    // Extraversion: Social Orientation + Independence
    scores.extraversion = this.autoScaleTo5((getS('Social Orientation') * 20 + getS('Independence') * 20) / 2);
    // Work Styles map directly over without the x20 if we just do autoScaleTo5, BUT getS already auto-scales!
    // So getS returns 0-5. Let's just average them directly.
    scores.extraversion = Math.round((getS('Social Orientation') + getS('Independence')) / 2 * 10) / 10;
    
    // Agreeableness: Cooperation + Concern for Others
    scores.agreeableness = Math.round((getS('Cooperation') + getS('Concern for Others')) / 2 * 10) / 10;
    
    // Conscientiousness: Attention to Detail + Dependability + Integrity
    scores.conscientiousness = Math.round((getS('Attention to Detail') + getS('Dependability') + getS('Integrity')) / 3 * 10) / 10;
    
    // Neuroticism: Inverse of (Stress Tolerance + Self Control)
    const stability = (getS('Stress Tolerance') + getS('Self Control')) / 2;
    scores.neuroticism = Math.round((5 - stability) * 10) / 10; // High stability = Low neuroticism

    // Openness: Innovation + Analytical Thinking
    scores.openness = Math.round((getS('Innovation') + getS('Analytical Thinking')) / 2 * 10) / 10;

    // 3. Cognitive Aptitudes (Abilities)
    const abilitiesArr = abilities?.element || abilities?.ability || [];
    const findA = (name: string) => {
      const found = abilitiesArr.find((a: any) => a.name === name);
      if (!found) return 0.5;
      let val = found.importance ?? found?.score?.value ?? found?.score ?? 50;
      return val <= 7 ? (val / 7) : (val / 100);
    };

    // Aptitudes are typically normalized to 0-1 metrics internally, so we use findA which returns 0-1
    scores.numericalReasoning = Math.round(findA('Mathematical Reasoning') * 10) / 10;
    scores.verbalReasoning = Math.round(((findA('Oral Comprehension') + findA('Written Comprehension')) / 2) * 10) / 10;
    scores.logicalReasoning = Math.round(findA('Deductive Reasoning') * 10) / 10;

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
