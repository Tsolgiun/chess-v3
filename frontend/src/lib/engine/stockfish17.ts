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
            // Start the search with a dynamic timeout based on depth
            const timeoutMs = Math.min(30000, options.depth * 2000); // 2 seconds per depth, max 30 seconds
            await sendCommandsWithCallback(worker, [`go depth ${options.depth}`], 'bestmove', onMessage, timeoutMs);
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
            // Calculate a dynamic timeout based on position complexity and depth
            // More complex positions and higher depths get more time
            const baseTimeout = 5000; // 5 seconds base
            const depthFactor = depth * 500; // 0.5 second per depth level
            const timeoutMs = baseTimeout + depthFactor;
            
            console.log(`Searching for move with depth ${depth}, timeout ${timeoutMs}ms`);
            
            // Start the search with retry mechanism
            let attempts = 0;
            const maxAttempts = 2;
            
            while (attempts < maxAttempts) {
              try {
                const messages = await sendCommands(
                  worker, 
                  [`go depth ${depth}`], 
                  'bestmove',
                  timeoutMs + (attempts * 2000) // Increase timeout on retry
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
 */
async function sendCommands(
  worker: Worker,
  commands: string[],
  finalMessage: string,
  timeoutMs: number = 10000
): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const messages: string[] = [];
    
    const messageHandler = (event: MessageEvent) => {
      const data = event.data as string;
      messages.push(data);
      
      if (data.includes(finalMessage)) {
        worker.removeEventListener('message', messageHandler);
        clearTimeout(timeoutId);
        resolve(messages);
      }
    };
    
    // Set a timeout to handle cases where the engine doesn't respond
    const timeoutId = setTimeout(() => {
      worker.removeEventListener('message', messageHandler);
      reject(new Error(`Engine command timed out after ${timeoutMs}ms. Waiting for: ${finalMessage}`));
    }, timeoutMs);
    
    worker.addEventListener('message', messageHandler);
    
    // Send all commands
    for (const command of commands) {
      worker.postMessage(command);
    }
  });
}

/**
 * Send commands to the engine with a callback for each message received
 */
async function sendCommandsWithCallback(
  worker: Worker,
  commands: string[],
  finalMessage: string,
  onMessage: (data: string) => void,
  timeoutMs: number = 10000
): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const messages: string[] = [];
    
    const messageHandler = (event: MessageEvent) => {
      const data = event.data as string;
      messages.push(data);
      
      // Call the callback for each message
      onMessage(data);
      
      if (data.includes(finalMessage)) {
        worker.removeEventListener('message', messageHandler);
        clearTimeout(timeoutId);
        resolve(messages);
      }
    };
    
    // Set a timeout to handle cases where the engine doesn't respond
    const timeoutId = setTimeout(() => {
      worker.removeEventListener('message', messageHandler);
      reject(new Error(`Engine command timed out after ${timeoutMs}ms. Waiting for: ${finalMessage}`));
    }, timeoutMs);
    
    worker.addEventListener('message', messageHandler);
    
    // Send all commands
    for (const command of commands) {
      worker.postMessage(command);
    }
  });
}
