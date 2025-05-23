import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { motion } from 'framer-motion';
import NavBar from '../components/NavBar/NavBar';
import Board from '../components/Board/Board';
import PgnImport from '../components/PgnImport/PgnImport';
import Analysis from '../components/Analysis/Analysis';
import MoveHistory from '../components/MoveHistory/MoveHistory';
import CapturedPieces from '../components/CapturedPieces/CapturedPieces';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../types';

const PageContainer = styled.div`
    padding-top: 80px;
    width: 100%;
    box-sizing: border-box;
    
    @media (max-width: 768px) {
        padding-bottom: 70px; /* Add padding for the bottom navigation bar */
        padding-top: 70px; /* Reduce top padding on smaller screens */
    }
    
    @media (max-width: 576px) {
        padding-top: 60px; /* Further reduce top padding on mobile */
    }
`;

const Container = styled(motion.div)`
    max-width: 1400px;
    margin: 20px auto;
    padding: 20px;
    display: grid;
    grid-template-columns: minmax(auto, 700px) minmax(300px, 1fr);
    gap: 40px;
    align-items: start;
    box-sizing: border-box;
    width: 100%;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
        max-width: 800px;
        padding-left: 20px;
        padding-right: 20px;
        margin: 16px auto;
    }

    @media (max-width: 768px) {
        padding-left: 16px;
        padding-right: 16px;
        gap: 30px;
        margin: 14px auto;
    }

    @media (max-width: 576px) {
        padding-left: 12px;
        padding-right: 12px;
        gap: 20px;
        margin: 10px auto;
    }
`;

interface BoardWrapperProps {
    theme: { colors: ThemeColors };
}

const BoardWrapper = styled(motion.div)<BoardWrapperProps>`
    position: relative;
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 16px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    padding: 30px;
    transition: background-color 0.3s ease, color 0.3s ease;
    
    @media (max-width: 768px) {
        padding: 20px;
    }
    
    @media (max-width: 576px) {
        padding: 15px;
    }
`;

interface ControlsWrapperProps {
    theme: { colors: ThemeColors };
}

const ControlsWrapper = styled(motion.div)<ControlsWrapperProps>`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 16px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    padding: 30px;
    transition: background-color 0.3s ease, color 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
    
    @media (max-width: 768px) {
        padding: 20px;
    }
    
    @media (max-width: 576px) {
        padding: 15px;
    }
`;

interface ButtonProps {
    theme: { colors: ThemeColors; theme?: string };
}

const Button = styled.button<ButtonProps>`
    padding: 10px 20px;
    margin: 5px;
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.theme === 'dark' ? '#000000' : '#ffffff'};
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
    
    @media (max-width: 768px) {
        padding: 8px 16px;
    }
    
    @media (max-width: 576px) {
        padding: 8px 12px;
        font-size: 0.85rem;
        margin: 3px;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    
    @media (max-width: 576px) {
        gap: 8px;
        margin-bottom: 15px;
    }
`;

interface TitleProps {
    theme: { colors: ThemeColors };
}

const Title = styled.h2<TitleProps>`
    margin-top: 0;
    margin-bottom: 20px;
    color: ${({ theme }) => theme.colors.text};
    font-size: 1.5rem;
    font-weight: 600;
    
    @media (max-width: 768px) {
        font-size: 1.3rem;
        margin-bottom: 16px;
    }
    
    @media (max-width: 576px) {
        font-size: 1.2rem;
        margin-bottom: 14px;
    }
`;

interface TabContainerProps {
    theme: { colors: ThemeColors };
}

const TabContainer = styled.div<TabContainerProps>`
    display: flex;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.secondary};
    margin-bottom: 20px;
    width: 100%;
    overflow-x: auto;
`;

interface TabProps {
    active?: boolean;
    theme: { colors: ThemeColors };
}

const Tab = styled.div<TabProps>`
    padding: 12px 20px;
    cursor: pointer;
    font-weight: ${props => props.active ? '600' : '400'};
    color: ${props => props.active ? ({ theme }) => theme.colors.accent : ({ theme }) => theme.colors.text};
    border-bottom: 2px solid ${props => props.active ? ({ theme }) => theme.colors.accent : 'transparent'};
    transition: all 0.2s ease;
    white-space: nowrap;
    
    &:hover {
        color: ${({ theme }) => theme.colors.accent};
    }
    
    @media (max-width: 576px) {
        padding: 10px 16px;
        font-size: 0.9rem;
    }
`;

interface TabContentProps {
    active?: boolean;
}

const TabContent = styled.div<TabContentProps>`
    display: ${props => props.active ? 'block' : 'none'};
    flex: 1;
    overflow-y: auto;
    max-height: 70vh;
    
    @media (max-width: 768px) {
        max-height: 60vh;
    }
    
    @media (max-width: 576px) {
        max-height: 50vh;
    }
`;

interface LocationState {
  pgn?: string;
  moveHistory?: string[];
}

const AnalysisPage: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('moves');
  const [evaluationValue, setEvaluationValue] = useState<number | null>(null);
  const [evaluationType, setEvaluationType] = useState<'cp' | 'mate' | null>(null);
  const [moveClassifications, setMoveClassifications] = useState<Record<string, string>>({});
  
  // Get PGN data directly from location state on component mount only
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.pgn) {
      console.log("PGN data found in navigation state, parsing directly");
      try {
        // Parse PGN directly here instead of passing to PgnImport for auto-import
        const tempChess = new Chess();
        tempChess.loadPgn(state.pgn);
        
        // Extract moves and set state
        const moves = tempChess.history();
        
        // Get the initial position if it's not the standard starting position
        const initialFen = tempChess.header().FEN || tempChess.header().SetUp === '1' ? tempChess.header().FEN : undefined;
        
        // Create a new chess instance with the correct starting position
        const newChess = initialFen ? new Chess(initialFen) : new Chess();
        setChess(newChess);
        setMoveHistory(moves);
        setCurrentMoveIndex(-1);
        
        // Switch to moves tab
        setActiveTab('moves');
        
        console.log("Successfully parsed PGN with", moves.length, "moves");
      } catch (error) {
        console.error("Error parsing PGN:", error);
      }
    }
  }, [location]); // Add location as a dependency
  
  // For manual PGN imports
  const [initialPgn] = useState<string>('');

    // Handle PGN import
    const handlePgnImport = (moves: string[], initialFen?: string) => {
        const newChess = initialFen ? new Chess(initialFen) : new Chess();
        setChess(newChess);
        setMoveHistory(moves);
        setCurrentMoveIndex(-1);
        // Switch to moves tab after import
        setActiveTab('moves');
    };

    // Navigate to a specific move - wrapped in useCallback
    const goToMove = useCallback((moveIndex: number): void => {
        // Reset to starting position
        const newChess = new Chess();
        
        // Apply moves up to the selected index
        for (let i = 0; i <= moveIndex && i < moveHistory.length; i++) {
            try {
                newChess.move(moveHistory[i]);
            } catch (error) {
                console.error('Invalid move:', moveHistory[i], error);
            }
        }
        
        setChess(newChess);
        setCurrentMoveIndex(moveIndex);
    }, [moveHistory]);

    // Navigation controls wrapped in useCallback to prevent recreation on every render
    const goToStart = useCallback((): void => { 
        goToMove(-1); 
    }, [goToMove]);
    
    const goToPrevious = useCallback((): void => { 
        if (currentMoveIndex > -1) {
            goToMove(currentMoveIndex - 1);
        }
    }, [currentMoveIndex, goToMove]);
    
    const goToNext = useCallback((): void => { 
        if (currentMoveIndex < moveHistory.length - 1) {
            goToMove(currentMoveIndex + 1);
        }
    }, [currentMoveIndex, moveHistory.length, goToMove]);
    
    const goToEnd = useCallback((): void => { 
        goToMove(moveHistory.length - 1); 
    }, [moveHistory.length, goToMove]);

    // Handle keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft':
                    goToPrevious();
                    break;
                case 'ArrowRight':
                    goToNext();
                    break;
                case 'Home':
                    goToStart();
                    break;
                case 'End':
                    goToEnd();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentMoveIndex, moveHistory, goToPrevious, goToNext, goToStart, goToEnd]);

    // Animation variants
    const containerVariants = {
        initial: { opacity: 0 },
        animate: { 
            opacity: 1,
            transition: { duration: 0.8 }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.5 }
        }
    };

    return (
        <PageContainer>
            <NavBar />
            <Container
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                <BoardWrapper theme={theme}>
                    <Board 
                        boardFlipped={boardFlipped}
                        analysisMode={true}
                        position={chess}
                        onBoardFlip={(flipped) => setBoardFlipped(flipped)}
                        showEvaluationBar={true}
                        evaluation={evaluationValue}
                        evaluationType={evaluationType}
                        moveClassifications={moveClassifications}
                    />
                    <ButtonGroup>
                        <Button theme={theme} onClick={() => setBoardFlipped(!boardFlipped)}>
                            Flip Board
                        </Button>
                    </ButtonGroup>
                </BoardWrapper>
                
                <ControlsWrapper theme={theme}>
                    <Title theme={theme}>Chess Analysis</Title>
                    
                    <PgnImport 
                        onImport={handlePgnImport} 
                        initialPgn={initialPgn}
                    />
                    
                    <TabContainer theme={theme}>
                        <Tab 
                            active={activeTab === 'moves'} 
                            onClick={() => setActiveTab('moves')}
                            theme={theme}
                        >
                            Moves
                        </Tab>
                        <Tab 
                            active={activeTab === 'analysis'} 
                            onClick={() => setActiveTab('analysis')}
                            theme={theme}
                        >
                            Analysis
                        </Tab>
                    </TabContainer>
                    
                    <TabContent active={activeTab === 'moves'}>
                        <CapturedPieces position={chess.fen()} />
                        <MoveHistory 
                            moves={moveHistory} 
                            selectedMoveIndex={currentMoveIndex}
                            onMoveClick={goToMove}
                            onFirstMove={goToStart}
                            onPreviousMove={goToPrevious}
                            onNextMove={goToNext}
                            onLastMove={goToEnd}
                        />
                    </TabContent>
                    
                    <TabContent active={activeTab === 'analysis'}>
                        <Analysis 
                            position={chess}
                            moveHistory={moveHistory}
                            currentMoveIndex={currentMoveIndex}
                            onPositionChange={(newPosition, newMoves, newIndex) => {
                                setChess(newPosition);
                                setMoveHistory(newMoves);
                                setCurrentMoveIndex(newIndex);
                            }}
                            onEvaluationChange={(value, type) => {
                                setEvaluationValue(value);
                                setEvaluationType(type);
                            }}
                            onMoveClassificationsChange={(classifications) => {
                                setMoveClassifications(classifications);
                            }}
                        />
                    </TabContent>
                </ControlsWrapper>
            </Container>
        </PageContainer>
    );
};

export default AnalysisPage;
