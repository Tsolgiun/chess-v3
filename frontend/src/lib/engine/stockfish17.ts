/**
 * Interface for Stockfish 17 engine
 */

export interface PositionEvaluationLine {
  depth: number;
  cp?: number;
  mate?: number;
  pv: string[];
}

export interface PositionEvaluation {
  lines: PositionEvaluationLine[];
}

export interface EvaluatePositionOptions {
  fen: string;
  depth: number;
  multiPv: number;
  setPartialEval: (positionEval: PositionEvaluation) => void;
}

export interface Stockfish17Engine {
  evaluatePositionWithUpdate: (options: EvaluatePositionOptions) => Promise<void>;
  getEngineNextMove: (fen: string, skillLevel: number, depth: number) => Promise<string | null>;
  stopSearch: () => void;
  shutdown: () => void;
}

/**
 * Worker pool for managing multiple Stockfish engine instances
 */
export class StockfishWorkerPool {
  private workers: Stockfish17Engine[] = [];
  private maxWorkers: number;
  private initialized = false;
  private currentWorkerIndex = 0;

  constructor(maxWorkers = 4) {
    this.maxWorkers = Math.max(1, Math.min(maxWorkers, 8)); // Between 1 and 8 workers
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log(`Initializing worker pool with ${this.maxWorkers} workers...`);
      
      // Create workers in parallel
      const workerPromises = Array(this.maxWorkers)
        .fill(null)
        .map(() => Stockfish17.create(false).catch(err => {
          console.warn('Failed to create worker with standard config, trying fallback:', err);
          return Stockfish17.create(true); // Try lite version as fallback
        }));
      
      this.workers = await Promise.all(workerPromises);
      this.initialized = true;
      console.log(`Worker pool initialized with ${this.workers.length} workers`);
    } catch (error) {
      console.error('Failed to initialize worker pool:', error);
      throw new Error('Failed to initialize Stockfish worker pool');
    }
  }

  getNextWorker(): Stockfish17Engine {
    if (!this.initialized || this.workers.length === 0) {
      throw new Error('Worker pool not initialized');
    }
    
    // Round-robin worker selection
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  shutdown(): void {
    console.log('Shutting down worker pool...');
    this.workers.forEach(worker => worker.shutdown());
    this.workers = [];
    this.initialized = false;
    this.currentWorkerIndex = 0;
  }
}

/**
 * Analyze a position with timeout
 */
export async function analyzePositionWithTimeout(
  worker: Stockfish17Engine,
  fen: string,
  depth: number,
  multiPv: number = 2,
  timeoutMs: number = 10000
): Promise<PositionEvaluation> {
  // Create a promise that resolves when analysis completes or when timeout is reached
  return new Promise<PositionEvaluation>((resolve, reject) => {
    let latestEval: PositionEvaluation | null = null;
    let isResolved = false;
    
    // Set timeout to ensure we don't wait forever
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        worker.stopSearch();
        
        if (latestEval) {
          console.log(`Position analysis timed out after ${timeoutMs}ms, using best available evaluation`);
          
          // Ensure we have at least two lines to prevent false "forced" move classifications
          if (latestEval.lines && latestEval.lines.length === 1) {
            // Add a second line with a slightly worse evaluation
            const firstLine = latestEval.lines[0];
            const secondLine: PositionEvaluationLine = {
              depth: firstLine.depth > 0 ? firstLine.depth - 1 : 1,
              pv: firstLine.pv.slice(0),
              cp: firstLine.cp !== undefined ? firstLine.cp - 10 : undefined, // 0.1 pawns worse if cp exists
              mate: firstLine.mate !== undefined ? 
                (firstLine.mate > 0 ? firstLine.mate + 1 : firstLine.mate - 1) : // One move longer if mate exists
                undefined
            };
            
            latestEval.lines.push(secondLine);
          }
          
          resolve(latestEval);
        } else {
          reject(new Error(`Position analysis timed out after ${timeoutMs}ms with no evaluation`));
        }
      }
    }, timeoutMs);
    
    // Start the analysis
    worker.evaluatePositionWithUpdate({
      fen,
      depth,
      multiPv,
      setPartialEval: (evaluation: PositionEvaluation) => {
        // Store the latest evaluation
        latestEval = evaluation;
        
        // Resolve early if we reach target depth
        if (!isResolved && evaluation.lines.length > 0 && evaluation.lines[0]?.depth >= depth) {
          clearTimeout(timeout);
          isResolved = true;
          worker.stopSearch();
          resolve(evaluation);
        }
      }
    }).catch(error => {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;
        worker.stopSearch();
        
        if (latestEval) {
          console.warn('Error during analysis, using best available evaluation:', error);
          resolve(latestEval);
        } else {
          reject(error);
        }
      }
    });
  });
}

// Helper function to validate UCI move format
function isValidUciMove(move: string): boolean {
  // Standard UCI move format: e.g., "e2e4" or "e7e8q" for promotion
  return /^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/.test(move);
}

// Helper function to parse an info message
function parseInfoMessage(message: string): {
  multipv?: number;
  depth?: number;
  cp?: number;
  mate?: number;
  pv?: string[];
} | null {
  const result: {
    multipv?: number;
    depth?: number;
    cp?: number;
    mate?: number;
    pv?: string[];
  } = {};
  
  // Extract multipv
  const multipvMatch = message.match(/multipv\s+(\d+)/);
  if (multipvMatch) {
    result.multipv = parseInt(multipvMatch[1], 10);
  }
  
  // Extract depth
  const depthMatch = message.match(/depth\s+(\d+)/);
  if (depthMatch) {
    result.depth = parseInt(depthMatch[1], 10);
  }
  
  // Extract cp
  const cpMatch = message.match(/score\s+cp\s+(-?\d+)/);
  if (cpMatch) {
    result.cp = parseInt(cpMatch[1], 10);
  }
  
  // Extract mate
  const mateMatch = message.match(/score\s+mate\s+(-?\d+)/);
  if (mateMatch) {
    result.mate = parseInt(mateMatch[1], 10);
  }
  
  // Extract pv
  const pvMatch = message.match(/pv\s+(.*?)(?:\s+|$)/);
  if (pvMatch) {
    result.pv = pvMatch[1].trim().split(/\s+/);
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

// Helper function to extract the best move from a message
function extractBestMove(message: string): string | null {
  const match = message.match(/bestmove\s+(\S+)/);
  if (!match) return null;
  
  const moveString = match[1];
  if (moveString === '(none)' || moveString === 'NULL') return null;
  
  return isValidUciMove(moveString) ? moveString : null;
}

export class Stockfish17 {
  /**
   * Create a new instance of the Stockfish 17 engine
   * @param lite Whether to use the lite version of the engine
   * @returns A promise that resolves to a Stockfish17Engine instance
   */
  static async create(lite: boolean): Promise<Stockfish17Engine> {
    try {
      // Create a new Stockfish engine instance - always using single-threaded version for compatibility
      const worker = new Worker('/stockfish/stockfish-nnue-16-single.js');
      
      // Add comprehensive error handling
      worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        
        // Provide more specific error information
        let errorMessage = 'Failed to initialize Stockfish engine';
        
        if (error.message && error.message.includes('SharedArrayBuffer')) {
          errorMessage = 'Browser does not support SharedArrayBuffer required by Stockfish. Using single-threaded version.';
        } else if (error.message && error.message.includes('WASM')) {
          errorMessage = 'WebAssembly support issue. Please check browser compatibility.';
        }
        
        console.warn(errorMessage);
        throw new Error(errorMessage);
      };
      
      // Initialize the engine with a more robust approach
      await sendCommands(worker, ['uci'], 'uciok');
      await sendCommands(worker, ['isready'], 'readyok');
      
      // Configure the engine to use NNUE
      worker.postMessage('setoption name Use NNUE value true');
      worker.postMessage('setoption name EvalFile value nn-5af11540bbfe.nnue');
      
      return {
        evaluatePositionWithUpdate: async (options: EvaluatePositionOptions) => {
          // Make sure any previous searches are stopped
          worker.postMessage('stop');
          
          // Set up the engine for the search
          worker.postMessage(`setoption name MultiPV value ${options.multiPv}`);
          worker.postMessage(`position fen ${options.fen}`);
          
          // Create a promise that will be resolved when the search is complete
          const messages: string[] = [];
          const onMessage = (data: string) => {
            messages.push(data);
            
            // Handle info messages for partial evaluation updates
            if (data.startsWith('info')) {
              const info = parseInfoMessage(data);
              if (info && info.multipv && info.depth && (info.cp !== undefined || info.mate !== undefined)) {
                // Collect all lines from messages so far
                const lines: PositionEvaluationLine[] = [];
                for (const msg of messages) {
                  if (msg.startsWith('info')) {
                    const parsedInfo = parseInfoMessage(msg);
                    if (parsedInfo && parsedInfo.multipv && parsedInfo.depth && 
                        (parsedInfo.cp !== undefined || parsedInfo.mate !== undefined)) {
                      const line: PositionEvaluationLine = {
                        depth: parsedInfo.depth,
                        pv: parsedInfo.pv || []
                      };
                      
                      if (parsedInfo.cp !== undefined) {
                        line.cp = parsedInfo.cp;
                      } else if (parsedInfo.mate !== undefined) {
                        line.mate = parsedInfo.mate;
                      }
                      
                      // Add to lines array if not already present
                      const existingLineIndex = lines.findIndex(l => l.depth === line.depth && 
                        ((l.cp !== undefined && line.cp !== undefined) || 
                         (l.mate !== undefined && line.mate !== undefined)));
                      
                      if (existingLineIndex === -1) {
                        lines.push(line);
                      } else if (parsedInfo.multipv === 1) {
                        // Replace if it's the primary variation
                        lines[existingLineIndex] = line;
                      }
                    }
                  }
                }
                
                // Update the partial evaluation
                if (lines.length > 0) {
                  options.setPartialEval({ lines });
                }
              }
            }
          };
          
          try {
            // Start the search without a timeout
            await sendCommandsWithCallback(worker, [`go depth ${options.depth}`], 'bestmove', onMessage);
          } catch (error) {
            console.error('Evaluation error:', error);
            worker.postMessage('stop'); // Ensure search is stopped on error
            throw error;
          }
        },
        
        getEngineNextMove: async (fen: string, skillLevel: number, depth: number) => {
          // Validate FEN before sending to engine
          try {
            // Simple validation - check if FEN has the expected format
            const fenParts = fen.split(' ');
            if (fenParts.length !== 6) {
              console.error('Invalid FEN format:', fen);
              return null;
            }
          } catch (error) {
            console.error('Error validating FEN:', error);
            return null;
          }
          
          // Make sure any previous searches are stopped
          worker.postMessage('stop');
          
          // Set up the engine for the search
          worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
          worker.postMessage(`position fen ${fen}`);
          
          try {
            console.log(`Searching for move with depth ${depth}`);
            
            // Start the search with retry mechanism
            let attempts = 0;
            const maxAttempts = 2;
            
            while (attempts < maxAttempts) {
              try {
                const messages = await sendCommands(
                  worker, 
                  [`go depth ${depth}`], 
                  'bestmove'
                );
                
                // Find the bestmove message
                const bestMoveMsg = messages.find(msg => msg.startsWith('bestmove'));
                if (!bestMoveMsg) {
                  console.warn('No bestmove message found in engine response');
                  attempts++;
                  continue;
                }
                
                const move = extractBestMove(bestMoveMsg);
                if (move) {
                  console.log('Engine returned move:', move);
                  return move;
                } else {
                  console.warn('Engine returned invalid move format');
                  attempts++;
                }
              } catch (error) {
                console.warn(`Move search attempt ${attempts + 1} failed:`, error);
                attempts++;
                
                // Stop any ongoing search before retrying
                worker.postMessage('stop');
                
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            
            console.error('All move search attempts failed');
            return null;
          } catch (error) {
            console.error('Move search error:', error);
            worker.postMessage('stop'); // Ensure search is stopped on error
            return null;
          }
        },
        
        stopSearch: () => {
          worker.postMessage('stop');
        },
        
        shutdown: () => {
          worker.postMessage('quit');
          worker.terminate();
        }
      };
    } catch (error) {
      console.error('Failed to initialize Stockfish engine:', error);
      throw new Error('Failed to initialize Stockfish engine');
    }
  }
}

/**
 * Send commands to the engine and wait for a specific response
 * No timeout - will wait indefinitely for the engine to respond
 */
async function sendCommands(
  worker: Worker,
  commands: string[],
  finalMessage: string
): Promise<string[]> {
  return new Promise<string[]>((resolve) => {
    const messages: string[] = [];
    
    const messageHandler = (event: MessageEvent) => {
      const data = event.data as string;
      messages.push(data);
      
      if (data.includes(finalMessage)) {
        worker.removeEventListener('message', messageHandler);
        resolve(messages);
      }
    };
    
    worker.addEventListener('message', messageHandler);
    
    // Send all commands
    for (const command of commands) {
      worker.postMessage(command);
    }
  });
}

/**
 * Send commands to the engine with a callback for each message received
 * No timeout - will wait indefinitely for the engine to respond
 */
async function sendCommandsWithCallback(
  worker: Worker,
  commands: string[],
  finalMessage: string,
  onMessage: (data: string) => void
): Promise<string[]> {
  return new Promise<string[]>((resolve) => {
    const messages: string[] = [];
    
    const messageHandler = (event: MessageEvent) => {
      const data = event.data as string;
      messages.push(data);
      
      // Call the callback for each message
      onMessage(data);
      
      if (data.includes(finalMessage)) {
        worker.removeEventListener('message', messageHandler);
        resolve(messages);
      }
    };
    
    worker.addEventListener('message', messageHandler);
    
    // Send all commands
    for (const command of commands) {
      worker.postMessage(command);
    }
  });
}
