// Debug script to test move classification
import { Chess } from 'chess.js';
import analyze from './analysis';

// Create a simple test game with a few moves
async function testAnalysis() {
  console.log("Starting debug analysis test...");
  
  // Create a simple game with a few moves
  const game = new Chess();
  const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'];
  
  // Make the moves
  moves.forEach(move => game.move(move));
  
  // Create positions array for analysis
  const positions = [];
  
  // Add initial position
  const initialGame = new Chess();
  positions.push({
    fen: initialGame.fen(),
    move: { san: '', uci: '' },
    topLines: [
      {
        id: 1,
        depth: 10,
        evaluation: { type: 'cp', value: 0.2 },
        moveUCI: 'e2e4'
      },
      {
        id: 2,
        depth: 10,
        evaluation: { type: 'cp', value: 0.1 },
        moveUCI: 'd2d4'
      }
    ],
    worker: 'local'
  });
  
  // Create a new game to step through the moves
  const stepGame = new Chess();
  
  // Add each move position
  for (let i = 0; i < moves.length; i++) {
    const move = stepGame.move(moves[i]);
    
    // Create mock engine evaluations
    // In a real scenario, these would come from the engine
    const mockEval1 = { type: 'cp', value: Math.random() * 0.5 - 0.25 }; // Random value between -0.25 and 0.25
    const mockEval2 = { type: 'cp', value: mockEval1.value - (Math.random() * 0.3) }; // Slightly worse than first eval
    
    // Create mock UCI moves - this is where we'll test different scenarios
    let bestMoveUCI;
    let actualMoveUCI;
    
    // Convert the move to UCI format
    actualMoveUCI = `${move.from}${move.to}${move.promotion || ''}`;
    
    // For testing, sometimes make the best move match the played move, sometimes not
    if (i % 2 === 0) {
      // Make best move match the played move (should classify as BEST)
      bestMoveUCI = actualMoveUCI;
    } else {
      // Make best move different (should classify as something else)
      // Use a valid alternative UCI move
      const alternativeMoves = ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'c2c4'];
      bestMoveUCI = alternativeMoves[i % alternativeMoves.length];
    }
    
    // Add position with mock engine lines
    positions.push({
      fen: stepGame.fen(),
      move: {
        san: move.san,
        uci: actualMoveUCI
      },
      topLines: [
        {
          id: 1,
          depth: 10,
          evaluation: mockEval1,
          moveUCI: bestMoveUCI
        },
        {
          id: 2,
          depth: 10,
          evaluation: mockEval2,
          moveUCI: 'a2a3' // Some arbitrary alternative move
        }
      ],
      worker: 'local'
    });
  }
  
  console.log(`Created ${positions.length} positions for analysis`);
  
  // Run the analysis
  try {
    const report = await analyze(positions);
    
    // Print the classifications
    console.log("\nMove Classifications:");
    report.positions.forEach((pos, idx) => {
      if (idx === 0) return; // Skip initial position
      console.log(`Move ${idx}: ${pos.move.san} - Classification: ${pos.classification}`);
    });
    
    // Check if all moves are classified as BEST
    const allBest = report.positions.slice(1).every(pos => pos.classification === 'best');
    console.log(`\nAll moves classified as BEST: ${allBest}`);
    
  } catch (error) {
    console.error("Error during analysis:", error);
  }
}

// Run the test
testAnalysis().then(() => console.log("Debug analysis complete"));
