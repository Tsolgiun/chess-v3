import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';
import { 
  Stockfish17, 
  PositionEvaluation, 
  StockfishWorkerPool,
  analyzePositionWithTimeout
} from '../../lib/engine/stockfish17';
import analyze from '../../lib/chess/analysis';
import { Classification } from '../../lib/chess/classification';
import { EvaluatedPosition, EngineLine, Evaluation } from '../../lib/chess/types';
import { getWinPercentageFromEvaluation } from '../../lib/chess/winPercentage';
import DepthControl from '../DepthControl/DepthControl';
import AnalysisLoadingScreen from './AnalysisLoadingScreen';

interface AnalysisProps {
  position: Chess;
  moveHistory: string[];
  currentMoveIndex: number;
  onPositionChange?: (position: Chess, moveHistory: string[], currentMoveIndex: number) => void;
  onEvaluationChange?: (value: number | null, type: 'cp' | 'mate' | null) => void;
  onMoveClassificationsChange?: (classifications: Record<string, string>) => void;
}

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;



const ClassificationContainer = styled.div<ContainerProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
`;

interface ClassificationBadgeProps {
  type: string;
}

const ClassificationBadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ClassificationBadgeImage = styled.img`
  width: 20px;
  height: 20px;
`;

const ClassificationBadgeText = styled.div<ClassificationBadgeProps>`
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  background: ${props => {
    switch (props.type) {
      case 'brilliant': return '#1baaa6';
      case 'great': return '#5b8baf';
      case 'best': return '#98bc49';
      case 'excellent': return '#98bc49';
      case 'good': return '#97af8b';
      case 'inaccuracy': return '#f4bf44';
      case 'mistake': return '#e28c28';
      case 'blunder': return '#c93230';
      case 'forced': return '#97af8b';
      case 'book': return '#a88764';
      default: return '#97af8b';
    }
  }};
`;

const ClassificationText = styled.span<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;


const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
`;

const Button = styled.button<ContainerProps>`
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.7;
  }
`;


// Debounce utility function
const useDebounce = <T extends (...args: any[]) => any>(callback: T, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};


const Analysis: React.FC<AnalysisProps> = ({ position, moveHistory, currentMoveIndex, onPositionChange, onEvaluationChange, onMoveClassificationsChange }) => {
  const theme = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [engine, setEngine] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<PositionEvaluation | null>(null);
  const [positions, setPositions] = useState<EvaluatedPosition[]>([]);
  const [currentClassification, setCurrentClassification] = useState<Classification | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState<number>(10); // Reduced from 16 to 10 for faster analysis
  const [error, setError] = useState<string | null>(null);
  const [totalPositions, setTotalPositions] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  
  // Ref to store the latest evaluation without triggering re-renders
  const latestEvaluationRef = useRef<PositionEvaluation | null>(null);

  // Initialize the worker pool
  const workerPoolRef = useRef<StockfishWorkerPool | null>(null);
  
  useEffect(() => {
    const initWorkerPool = async () => {
      try {
        // Create a worker pool with 4 workers (or fewer based on device capabilities)
        const workerCount = navigator.hardwareConcurrency 
          ? Math.min(4, Math.max(2, navigator.hardwareConcurrency - 1)) 
          : 2;
        
        console.log(`Initializing worker pool with ${workerCount} workers based on hardware concurrency`);
        const pool = new StockfishWorkerPool(workerCount);
        await pool.initialize();
        workerPoolRef.current = pool;
        
        // Also initialize a single engine for live evaluation
        const stockfish = await Stockfish17.create(false);
        setEngine(stockfish);
      } catch (error: unknown) {
        console.error('Failed to initialize Stockfish engine:', error);
        
        // Fallback to single engine if worker pool fails
        try {
          const stockfish = await Stockfish17.create(false);
          setEngine(stockfish);
        } catch (fallbackError) {
          console.error('Failed to initialize fallback engine:', fallbackError);
        }
      }
    };

    initWorkerPool();

    return () => {
      // Clean up both the worker pool and single engine
      if (workerPoolRef.current) {
        workerPoolRef.current.shutdown();
        workerPoolRef.current = null;
      }
      
      if (engine) {
        engine.shutdown();
      }
    };
  }, []);
  
  // Reset to starting position
  const resetToStartingPosition = () => {
    if (onPositionChange) {
      const newChess = new Chess(); // Creates a chess instance with the standard starting position
      onPositionChange(newChess, [], -1);
    }
  };

  // Create debounced versions of state update functions
  const debouncedSetEvaluation = useDebounce((evaluation: PositionEvaluation) => {
    setEvaluation(evaluation);
    
    // Notify parent component about evaluation change
    if (onEvaluationChange) {
      const rawValue = getRawEvaluationValue(evaluation);
      const type = getEvaluationType(evaluation);
      onEvaluationChange(rawValue, type);
    }
  }, 100); // 100ms debounce
  
  // Update evaluation when position changes during active analysis
  useEffect(() => {
    if (engine && isAnalyzing && position) {
      const evaluateCurrentPosition = async () => {
        try {
          await engine.evaluatePositionWithUpdate({
            fen: position.fen(),
            depth: 16,
            multiPv: 2,
            setPartialEval: (evaluation: PositionEvaluation) => {
              // Store the latest evaluation in ref
              latestEvaluationRef.current = evaluation;
              
              // Use debounced version to update state
              debouncedSetEvaluation(evaluation);
            }
          });
        } catch (error: unknown) {
          console.error('Error evaluating position:', error);
        }
      };

      evaluateCurrentPosition();
    }
  }, [engine, isAnalyzing, position, onEvaluationChange, debouncedSetEvaluation]);
  
  // This effect ensures the evaluation is updated when navigating through moves with arrow keys
  useEffect(() => {
    // Only run this effect when not actively analyzing and we have positions data
    if (!isAnalyzing && positions.length > 0 && currentMoveIndex >= 0 && currentMoveIndex < positions.length) {
      console.log("Arrow navigation - updating evaluation for move index:", currentMoveIndex);
      
      const currentPosition = positions[currentMoveIndex];
      if (currentPosition && currentPosition.topLines && currentPosition.topLines.length > 0) {
        const topLine = currentPosition.topLines[0];
        const evalType = topLine.evaluation.type;
        const evalValue = topLine.evaluation.value;
        
        // Create a PositionEvaluation object from the topLine
        const newEvaluation: PositionEvaluation = {
          lines: [{
            depth: topLine.depth,
            pv: topLine.moveUCI ? [topLine.moveUCI] : [],
            ...(evalType === 'cp' ? { cp: evalValue * 100 } : { mate: evalValue })
          }]
        };
        
        // Update local state
        setEvaluation(newEvaluation);
        
        // Notify parent component directly
        if (onEvaluationChange) {
          const rawValue = evalType === 'cp' ? evalValue * 100 : evalValue;
          onEvaluationChange(rawValue, evalType);
        }
      }
    }
  }, [currentMoveIndex, positions, isAnalyzing, onEvaluationChange]);

  // Format evaluation for display
  const formatEvaluation = (evaluation: PositionEvaluation | null): string => {
    if (!evaluation || !evaluation.lines || evaluation.lines.length === 0) {
      return '0.0';
    }

    const line = evaluation.lines[0];
    if (line.mate !== undefined) {
      return `M${Math.abs(line.mate)}`;
    }

    return (line.cp !== undefined ? (line.cp / 100).toFixed(1) : '0.0');
  };

  // Get evaluation value for the bar
  const getEvaluationValue = (evaluation: PositionEvaluation | null): number => {
    if (!evaluation || !evaluation.lines || evaluation.lines.length === 0) {
      return 50; // Default to 50% (equal position)
    }

    const line = evaluation.lines[0];
    const evalObj: Evaluation = {
      type: line.mate !== undefined ? "mate" : "cp",
      value: line.mate !== undefined ? line.mate : (line.cp !== undefined ? line.cp / 100 : 0)
    };
    
    return getWinPercentageFromEvaluation(evalObj);
  };

  // Get evaluation type (cp or mate)
  const getEvaluationType = (evaluation: PositionEvaluation | null): 'cp' | 'mate' | null => {
    if (!evaluation || !evaluation.lines || evaluation.lines.length === 0) {
      return null;
    }

    const line = evaluation.lines[0];
    return line.mate !== undefined ? 'mate' : 'cp';
  };

  // Get raw evaluation value
  const getRawEvaluationValue = (evaluation: PositionEvaluation | null): number | null => {
    if (!evaluation || !evaluation.lines || evaluation.lines.length === 0) {
      return null;
    }

    const line = evaluation.lines[0];
    return line.mate !== undefined ? line.mate : (line.cp !== undefined ? line.cp : null);
  };

  // Convert Stockfish PositionEvaluation to our EngineLine format
  const convertToEngineLine = (evaluation: PositionEvaluation): EngineLine[] => {
    return evaluation.lines.map((line, idx) => ({
      id: idx + 1,
      depth: line.depth,
      evaluation: {
        type: line.mate !== undefined ? "mate" : "cp",
        value: line.mate !== undefined ? line.mate : (line.cp || 0) / 100
      },
      moveUCI: line.pv[0] || '',
    }));
  };

  
  // Handle depth change
  const handleDepthChange = (depth: number) => {
    setAnalysisDepth(depth);
  };

  // Process positions in batches with parallel analysis
  const analyzePositionsInBatches = async (
    positions: EvaluatedPosition[],
    batchSize: number = 8
  ): Promise<EvaluatedPosition[]> => {
    const results = [...positions]; // Create a copy to store results
    const positionsToAnalyze = positions.filter((pos, idx) => {
      // Always analyze first and last positions
      if (idx === 0 || idx === positions.length - 1) return true;
      
      // Analyze every 2nd position
      return idx % 2 === 0;
    });
    
    console.log(`Analyzing ${positionsToAnalyze.length} out of ${positions.length} positions in batches of ${batchSize}`);
    
    // Check if we have a worker pool
    if (!workerPoolRef.current) {
      throw new Error('Worker pool not initialized');
    }
    
    // Process positions in batches
    for (let i = 0; i < positionsToAnalyze.length; i += batchSize) {
      const batch = positionsToAnalyze.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(positionsToAnalyze.length / batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (position, batchIndex) => {
        try {
          // Get a worker from the pool
          const worker = workerPoolRef.current!.getNextWorker();
          
          // Try to analyze with increased timeout (10 seconds)
          let evaluation;
          try {
            evaluation = await analyzePositionWithTimeout(
              worker,
              position.fen,
              analysisDepth,
              2, // multiPv
              10000 // 10 second timeout
            );
          } catch (initialError) {
            console.warn(`Initial analysis failed for position, retrying with lower depth:`, initialError);
            
            // Retry with lower depth if first attempt fails
            try {
              const reducedDepth = Math.max(8, analysisDepth - 4); // Reduce depth but not below 8
              evaluation = await analyzePositionWithTimeout(
                worker,
                position.fen,
                reducedDepth,
                2, // multiPv
                8000 // 8 second timeout for retry
              );
            } catch (retryError) {
              console.error(`Retry analysis also failed:`, retryError);
              
              // Create a fallback evaluation if all attempts fail
              // Always provide at least two lines to avoid false "forced" move classifications
              evaluation = {
                lines: [
                  {
                    depth: 1,
                    cp: 0, // Neutral evaluation as fallback
                    pv: []
                  },
                  {
                    depth: 1,
                    cp: -10, // Slightly worse alternative move
                    pv: []
                  }
                ]
              };
            }
          }
          
          // Convert evaluation to EngineLine format
          const lines = convertToEngineLine(evaluation);
          
          // Find the position index in the original array
          const posIndex = results.findIndex(p => p.fen === position.fen);
          
          // Update position with evaluation
          if (posIndex !== -1) {
            results[posIndex] = {
              ...results[posIndex],
              topLines: lines
            };
            
            // If this is the current position, update the evaluation
            if (posIndex === currentMoveIndex + 1) {
              setEvaluation(evaluation);
            }
          }
          
          return { index: posIndex, success: true };
        } catch (error) {
          console.warn(`Error analyzing position in batch ${Math.floor(i / batchSize) + 1}, index ${batchIndex}:`, error);
          return { index: -1, success: false };
        }
      });
      
      // Wait for all positions in this batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Count successful analyses
      const successCount = batchResults.filter(
        result => result.status === 'fulfilled' && result.value.success
      ).length;
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1} completed: ${successCount}/${batch.length} positions analyzed successfully`);
      
      // Update progress after each batch
      setCurrentPosition(Math.min(i + batchSize, positionsToAnalyze.length));
      
      // Update positions state to show progress
      setPositions([...results]);
    }
    
    return results;
  };

  // Start analysis
  const startAnalysis = async () => {
    console.log("Starting analysis...");
    setIsAnalyzing(true);
    setError(null); // Reset any previous errors
    
    try {
      // Check if worker pool is initialized
      if (!workerPoolRef.current && !engine) {
        throw new Error('Neither worker pool nor engine is initialized');
      }
      
      // Create positions array from move history
      const newPositions: EvaluatedPosition[] = [];
      const tempChess = new Chess();
      
      // Add initial position
      newPositions.push({
        fen: tempChess.fen(),
        move: { san: '', uci: '' },
        topLines: [],
        worker: 'local'
      });
      
      // Add positions for each move
      for (let i = 0; i < moveHistory.length; i++) {
        const move = tempChess.move(moveHistory[i]);
        if (move) {
          newPositions.push({
            fen: tempChess.fen(),
            move: {
              san: move.san,
              uci: `${move.from}${move.to}${move.promotion || ''}`,
            },
            topLines: [],
            worker: 'local'
          });
        }
      }
      
      console.log("Created positions array:", newPositions.length, "positions");
      
      // Set total positions for progress tracking
      const positionsCount = newPositions.length;
      setTotalPositions(positionsCount);
      setCurrentPosition(0);
      
      // Set positions once initially
      setPositions(newPositions);
      
      // Determine batch size based on position count
      const batchSize = Math.min(8, Math.max(2, Math.floor(positionsCount / 10)));
      
      // Analyze positions in parallel batches
      let analyzedPositions: EvaluatedPosition[];
      
      if (workerPoolRef.current) {
        console.log("Using worker pool for parallel analysis");
        analyzedPositions = await analyzePositionsInBatches(newPositions, batchSize);
      } else if (engine) {
        console.log("Falling back to single engine analysis");
        // Use the existing sequential analysis as fallback
        // This is a simplified version of the original code
        const positionsToAnalyze = newPositions.filter((pos, idx) => {
          if (idx === 0 || idx === newPositions.length - 1) return true;
          return idx % 2 === 0;
        });
        
        for (let i = 0; i < positionsToAnalyze.length; i++) {
          setCurrentPosition(i + 1);
          const pos = positionsToAnalyze[i];
          const posIndex = newPositions.findIndex(p => p.fen === pos.fen);
          
          try {
            // Try to analyze with increased timeout (10 seconds)
            let evaluation;
            try {
              evaluation = await analyzePositionWithTimeout(
                engine,
                pos.fen,
                analysisDepth,
                2,
                10000 // 10 second timeout
              );
            } catch (initialError) {
              console.warn(`Initial analysis failed for position, retrying with lower depth:`, initialError);
              
              // Retry with lower depth if first attempt fails
              try {
                const reducedDepth = Math.max(8, analysisDepth - 4); // Reduce depth but not below 8
                evaluation = await analyzePositionWithTimeout(
                  engine,
                  pos.fen,
                  reducedDepth,
                  2, // multiPv
                  8000 // 8 second timeout for retry
                );
              } catch (retryError) {
                console.error(`Retry analysis also failed:`, retryError);
                
                // Create a fallback evaluation if all attempts fail
                // Always provide at least two lines to avoid false "forced" move classifications
                evaluation = {
                  lines: [
                    {
                      depth: 1,
                      cp: 0, // Neutral evaluation as fallback
                      pv: []
                    },
                    {
                      depth: 1,
                      cp: -10, // Slightly worse alternative move
                      pv: []
                    }
                  ]
                };
              }
            }
            
            const lines = convertToEngineLine(evaluation);
            
            if (posIndex !== -1) {
              newPositions[posIndex] = {
                ...newPositions[posIndex],
                topLines: lines
              };
            }
            
            if (i % 3 === 0) {
              setPositions([...newPositions]);
            }
          } catch (error) {
            console.warn(`Error in fallback analysis for position ${i+1}:`, error);
          }
        }
        
        analyzedPositions = newPositions;
      } else {
        throw new Error('No analysis engine available');
      }
      
      // After all positions are analyzed, generate the report
      console.log("All positions analyzed, generating report...");
      const analysisReport = await analyze(analyzedPositions);
      console.log("Analysis report generated:", analysisReport);
      
      // Update state with final results
      setPositions(analysisReport.positions);
      
      // Update current classification
      if (currentMoveIndex >= 0 && currentMoveIndex < analysisReport.positions.length - 1) {
        const classification = analysisReport.positions[currentMoveIndex + 1]?.classification;
        console.log("Current move classification:", classification);
        setCurrentClassification(classification || null);
      }
      
      // Update evaluation with the current position's evaluation
      if (currentMoveIndex >= 0 && currentMoveIndex < analysisReport.positions.length) {
        const currentPosition = analysisReport.positions[currentMoveIndex];
        if (currentPosition && currentPosition.topLines && currentPosition.topLines.length > 0) {
          const topLine = currentPosition.topLines[0];
          const evalType = topLine.evaluation.type;
          const evalValue = topLine.evaluation.value;
          
          // Create a PositionEvaluation object from the topLine
          const newEvaluation: PositionEvaluation = {
            lines: [{
              depth: topLine.depth,
              pv: topLine.moveUCI ? [topLine.moveUCI] : [],
              ...(evalType === 'cp' ? { cp: evalValue * 100 } : { mate: evalValue })
            }]
          };
          
          console.log("Updating evaluation bar with:", newEvaluation);
          setEvaluation(newEvaluation);
        }
      }
    } catch (error: unknown) {
      console.error("Error in analysis process:", error);
      
      // Ensure we stop any ongoing analysis
      if (engine) {
        engine.stopSearch();
      }
      
      // Set error message for display
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };


  // Memoize the move classifications calculation to prevent unnecessary recalculations
  const getMoveClassifications = useCallback((positions: EvaluatedPosition[], moveIndex: number): Record<string, string> => {
    let newMoveClassifications: Record<string, string> = {};
    
    // Only show classification for the current move
    if (moveIndex >= 0 && moveIndex < positions.length - 1) {
      const position = positions[moveIndex + 1];
      if (position?.classification && position?.move?.uci) {
        const toSquare = position.move.uci.slice(2, 4);
        newMoveClassifications[toSquare] = position.classification;
      }
    }
    
    return newMoveClassifications;
  }, []);
  
  // Memoize the current classification based on currentMoveIndex and positions
  const getCurrentClassification = useCallback((positions: EvaluatedPosition[], moveIndex: number): Classification | null => {
    if (positions.length > 0 && moveIndex >= 0 && moveIndex < positions.length - 1) {
      return positions[moveIndex + 1]?.classification || null;
    }
    return null;
  }, []);
  
  // Create refs to track previous values to avoid unnecessary updates
  const prevPositionsLengthRef = useRef<number>(0);
  const prevMoveIndexRef = useRef<number>(-1);
  const prevClassificationRef = useRef<Classification | null>(null);
  const prevMoveClassificationsRef = useRef<Record<string, string>>({});
  
  // Update classifications and evaluation when positions or currentMoveIndex changes
  useEffect(() => {
    // Skip update only if nothing has changed AND we have positions
    // This ensures we don't skip updates when navigating with arrow keys
    if (
      prevPositionsLengthRef.current === positions.length &&
      prevMoveIndexRef.current === currentMoveIndex &&
      positions.length > 0 // Only skip if we have positions AND nothing changed
    ) {
      return;
    }
    
    // Update refs
    prevPositionsLengthRef.current = positions.length;
    prevMoveIndexRef.current = currentMoveIndex;
    
    console.log("Evaluation update triggered - currentMoveIndex:", currentMoveIndex, "positions length:", positions.length);
    
    // Get current classification
    const classification = getCurrentClassification(positions, currentMoveIndex);
    
    // Only update if classification has changed
    if (prevClassificationRef.current !== classification) {
      prevClassificationRef.current = classification;
      setCurrentClassification(classification);
    }
    
    // Calculate move classifications for current move only
    if (positions.length > 0) {
      const newMoveClassifications = getMoveClassifications(positions, currentMoveIndex);
      
      // Check if move classifications have changed
      const hasChanged = JSON.stringify(newMoveClassifications) !== JSON.stringify(prevMoveClassificationsRef.current);
      
      if (hasChanged) {
        prevMoveClassificationsRef.current = newMoveClassifications;
        // Notify parent component about move classifications change
        if (onMoveClassificationsChange) {
          onMoveClassificationsChange(newMoveClassifications);
        }
      }
      
      // Update evaluation with the current position's evaluation
      if (currentMoveIndex >= 0 && currentMoveIndex < positions.length) {
        const currentPosition = positions[currentMoveIndex];
        if (currentPosition && currentPosition.topLines && currentPosition.topLines.length > 0) {
          const topLine = currentPosition.topLines[0];
          const evalType = topLine.evaluation.type;
          const evalValue = topLine.evaluation.value;
          
          // Create a PositionEvaluation object from the topLine
          const newEvaluation: PositionEvaluation = {
            lines: [{
              depth: topLine.depth,
              pv: topLine.moveUCI ? [topLine.moveUCI] : [],
              ...(evalType === 'cp' ? { cp: evalValue * 100 } : { mate: evalValue })
            }]
          };
          
          console.log("Updating evaluation bar for move index:", currentMoveIndex, newEvaluation);
          setEvaluation(newEvaluation);
        }
      }
    } else if (Object.keys(prevMoveClassificationsRef.current).length > 0) {
      // Only reset if we previously had classifications
      prevMoveClassificationsRef.current = {};
      // Notify parent component about move classifications change
      if (onMoveClassificationsChange) {
        onMoveClassificationsChange({});
      }
    }
  }, [
    currentMoveIndex, 
    positions, 
    onMoveClassificationsChange, 
    getMoveClassifications, 
    getCurrentClassification,
    setCurrentClassification
  ]);

  return (
    <Container theme={theme}>
      {isAnalyzing && (
        <AnalysisLoadingScreen 
          progress={totalPositions > 0 ? currentPosition / totalPositions : 0}
          totalPositions={totalPositions}
          currentPosition={currentPosition}
        />
      )}
      
      {!isAnalyzing ? (
        <>
          <DepthControl 
            initialDepth={analysisDepth}
            minDepth={8}
            maxDepth={24}
            onChange={handleDepthChange}
          />
          
          {error && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              backgroundColor: '#ffdddd', 
              color: '#ff0000',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          
          <ButtonGroup>
            <Button theme={theme} onClick={startAnalysis}>
              Start Analysis
            </Button>
            <Button theme={theme} onClick={resetToStartingPosition}>
              Reset to Starting Position
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          {currentClassification && currentMoveIndex >= 0 && (
            <ClassificationContainer theme={theme}>
              <ClassificationBadgeContainer>
                <ClassificationBadgeImage 
                  src={`/icons/${currentClassification}.png`} 
                  alt={currentClassification} 
                />
                <ClassificationBadgeText type={currentClassification}>
                  {currentClassification.charAt(0).toUpperCase() + currentClassification.slice(1)}
                </ClassificationBadgeText>
              </ClassificationBadgeContainer>
              <ClassificationText theme={theme}>
                {currentClassification === 'book' 
                  ? 'This is a common book move.' 
                  : currentClassification === 'forced' 
                    ? 'This is a forced move.' 
                    : `This move is considered a ${currentClassification} move.`}
              </ClassificationText>
            </ClassificationContainer>
          )}
        </>
      )}
    </Container>
  );
};

export default Analysis;
