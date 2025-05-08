import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { ReviewService } from '../services/ReviewService';
import NavBar from '../components/NavBar/NavBar';
import { motion } from 'framer-motion';
import Board from '../components/Board/Board';
import GameInfo from '../components/GameInfo/GameInfo';
import MoveHistory from '../components/MoveHistory/MoveHistory';
import CapturedPieces from '../components/CapturedPieces/CapturedPieces';
import Timer from '../components/Timer/Timer';
import GameResultModal from '../components/GameResultModal/GameResultModal';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../types/interfaces';

interface ContainerProps {
  theme?: { colors: ThemeColors };
}

const Container = styled(motion.div)<ContainerProps>`
  max-width: 1400px;
  margin: 80px auto 0;
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

interface ControlPanelProps {
  theme: { colors: ThemeColors };
}

const ControlPanel = styled(motion.div)<ControlPanelProps>`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

interface GameControlBarProps {
  theme: { colors: ThemeColors };
}

const GameControlBar = styled.div<GameControlBarProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: ${({ theme }) => theme.colors.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

interface ControlButtonProps {
  danger?: boolean;
  primary?: boolean;
  theme: { colors: ThemeColors };
}

const ControlButton = styled.button<ControlButtonProps>`
  background: ${props => props.danger ? '#e74c3c' : props.primary ? props.theme.colors.accent : props.theme.colors.primary};
  color: ${props => (props.danger || props.primary) ? '#fff' : props.theme.colors.text};
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    opacity: 0.9;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ControlButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

interface TabContainerProps {
  theme: { colors: ThemeColors };
}

const TabContainer = styled.div<TabContainerProps>`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.secondary};
`;

interface TabProps {
  active?: boolean;
  theme: { colors: ThemeColors };
}

const Tab = styled.div<TabProps>`
  padding: 12px 20px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? props.theme.colors.accent : props.theme.colors.text};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.accent : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

interface TabContentProps {
  active: boolean;
  theme: { colors: ThemeColors };
}

const TabContent = styled.div<TabContentProps>`
  display: ${props => props.active ? 'block' : 'none'};
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    
    &:hover {
      background: ${({ theme }) => theme.colors.accent};
    }
  }
`;

interface GameStatusBarProps {
  theme: { colors: ThemeColors };
}

const GameStatusBar = styled.div<GameStatusBarProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: ${({ theme }) => theme.colors.accent};
  border-radius: 8px;
  margin-bottom: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`;

interface StatusMessageProps {
  theme: { colors: ThemeColors };
}

const StatusMessage = styled.div<StatusMessageProps>`
  text-align: center;
  grid-column: 1 / -1;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;

  p {
    margin-top: 10px;
    opacity: 0.8;
  }
`;

const WaitingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 16px;
  z-index: 10;
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Game: React.FC = () => {
  const { gameId: routeGameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<string>('moves');
  
  const { 
    socket,
    joinGame, 
    isGameActive, 
    isWaitingForPlayer,
    status, 
    moveHistory,
    game, 
    gameId, 
    playerColor, 
    boardFlipped, 
    setBoardFlipped,
    timeRemaining,
    resetGameState,
    resignGame,
    cancelGame,
    offerDraw,
    acceptDraw,
    declineDraw,
    drawOffered,
    drawOfferFrom,
    isAIGame,
    gameOver,
    gameResult,
    setGameForReview
  } = useGame();
  
  // Original time control state and effect removed since progress bar has been removed
  
  const handleNewGame = useCallback(() => {
    resetGameState();
    navigate('/');
  }, [resetGameState, navigate]);

  const handleFlipBoard = useCallback(() => {
    setBoardFlipped(!boardFlipped);
  }, [setBoardFlipped, boardFlipped]);
  
  const handleReview = useCallback(() => {
    console.log("Review button clicked");
    console.log("Player color:", playerColor);
    console.log("Move history:", moveHistory);
    
    try {
      // Use the ReviewService to prepare the game for review
      const reviewResult = ReviewService.prepareGameForReview({
        moveHistory,
        playerColor,
        isAIGame
      });
      
      if (reviewResult.success) {
        console.log("Successfully prepared game for review");
      } else {
        console.warn(`Some moves (${reviewResult.moveResults.failedMoves}) could not be applied. The review may be incomplete.`);
      }
      
      // If we have the original game instance, try to use its PGN as a backup
      if (game && typeof game.pgn === 'function') {
        try {
          const originalPgn = game.pgn();
          console.log("Original game PGN available:", originalPgn);
          
          // If our reconstructed PGN has fewer moves than the original game,
          // use the original PGN instead
          const reconstructedMoveCount = (reviewResult.pgn.match(/\d+\./g) || []).length;
          const originalMoveCount = (originalPgn.match(/\d+\./g) || []).length;
          
          if (originalMoveCount > reconstructedMoveCount) {
            console.log(`Using original PGN (${originalMoveCount} moves) instead of reconstructed PGN (${reconstructedMoveCount} moves)`);
            
            // Navigate to the analysis page with the original PGN data
            navigate('/analysis', { 
              state: { 
                pgn: originalPgn
              } 
            });
            return;
          }
        } catch (pgnError) {
          console.error("Error getting original PGN:", pgnError);
        }
      }
      
      // Navigate to the analysis page with the reconstructed PGN data
      navigate('/analysis', { 
        state: { 
          pgn: reviewResult.pgn
        } 
      });
      
      console.log("Navigating to analysis page with PGN data");
    } catch (error) {
      console.error("Error in review process:", error);
      alert("An error occurred while preparing the analysis. Please try again.");
    }
  }, [moveHistory, navigate, isAIGame, playerColor, game]);

  useEffect(() => {
    if (routeGameId && !isGameActive) {
      joinGame(routeGameId);
    }
  }, [routeGameId, joinGame, isGameActive]);

  useEffect(() => {
    let navigationTimer: NodeJS.Timeout;
    // Only set up navigation timer if it's not a game over state
    if ((status.includes('Game not found') || status.includes('Failed to join')) && 
        !gameOver && // Don't redirect if game over modal is showing
        !isAIGame) {
      navigationTimer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    }
    return () => {
      if (navigationTimer) clearTimeout(navigationTimer);
    };
}, [status, navigate, isAIGame, gameOver]); // Add gameOver to dependencies



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

// Before the return statement with redirection
if ((status.includes('Game not found') || status.includes('Failed to join')) && !isAIGame) {
  return (
    <Container
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <NavBar />
      <StatusMessage>
        {status}
        <p>Redirecting to home page...</p>
      </StatusMessage>
    </Container>
  );
}


  return (
    <Container
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <NavBar />
      <GameResultModal 
        show={gameOver} 
        result={gameResult || ''} 
        onNewGame={handleNewGame}
        onReview={handleReview}
      />
      <BoardWrapper>
        {isWaitingForPlayer && (
          <WaitingOverlay>
            <h2>Waiting for Opponent</h2>
            <p>Share the game ID with a friend to play together</p>
            <div className="spinner"></div>
            <p style={{ marginTop: '1.5rem' }}>Game ID: <strong>{gameId}</strong></p>
          </WaitingOverlay>
        )}
        <Board 
          boardFlipped={boardFlipped}
          onBoardFlip={(flipped) => setBoardFlipped(flipped)}
        />
      </BoardWrapper>
      <ControlPanel>
        <GameControlBar>
          <ControlButtonGroup>
            <ControlButton primary onClick={handleFlipBoard}>
              Flip Board
            </ControlButton>
            <ControlButton onClick={handleReview}>
              Review Game
            </ControlButton>
          </ControlButtonGroup>
          
          <ControlButtonGroup>
            {!gameOver && (
              <>
                {isWaitingForPlayer ? (
                  // Show Cancel Game button when waiting for player
                  <ControlButton danger onClick={cancelGame}>
                    Cancel Game
                  </ControlButton>
                ) : (
                  // Show normal game controls when game is active with both players
                  <>
                    {!drawOffered && !isAIGame && (
                      <ControlButton onClick={offerDraw}>
                        Offer Draw
                      </ControlButton>
                    )}
                    {drawOffered && drawOfferFrom !== playerColor && (
                      <>
                        <ControlButton primary onClick={acceptDraw}>
                          Accept Draw
                        </ControlButton>
                        <ControlButton onClick={declineDraw}>
                          Decline
                        </ControlButton>
                      </>
                    )}
                    <ControlButton danger onClick={resignGame}>
                      Resign
                    </ControlButton>
                  </>
                )}
              </>
            )}
            {gameOver && (
              <ControlButton primary onClick={handleNewGame}>
                New Game
              </ControlButton>
            )}
          </ControlButtonGroup>
        </GameControlBar>
        
        {!isAIGame && (
          <Timer 
            whiteTime={timeRemaining.white}
            blackTime={timeRemaining.black}
            isWhiteTurn={game.turn() === 'w'}
            isGameActive={isGameActive}
            initialTime={600} // Default to 10 minutes (600 seconds)
          />
        )}
        
        <TabContainer>
          <Tab 
            active={activeTab === 'moves'} 
            onClick={() => setActiveTab('moves')}
          >
            Moves
          </Tab>
          <Tab 
            active={activeTab === 'info'} 
            onClick={() => setActiveTab('info')}
          >
            Info
          </Tab>
        </TabContainer>
        
        <TabContent active={activeTab === 'moves'}>
          <CapturedPieces position={game.fen()} />
          <MoveHistory 
            moves={moveHistory}
            selectedMoveIndex={-1}
            onMoveClick={(index: number) => {}}
            onFirstMove={() => {}}
            onPreviousMove={() => {}}
            onNextMove={() => {}}
            onLastMove={() => {}}
          />
        </TabContent>
        
        
        <TabContent active={activeTab === 'info'}>
          <GameStatusBar>{status}</GameStatusBar>
          <GameInfo />
          
          {/* Display AI difficulty and depth info when playing against AI */}
          {isAIGame && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              background: theme.colors.primary, 
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: theme.colors.accent }}>AI Information</h4>
              <p style={{ margin: '5px 0' }}>
                <strong>Difficulty Level:</strong> {localStorage.getItem('aiLevel') || '10'}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Search Depth:</strong> {localStorage.getItem('aiDepth') || '3'}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                Higher depth means stronger play but may take longer to calculate moves.
              </p>
            </div>
          )}
        </TabContent>
      </ControlPanel>
    </Container>
  );
};

export default Game;
