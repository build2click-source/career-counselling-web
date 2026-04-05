/**
 * O*NET Web Services REST Client
 * Documentation: https://services.onetcenter.org/reference
 */
export class ONetClient {
  private apiKey: string;
  private baseUrl = "https://api-v2.onetcenter.org";

  constructor() {
    this.apiKey = process.env.ONET_API_KEY || "";

    if (!this.apiKey) {
       console.warn("Missing O*NET credentials! Please set ONET_API_KEY in .env");
    }
  }

  private async fetchONet(path: string) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`O*NET API Error (${response.status}): ${err}`);
    }

    return response.json();
  }

  /**
   * Search for occupations by keyword
   */
  async searchOccupations(keyword: string) {
    const raw = await this.fetchONet(`/mnm/search?keyword=${encodeURIComponent(keyword)}`);
    // Normalize V2 API { career: [ {code, title} ] } to V1 frontend format { occupation: [ { occupation: { code, title } } ] }
    if (raw.career) {
      return { occupation: raw.career.map((c: any) => ({ occupation: c })) };
    }
    return raw;
  }

  /**
   * Get RIASEC Interest descriptors for an occupation
   */
  async getInterests(socCode: string) {
    return this.fetchONet(`/online/occupations/${socCode}/details/interests`);
  }

  /**
   * Get Work Style descriptors (mapped to Personality)
   */
  async getWorkStyles(socCode: string) {
    return this.fetchONet(`/online/occupations/${socCode}/details/work_styles`);
  }

  /**
   * Get Ability descriptors (mapped to Cognitive)
   */
  async getAbilities(socCode: string) {
    // Note: O*NET Web Services uses /online/ for detailed abilities usually
    // but /mnm/ (My Next Move) provides a simplified view. 
    // Using /online/ for more granular aptitude mapping.
    return this.fetchONet(`/online/occupations/${socCode}/details/abilities`);
  }

  /**
   * Get general occupation info (title, description)
   */
  async getOccupationDetails(socCode: string) {
    return this.fetchONet(`/online/occupations/${socCode}`);
  }
}

export const onetClient = new ONetClient();
