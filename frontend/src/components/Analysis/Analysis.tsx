import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';
import { Stockfish17, PositionEvaluation } from '../../lib/engine/stockfish17';
import analyze from '../../lib/chess/analysis';
import { Classification } from '../../lib/chess/classification';
import { EvaluatedPosition, EngineLine, Evaluation, Move, Report, DetectedMotif } from '../../lib/chess/types';
import { getWinPercentageFromEvaluation } from '../../lib/chess/winPercentage';
import PgnImport from '../PgnImport/PgnImport';
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

const Title = styled.h3<ContainerProps>`
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  transition: color 0.3s ease;
`;

const EvaluationBar = styled.div<ContainerProps>`
  width: 100%;
  height: 30px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
`;

const WhiteBar = styled.div<{ width: string }>`
  height: 100%;
  width: ${props => props.width};
  position: relative;
  background-color: #ffffff;
  transition: width 0.3s ease;
`;

const BlackBar = styled.div<{ width: string }>`
  height: 100%;
  width: ${props => props.width};
  position: relative;
  background-color: #000000;
  transition: width 0.3s ease;
`;

const EvaluationText = styled.div<ContainerProps>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #1976d2; /* Hardcoded blue color for the evaluation number */
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  z-index: 1;
`;

const EngineLines = styled.div`
  margin-top: 16px;
`;

interface LineProps {
  theme: { colors: ThemeColors };
  $isTopLine?: boolean;
}

const Line = styled.div<LineProps>`
  padding: 8px 12px;
  margin-bottom: 8px;
  background: ${props => props.$isTopLine 
    ? `${props.theme.colors.accent}33` 
    : `${props.theme.colors.primary}33`};
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EvalBadge = styled.span<ContainerProps>`
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
`;

const MovesText = styled.span<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
  font-family: monospace;
  font-size: 0.95rem;
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

const LoadingIndicator = styled.div<ContainerProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: ${({ theme }) => theme.colors.text};
  font-style: italic;
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

const AccuracyContainer = styled.div<ContainerProps>`
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
`;

const AccuracyItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const AccuracyLabel = styled.span<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
`;

const AccuracyValue = styled.span<ContainerProps>`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 1.2rem;
  font-weight: 600;
`;

const TacticalMotifContainer = styled.div<ContainerProps>`
  margin-top: 16px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
`;

const TacticalMotifTitle = styled.div<ContainerProps>`
  font-weight: 600;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.text};
`;

const TacticalMotifItem = styled.div<ContainerProps>`
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  background: ${({ theme }) => theme.colors.secondary};
  border-radius: 4px;
  gap: 8px;
`;

const TacticalMotifType = styled.span<ContainerProps>`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`;

const TacticalMotifDescription = styled.span<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
`;

const TabContainer = styled.div<ContainerProps>`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 16px;
`;

interface TabProps {
  active?: boolean;
  theme: { colors: ThemeColors };
}

const Tab = styled.div<TabProps>`
  padding: 8px 16px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? ({ theme }) => theme.colors.accent : ({ theme }) => theme.colors.text};
  border-bottom: 2px solid ${props => props.active ? ({ theme }) => theme.colors.accent : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

interface TabContentProps {
  active?: boolean;
}

const TabContent = styled.div<TabContentProps>`
  display: ${props => props.active ? 'block' : 'none'};
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

const CheckboxContainer = styled.div<ContainerProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 6px;
`;

const CheckboxLabel = styled.label<ContainerProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
  cursor: pointer;
`;

const Checkbox = styled.input`
  cursor: pointer;
  width: 16px;
  height: 16px;
`;

const Analysis: React.FC<AnalysisProps> = ({ position, moveHistory, currentMoveIndex, onPositionChange, onEvaluationChange, onMoveClassificationsChange }) => {
  const theme = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [engine, setEngine] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<PositionEvaluation | null>(null);
  const [positions, setPositions] = useState<EvaluatedPosition[]>([]);
  const [currentClassification, setCurrentClassification] = useState<Classification | null>(null);
  const [moveClassifications, setMoveClassifications] = useState<Record<string, string>>({});
  const [report, setReport] = useState<Report | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState<number>(10); // Reduced from 16 to 10 for faster analysis
  const [error, setError] = useState<string | null>(null);
  const [totalPositions, setTotalPositions] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  
  // Ref to store the latest evaluation without triggering re-renders
  const latestEvaluationRef = useRef<PositionEvaluation | null>(null);

  // Initialize the engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const stockfish = await Stockfish17.create(false);
        setEngine(stockfish);
      } catch (error) {
        console.error('Failed to initialize Stockfish engine:', error);
      }
    };

    initEngine();

    return () => {
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
  
  // Update evaluation when position changes
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
        } catch (error) {
          console.error('Error evaluating position:', error);
        }
      };

      evaluateCurrentPosition();
    }
  }, [engine, isAnalyzing, position, onEvaluationChange, debouncedSetEvaluation]);

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

  // Handle PGN import
  const handlePgnImport = (moves: string[], initialFen?: string) => {
    if (onPositionChange) {
      const newChess = initialFen ? new Chess(initialFen) : new Chess();
      
      // Always start from the initial position, regardless of whether there's an initial FEN or not
      onPositionChange(newChess, moves, -1);
    }
  };
  
  // Handle depth change
  const handleDepthChange = (depth: number) => {
    setAnalysisDepth(depth);
  };

  // Start analysis
  const startAnalysis = async () => {
    console.log("Starting analysis...");
    setIsAnalyzing(true);
    setError(null); // Reset any previous errors
    
    try {
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
      
      // Create a working copy of positions that we'll update during analysis
      const workingPositions = [...newPositions];
      
      // Filter positions to analyze (every 2nd position + first and last)
      // This significantly reduces analysis time while still providing good coverage
      const positionsToAnalyze = workingPositions.filter((pos, idx) => {
        // Always analyze first and last positions
        if (idx === 0 || idx === workingPositions.length - 1) return true;
        
        // Analyze every 2nd position
        return idx % 2 === 0;
      });
      
      console.log(`Analyzing ${positionsToAnalyze.length} out of ${workingPositions.length} positions`);
      
      // Analyze each position with a more robust approach
      if (engine) {
        for (let i = 0; i < positionsToAnalyze.length; i++) {
          // Get the actual index in the workingPositions array
          const posIndex = workingPositions.findIndex(p => p.fen === positionsToAnalyze[i].fen);
          
          // Update current position for progress display
          setCurrentPosition(i + 1);
          
          const pos = positionsToAnalyze[i];
          console.log(`Analyzing position ${i+1}/${positionsToAnalyze.length}: ${pos.fen}`);
          
          // Define a shorter timeout for each position analysis
          const timeoutMs = 3000; // 3 seconds max per position (reduced from 10s)
          
          try {
            // Use a more robust promise with timeout
            await Promise.race([
              new Promise<void>((resolve, reject) => {
                // Track if this evaluation has been resolved
                let isResolved = false;
                
                // Track the highest depth reached
                let highestDepth = 0;
                
                // Set a timeout to resolve if taking too long
                const timeoutId = setTimeout(() => {
                  if (!isResolved) {
                    console.log(`Position ${i+1} evaluation timed out at depth ${highestDepth}`);
                    isResolved = true;
                    resolve();
                  }
                }, timeoutMs);
                
                // Ensure we're requesting multiple lines (at least 2)
                const multiPv = Math.max(2, analysisDepth >= 12 ? 3 : 2);
                console.log(`Analyzing position ${i+1} with multiPv: ${multiPv}`);
                
                engine.evaluatePositionWithUpdate({
                  fen: pos.fen,
                  depth: analysisDepth,
                  multiPv: multiPv,
                  setPartialEval: (evaluation: PositionEvaluation) => {
                    if (isResolved) return; // Skip if already resolved
                    
                    // Convert evaluation to EngineLine format
                    const lines = convertToEngineLine(evaluation);
                    
                    // Track highest depth
                    if (lines[0]?.depth > highestDepth) {
                      highestDepth = lines[0].depth;
                    }
                    
                    // Update the working position with the evaluation
                    if (posIndex !== -1) {
                      workingPositions[posIndex] = {
                        ...workingPositions[posIndex],
                        topLines: lines
                      };
                    }
                    
                    // If this is the current position, update the evaluation
                    if (posIndex === currentMoveIndex + 1) {
                      setEvaluation(evaluation);
                    }
                    
                    // Resolve when we reach target depth or get close enough
                    // Lower the threshold to 50% of target depth for faster analysis
                    if (lines[0]?.depth >= analysisDepth || 
                        (highestDepth > analysisDepth * 0.5)) {
                      clearTimeout(timeoutId);
                      if (!isResolved) {
                        console.log(`Position ${i+1} evaluation complete at depth ${highestDepth}`);
                        isResolved = true;
                        resolve();
                      }
                    }
                  }
                });
              }),
              new Promise<void>((_, reject) => 
                setTimeout(() => reject(new Error(`Position ${i+1} evaluation hard timeout`)), timeoutMs + 1000)
              )
            ]).catch(error => {
              console.warn(`Position ${i+1} evaluation issue:`, error.message);
              // Continue analysis even if one position times out
            });
            
            // Stop the current search before moving to the next position
            engine.stopSearch();
            
            // Update positions state less frequently to avoid render loops
            if (i % 3 === 0 || i === positionsToAnalyze.length - 1) {
              setPositions([...workingPositions]);
            }
          } catch (error) {
            console.error(`Error evaluating position ${i+1}:`, error);
            // Continue with next position even if one fails
          }
        }
      }
      
      // After all positions are analyzed, generate the report
      console.log("All positions analyzed, generating report...");
      const analysisReport = await analyze(workingPositions);
      console.log("Analysis report generated:", analysisReport);
      
      // Update state with final results
      setReport(analysisReport);
      setPositions(analysisReport.positions);
      
      // Update current classification
      if (currentMoveIndex >= 0 && currentMoveIndex < analysisReport.positions.length - 1) {
        const classification = analysisReport.positions[currentMoveIndex + 1]?.classification;
        console.log("Current move classification:", classification);
        setCurrentClassification(classification || null);
      }
    } catch (error) {
      console.error("Error in analysis process:", error);
      // Ensure we stop analysis even if there's an error
      if (engine) {
        engine.stopSearch();
      }
      // Set error message for display
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stop analysis
  const stopAnalysis = () => {
    if (engine) {
      engine.stopSearch();
    }
    setIsAnalyzing(false);
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
  
  // Update classifications when positions or currentMoveIndex changes
  useEffect(() => {
    // Skip update if nothing has changed
    if (
      prevPositionsLengthRef.current === positions.length &&
      prevMoveIndexRef.current === currentMoveIndex &&
      positions.length === 0
    ) {
      return;
    }
    
    // Update refs
    prevPositionsLengthRef.current = positions.length;
    prevMoveIndexRef.current = currentMoveIndex;
    
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
        setMoveClassifications(newMoveClassifications);
        
        // Notify parent component about move classifications change
        if (onMoveClassificationsChange) {
          onMoveClassificationsChange(newMoveClassifications);
        }
      }
    } else if (Object.keys(prevMoveClassificationsRef.current).length > 0) {
      // Only reset if we previously had classifications
      prevMoveClassificationsRef.current = {};
      setMoveClassifications({});
      
      // Notify parent component about move classifications change
      if (onMoveClassificationsChange) {
        onMoveClassificationsChange({});
      }
    }
  }, [currentMoveIndex, positions, onMoveClassificationsChange, getMoveClassifications, getCurrentClassification]);

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
          <EvaluationBar theme={theme}>
            <WhiteBar width={`${getEvaluationValue(evaluation)}%`} />
            <BlackBar width={`${100 - getEvaluationValue(evaluation)}%`} />
            <EvaluationText theme={theme}>
              {formatEvaluation(evaluation)}
            </EvaluationText>
          </EvaluationBar>
          
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
