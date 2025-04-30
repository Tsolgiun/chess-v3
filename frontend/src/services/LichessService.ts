/**
 * Service for interacting with the Lichess API
 */

export interface LichessEvaluation {
  fen: string;
  knodes: number;
  depth: number;
  pvs: Array<{
    moves: string;
    cp?: number;
    mate?: number;
  }>;
}

export class LichessService {
  private static BASE_URL = 'https://lichess.org/api';
  private static RATE_LIMIT_MS = 4000; // Ensure we don't exceed rate limits (15 req/min)
  private static lastRequestTime = 0;

  /**
   * Gets position evaluation from Lichess cloud evaluation API
   * @param fen FEN string of the position to evaluate
   * @param multiPv Number of principal variations to return
   * @returns Evaluation from Lichess or null if the request fails
   */
  static async getPositionEvaluation(fen: string, multiPv: number = 2): Promise<LichessEvaluation | null> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest));
      }
      
      this.lastRequestTime = Date.now();
      
      const response = await fetch(`${this.BASE_URL}/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`);
      
      if (!response.ok) {
        console.warn(`Lichess API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Lichess API:', error);
      return null;
    }
  }
}

export default LichessService;
