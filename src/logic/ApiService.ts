interface RunEventDTO {
  timeMs: number;
  lane: number;
  type: "HIT" | "MISS";
}

interface RunSubmission {
  songKey: string;
  partKey: string;
  events: RunEventDTO[];
}

interface RunSubmitRequest {
  email: string;
  name: string;
  run: RunSubmission;
}

interface RunValidationResult {
  valid: boolean;
  score: number;
  hitCount: number;
  reason: string | null;
}

export default class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl; // e.g., "https://your-backend.com"
  }

  /**
   * Submit a run to the backend
   * @param runPayload - object with { email, name, run }
   * @returns parsed JSON response
   */
  async submitRun(runPayload: RunSubmitRequest): Promise<RunValidationResult> {
    try {
      console.log(
        "Submitting run payload:",
        JSON.stringify(runPayload, null, 2)
      );
      const response = await fetch(`${this.baseUrl}/runs/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(runPayload),
        //credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Submit run failed:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error submitting run:", err);
      throw err;
    }
  }

  /**
   * Future: Get leaderboard
   */
  async getLeaderboard(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/leaderboard`);
    if (!response.ok) throw new Error("Failed to fetch leaderboard");
    return await response.json();
  }

  /**
   * Future: Create user
   */
  async createUser(userData: unknown): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/createnewuser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Create user failed:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }
}
