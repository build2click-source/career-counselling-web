/**
 * O*NET Web Services REST Client
 * Documentation: https://services.onetcenter.org/reference
 */
export class ONetClient {
  private authHeader: string;
  private baseUrl = "https://services.onetcenter.org/ws";

  constructor() {
    const username = process.env.ONET_ACCOUNT_ID;
    const password = process.env.ONET_WEB_SERVICES_PASSWORD;

    if (!username || !password) {
      console.warn("ONET_ACCOUNT_ID and ONET_WEB_SERVICES_PASSWORD must be set for O*NET Integration.");
    }
    
    this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  private async fetchONet(path: string) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: this.authHeader,
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
    return this.fetchONet(`/mnm/search?keyword=${encodeURIComponent(keyword)}`);
  }

  /**
   * Get RIASEC Interest descriptors for an occupation
   */
  async getInterests(socCode: string) {
    return this.fetchONet(`/mnm/careers/${socCode}/interests`);
  }

  /**
   * Get Work Style descriptors (mapped to Personality)
   */
  async getWorkStyles(socCode: string) {
    return this.fetchONet(`/mnm/careers/${socCode}/work_styles`);
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
