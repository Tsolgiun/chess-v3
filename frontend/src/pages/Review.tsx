import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavBar from '../components/NavBar/NavBar';
import Board from '../components/Board/Board';
import MoveHistory from '../components/MoveHistory/MoveHistory';
import CapturedPieces from '../components/CapturedPieces/CapturedPieces';
import Analysis from '../components/Analysis/Analysis';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { ThemeColors } from '../types';

const PageContainer = styled.div`
    padding-top: 80px;
    
    @media (max-width: 768px) {
        padding-bottom: 70px; /* Add padding for the bottom navigation bar */
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

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
        max-width: 800px;
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
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
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
`;

interface TabContainerProps {
    theme: { colors: ThemeColors };
}

const TabContainer = styled.div<TabContainerProps>`
    display: flex;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.secondary};
    margin-bottom: 20px;
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
    
    &:hover {
        color: ${({ theme }) => theme.colors.accent};
    }
`;

interface TabContentProps {
    active?: boolean;
}

const TabContent = styled.div<TabContentProps>`
    display: ${props => props.active ? 'block' : 'none'};
    flex: 1;
    overflow-y: auto;
`;

interface ErrorDivProps {
    theme: { colors: ThemeColors };
}

const ErrorDiv = styled.div<ErrorDivProps>`
    padding: 20px;
    text-align: center;
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 8px;
    margin: 20px auto;
    max-width: 600px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease, color 0.3s ease;
`;

interface LoadingDivProps {
    theme: { colors: ThemeColors };
}

const LoadingDiv = styled.div<LoadingDivProps>`
    padding: 20px;
    text-align: center;
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 8px;
    margin: 20px auto;
    max-width: 600px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease, color 0.3s ease;
`;

interface GameData {
    fen: string;
    moveHistory?: string[];
}

const Review: React.FC = () => {
    const { reviewGameId: urlGameId } = useParams<{ reviewGameId?: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const gameContext = useGame();
    // Access game review data from context
    // Note: These properties might not be explicitly defined in the type
    const reviewFen = (gameContext as any).reviewFen;
    const reviewMoves = (gameContext as any).reviewMoves || [];
    const contextGameId = (gameContext as any).reviewGameId;
    
    const [chess, setChess] = useState<Chess>(() => new Chess());
    const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
    const [boardFlipped, setBoardFlipped] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>(urlGameId === 'demo' ? 'analysis' : 'moves');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [localReviewMoves, setLocalReviewMoves] = useState<string[]>([]);

    useEffect(() => {
        setLocalReviewMoves(reviewMoves || []);
    }, [reviewMoves]);

    // Load the review game
    useEffect(() => {
        const loadGameData = async () => {
            try {
                setLoading(true);
                // Use URL param first, fall back to context
                const gameIdToUse = urlGameId || contextGameId;
                console.log(`Loading game data for review: ${gameIdToUse}`);
                
                // Handle demo game ID for analysis page
                if (gameIdToUse === 'demo') {
                    console.log("Loading demo game for analysis");
                    const newChess = new Chess();
                    
                    // Play some sample moves for the demo game
                    const demoMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O'];
                    const movesNotation: string[] = [];
                    
                    demoMoves.forEach(move => {
                        try {
                            const result = newChess.move(move);
                            if (result) {
                                movesNotation.push(result.san);
                            }
                        } catch (error) {
                            console.error(`Error making demo move ${move}:`, error);
                        }
                    });
                    
                    setChess(newChess);
                    setLocalReviewMoves(movesNotation);
                    setCurrentMoveIndex(movesNotation.length - 1);
                    setLoading(false);
                    return;
                }
                
                // First try to use context data
                if (reviewFen) {
                    console.log("Using game data from context");
                    try {
                        const newChess = new Chess(reviewFen);
                        setChess(newChess);
                        setCurrentMoveIndex(-1);
                        setLoading(false);
                        return;
                    } catch (error) {
                        console.error("Error using context data:", error);
                        // Continue to server fetch as fallback
                    }
                }
                
                // If we don't have context data or it failed, try to fetch from server
                if (gameIdToUse) {
                    try {
                        console.log("Fetching game data from server");
                        const response = await fetch(`http://localhost:3001/api/games/${gameIdToUse}/review`);
                        
                        if (!response.ok) {
                            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                        }
                        
                        const gameData: GameData = await response.json();
                        console.log("Received game data from server:", gameData);
                        
                        if (!gameData.fen) {
                            throw new Error("Server returned game data without FEN position");
                        }
                        
                        // Initialize the chess instance with the FEN from the server
                        const newChess = new Chess(gameData.fen);
                        setChess(newChess);
                        setCurrentMoveIndex(-1);
                        
                        // Set the moves from the server
                        if (gameData.moveHistory && Array.isArray(gameData.moveHistory)) {
                            setLocalReviewMoves(gameData.moveHistory);
                        }
                        
                        setLoading(false);
                        return;
                    } catch (error) {
                        console.error('Error fetching from server:', error);
                        throw error; // Re-throw to be caught by the outer catch
                    }
                } else {
                    throw new Error("No game ID provided for review");
                }
                
            } catch (error: any) {
                console.error('Error loading game for review:', error);
                setError(`Failed to load game data: ${error.message}`);
                setLoading(false);
            }
        };
        
        loadGameData();
    }, [urlGameId, contextGameId, reviewFen]);

    // Navigate to a specific move
    const goToMove = (moveIndex: number): void => {
        // Reset to starting position with the saved FEN if available
        const newChess = reviewFen ? new Chess(reviewFen) : new Chess();
        
        // Apply moves up to the selected index
        for (let i = 0; i <= moveIndex && i < localReviewMoves.length; i++) {
            try {
                newChess.move(localReviewMoves[i]);
            } catch (error) {
                console.error('Invalid move:', localReviewMoves[i], error);
            }
        }
        
        setChess(newChess);
        setCurrentMoveIndex(moveIndex);
    };

    // Navigation controls
    const goToStart = (): void => { goToMove(-1); };
    const goToPrevious = (): void => { 
        if (currentMoveIndex > -1) {
            goToMove(currentMoveIndex - 1);
        }
    };
    const goToNext = (): void => { 
        if (currentMoveIndex < localReviewMoves.length - 1) {
            goToMove(currentMoveIndex + 1);
        }
    };
    const goToEnd = (): void => { goToMove(localReviewMoves.length - 1); };

    // Return to home
    const handleReturnHome = (): void => {
        navigate('/');
    };

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

    if (error) {
        return (
            <PageContainer>
                <NavBar />
                <ErrorDiv>
                    <h3>Error</h3>
                    <p>{error}</p>
                    <Button onClick={handleReturnHome}>Return to Home</Button>
                </ErrorDiv>
            </PageContainer>
        );
    }

    if (loading) {
        return (
            <PageContainer>
                <NavBar />
                <LoadingDiv>
                    <h3>Initializing Review</h3>
                    <p>Please wait while we set up the review tools...</p>
                </LoadingDiv>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <NavBar />
            <Container
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                <BoardWrapper>
                    <Board 
                        boardFlipped={boardFlipped}
                        analysisMode={true}
                        position={chess}
                        onBoardFlip={(flipped) => setBoardFlipped(flipped)}
                    />
                    <ButtonGroup>
                        <Button onClick={() => setBoardFlipped(!boardFlipped)}>
                            Flip Board
                        </Button>
                        <Button onClick={handleReturnHome}>
                            Return to Home
                        </Button>
                    </ButtonGroup>
                </BoardWrapper>
                
                <ControlsWrapper>
                    <Title>Game Review</Title>
                    
                    <TabContainer>
                        <Tab 
                            active={activeTab === 'moves'} 
                            onClick={() => setActiveTab('moves')}
                        >
                            Moves
                        </Tab>
                        <Tab 
                            active={activeTab === 'analysis'} 
                            onClick={() => setActiveTab('analysis')}
                        >
                            Analysis
                        </Tab>
                    </TabContainer>
                    
                    <TabContent active={activeTab === 'moves'}>
                        <CapturedPieces position={chess.fen()} />
                        <MoveHistory 
                            moves={localReviewMoves} 
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
                        moveHistory={localReviewMoves}
                        currentMoveIndex={currentMoveIndex}
                        onPositionChange={(newPosition, newMoves, newIndex) => {
                            setChess(newPosition);
                            setLocalReviewMoves(newMoves);
                            setCurrentMoveIndex(newIndex);
                        }}
                    />
                    </TabContent>
                </ControlsWrapper>
            </Container>
        </PageContainer>
    );
};

export default Review;
