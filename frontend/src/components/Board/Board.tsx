import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useGame } from '../../context/GameContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';
import { loadSounds, playMoveSound } from '../../utils/sounds';
import { BoardProps } from '../../types/props';
import { Chess } from 'chess.js';

const BoardWrapper = styled.div<{ isDisabled?: boolean }>`
    width: min(80vw, 640px);
    margin: 0 auto;
    position: relative;
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 12px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease, background-color 0.3s ease;
    ${props => props.isDisabled && `
        pointer-events: none;
        opacity: 0.8;
    `}
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.35);
    }
`;

const BoardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    border: 2px solid ${({ theme }) => theme.colors.border};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    aspect-ratio: 1;
    position: relative;
    border-radius: 4px 4px 0 0;
    overflow: hidden;
`;

// Evaluation bar components
const EvaluationBarContainer = styled.div`
    width: 100%;
    height: 30px;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    display: flex;
    flex-direction: row;
    margin-bottom: 20px; /* Add space for the detailed evaluation */
`;

const EvaluationDetail = styled.div`
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.85rem;
    background: ${({ theme }) => theme.colors.primary};
    padding: 4px 8px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 10;
    white-space: nowrap;
`;

interface EvaluationValueProps {
    percentage: number;
    theme: { colors: ThemeColors };
}

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

const EvaluationText = styled.div`
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

interface SquareProps {
    isLight: boolean;
    isSelected?: boolean;
    isValidMove?: boolean;
    isClickable?: boolean;
    isLastMove?: boolean;
    theme?: { 
        colors: ThemeColors;
        boardColors: {
            lightSquare: string;
            darkSquare: string;
        };
    };
}

const Square = styled.div<SquareProps>`
    aspect-ratio: 1;
    position: relative;
    background-color: ${props => (props.isLight ? props.theme.boardColors.lightSquare : props.theme.boardColors.darkSquare)};
    cursor: ${props => props.isClickable ? 'pointer' : 'default'};
    transition: all 0.2s ease;
    
    &:hover {
        transform: ${props => props.isClickable ? 'scale(1.01)' : 'none'};
        box-shadow: ${props => props.isClickable ? 'inset 0 0 30px rgba(255, 255, 255, 0.1)' : 'none'};
    }
    
    ${props => props.isSelected && `
        &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: ${(p: SquareProps) => p.theme?.colors.moveHighlight};
            z-index: 1;
        }
    `}

    ${props => props.isValidMove && `
        &::after {
            content: '';
            position: absolute;
            width: 33%;
            height: 33%;
            border-radius: 50%;
            background-color: ${props.isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)'};
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
            transition: all 0.2s ease;
        }
        
        &:hover::after {
            transform: translate(-50%, -50%) scale(1.2);
            background-color: ${props.isLight ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.22)'};
        }
    `}

    ${props => props.isLastMove && `
        background-color: ${props.isLight 
            ? 'rgba(255, 255, 0, 0.5)' 
            : 'rgba(255, 255, 0, 0.3)'};
        opacity: 0.85;
    `}
`;

interface CoordinateProps {
    isLight: boolean;
    position: 'bottom-left' | 'bottom-right' | 'top-left';
}

const Coordinate = styled.div<CoordinateProps>`
    position: absolute;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px;
    z-index: 1;
    user-select: none;
    opacity: 0.8;
    color: ${props => props.isLight ? '#b58863' : '#f0d9b5'};
    
    ${props => props.position === 'bottom-left' && `
        bottom: 2px;
        left: 2px;
    `}
    
    ${props => props.position === 'bottom-right' && `
        bottom: 2px;
        right: 2px;
    `}
    
    ${props => props.position === 'top-left' && `
        top: 2px;
        left: 2px;
    `}
`;

const moveAnimation = keyframes`
    0% {
        opacity: 0;
        transform: scale(0.8);
    }
    50% {
        opacity: 1;
        transform: scale(1.1);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
`;

const hoverAnimation = keyframes`
    0% {
        filter: brightness(1);
    }
    50% {
        filter: brightness(1.1);
    }
    100% {
        filter: brightness(1);
    }
`;

interface PieceProps {
    image: string;
    isClickable?: boolean;
}

const Piece = styled.div<PieceProps>`
    position: absolute;
    top: 2.5%;
    left: 2.5%;
    width: 95%;
    height: 95%;
    background-image: url(${props => props.image});
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 2;
    pointer-events: none;
    animation: ${moveAnimation} 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
    transition: all 0.2s ease;
    
    ${props => props.isClickable && css`
        cursor: grab;
        animation: ${hoverAnimation} 2s infinite ease-in-out;
        
        &:hover {
            filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.4));
        }
        
        &:active {
            cursor: grabbing;
        }
    `}
`;

const ClassificationBadge = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    width: 24px;
    height: 24px;
    z-index: 3;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ClassificationIcon = styled.img`
    width: 20px;
    height: 20px;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5));
    transition: transform 0.2s ease;
    
    &:hover {
        transform: scale(1.2);
    }
`;

interface DemoPosition {
    board: string;
    flip: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const DEMO_POSITIONS: DemoPosition[] = [
    {
        board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
        flip: false
    },
    {
        board: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1', // Common opening
        flip: false
    },
    {
        board: 'rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 1', // Queens gambit
        flip: true
    }
];

interface ChessPiece {
    type: string;
    color: string;
}

interface Move {
    from: string;
    to: string;
    promotion?: string;
    san?: string;
}

// Convert centipawn evaluation to a percentage (0-100)
const evaluationToPercentage = (cp: number): number => {
    // Sigmoid-like function that maps evaluation to percentage
    return 50 + 50 * (2 / (1 + Math.exp(-cp / 400)) - 1);
};

const Board: React.FC<BoardProps> = ({ 
    demoMode = false, 
    analysisMode = false, 
    position = null, 
    boardFlipped = false, 
    onBoardFlip,
    evaluation = null,
    evaluationType = null,
    showEvaluationBar = false,
    moveClassifications = {}
}) => {
    const gameContext = useGame();
    const theme = useTheme();
    
    // Create a local game instance for demo mode
    const [demoGame, setDemoGame] = useState<Chess>(() => new Chess());
    
    // State for smoothed evaluation
    const [smoothedEvaluation, setSmoothedEvaluation] = useState<number>(0);
    
    // Ref to track previous evaluation to avoid unnecessary updates
    const prevEvaluationRef = useRef<number | null>(null);
    
    // Update smoothed evaluation when evaluation changes
    useEffect(() => {
        if (evaluation !== null) {
            // Always update the ref
            prevEvaluationRef.current = evaluation;
            
            // Store the current value to avoid dependency on smoothedEvaluation
            const currentSmoothedEval = prevEvaluationRef.current !== null ? 
                prevEvaluationRef.current : 0;
            
            // Use a higher smoothing factor for more responsive updates
            const smoothingFactor = 0.5; // Increased from 0.2
            
            // For big jumps, move faster
            if (Math.abs(evaluation - currentSmoothedEval) > 50) {
                // Jump directly to 80% of the target value for large changes
                setSmoothedEvaluation(currentSmoothedEval + 0.8 * (evaluation - currentSmoothedEval));
            } else {
                // Calculate new value based on current evaluation and stored value
                const newValue = currentSmoothedEval + smoothingFactor * (evaluation - currentSmoothedEval);
                setSmoothedEvaluation(newValue);
            }
        }
    }, [evaluation]); // Remove smoothedEvaluation from dependencies
    
    // Calculate evaluation percentage for the bar
    const getEvaluationPercentage = (): number => {
        if (evaluationType === 'mate') {
            // Handle mate scores
            return evaluation && evaluation > 0 
                ? 95  // Winning mate
                : 5;  // Losing mate
        } else {
            // Use the sigmoid function for centipawn evaluation
            return evaluationToPercentage(smoothedEvaluation);
        }
    };
    
    const { 
        game, 
        playerColor, 
        makeMove, 
        isGameActive,
        isAIGame,
        isAIThinking,
        lastMove
    } = analysisMode ? { 
        game: position, 
        playerColor: 'white',
        makeMove: () => true,
        isGameActive: true,
        isAIGame: false,
        isAIThinking: false,
        lastMove: null
    } : demoMode ? {
        game: demoGame,
        playerColor: 'white',
        makeMove: () => true,
        isGameActive: true,
        isAIGame: false,
        isAIThinking: false,
        lastMove: null
    } : gameContext;

    // Use local state for analysis mode board flipping
    const [localBoardFlipped, setLocalBoardFlipped] = useState<boolean>(boardFlipped);
    
    // Update localBoardFlipped when boardFlipped prop changes
    useEffect(() => {
        setLocalBoardFlipped(boardFlipped);
    }, [boardFlipped]);
    
    // Function to handle board flipping
    const handleBoardFlip = (flipped: boolean): void => {
        setLocalBoardFlipped(flipped);
        // Notify parent component if onBoardFlip is provided
        if (onBoardFlip) {
            onBoardFlip(flipped);
        }
    };
    
    const effectiveBoardFlipped = analysisMode ? localBoardFlipped : boardFlipped;
    
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [validMoves, setValidMoves] = useState<string[]>([]);
    const [currentDemoPosition, setCurrentDemoPosition] = useState<number>(0);
    
    // Demo mode auto-rotation
    useEffect(() => {
        if (demoMode) {
            const timer = setInterval(() => {
                setCurrentDemoPosition((prev) => 
                    prev === DEMO_POSITIONS.length - 1 ? 0 : prev + 1
                );
            }, 5000); // Rotate every 5 seconds
            
            return () => clearInterval(timer);
        }
    }, [demoMode]);
    
    // Set up demo position
    useEffect(() => {
        if (demoMode) {
            const position = DEMO_POSITIONS[currentDemoPosition];
            const newDemoGame = new Chess();
            newDemoGame.load(position.board);
            setDemoGame(newDemoGame);
            // Force a re-render by triggering state update
            setSelectedSquare(null);
            setValidMoves([]);
        }
    }, [demoMode, currentDemoPosition]);

    useEffect(() => {
        if (!isGameActive && !demoMode) {
            game.reset();
        }
    }, [game, isGameActive, demoMode]);

    useEffect(() => {
        // Preload images and sounds
        const preloadAssets = async (): Promise<void> => {
            try {
                // Preload images
                const pieces = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
                const colors = ['white', 'black'];
                
                const imagePromises = colors.flatMap(color => 
                    pieces.map(piece => new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = `./pieces/${color}-${piece}.png`;
                    }))
                );

                // Load images and sounds in parallel
                await Promise.all([
                    ...imagePromises,
                    loadSounds()
                ]);
            } catch (error) {
                console.error('Error preloading assets:', error);
            }
        };
        
        preloadAssets();
    }, []);

    const getPieceImage = (piece: ChessPiece | null): string | null => {
        if (!piece) return null;
        const color = piece.color === 'w' ? 'white' : 'black';
        const pieceTypeMap: Record<string, string> = {
            'p': 'pawn',
            'n': 'knight',
            'b': 'bishop',
            'r': 'rook',
            'q': 'queen',
            'k': 'king'
        };
        const pieceType = pieceTypeMap[piece.type.toLowerCase()];
        return `/pieces/${color}-${pieceType}.png`;
    };

    const isSquareClickable = (piece: ChessPiece | null): boolean => {
        if (demoMode) return false;
        if (analysisMode) return true;
        if (!isGameActive) return false;
        if (isAIThinking) return false;
        if (!piece) return validMoves.length > 0;
        return piece.color === (playerColor === 'white' ? 'w' : 'b');
    };

    const handleSquareClick = (square: string): void => {
        const piece = game.get(square);

        if (analysisMode) {
            if (selectedSquare === square) {
                setSelectedSquare(null);
                setValidMoves([]);
                return;
            }

            if (selectedSquare) {
                try {
                    game.move({
                        from: selectedSquare,
                        to: square,
                        promotion: 'q'
                    });
                } catch (error) {
                    console.log('Invalid move');
                }
                setSelectedSquare(null);
                setValidMoves([]);
                return;
            }

            if (piece) {
                setSelectedSquare(square);
                const moves: any[] = game.moves({ square, verbose: true });
                setValidMoves(moves.map(move => move.to));
            }
        } else {
            // Normal game mode logic
            if (selectedSquare === square) {
                setSelectedSquare(null);
                setValidMoves([]);
                return;
            }

            if (selectedSquare) {
                if (validMoves.includes(square)) {
                    const move: Move = {
                        from: selectedSquare,
                        to: square,
                        promotion: 'q'
                    };

                    const result = makeMove(move);
                    if (result) {
                        setSelectedSquare(null);
                        setValidMoves([]);
                        return;
                    }
                }
                setSelectedSquare(null);
                setValidMoves([]);
            }

            if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
                setSelectedSquare(square);
                const moves: any[] = game.moves({ square, verbose: true });
                setValidMoves(moves.map(move => move.to));
            }
        }
    };

    // Determine board orientation
    const boardFiles = effectiveBoardFlipped ? [...FILES].reverse() : FILES;
    const boardRanks = effectiveBoardFlipped ? RANKS : [...RANKS].reverse();

    return (
        <BoardWrapper isDisabled={demoMode}>
            <BoardGrid>
                {boardRanks.map(rank =>
                    boardFiles.map(file => {
                        const square = file + rank;
                        const piece = game.get(square);
                        const fileIndex = FILES.indexOf(file);
                        const rankIndex = RANKS.indexOf(rank);
                        // In standard chess, a1 is always dark (black)
                        // This ensures consistent coloring regardless of player color
                        const isLight = (fileIndex + rankIndex) % 2 === 1;
                        const pieceImage = getPieceImage(piece);
                        const isClickable = isSquareClickable(piece);
                        const isLastMoveSquare = lastMove && 
                            (square === lastMove.from || square === lastMove.to);

                        return (
                            <Square
                                key={square}
                                isLight={isLight}
                                isSelected={!!selectedSquare && selectedSquare === square}
                                isValidMove={validMoves.includes(square)}
                                isClickable={isClickable}
                                isLastMove={isLastMoveSquare || false}
                                onClick={() => handleSquareClick(square)}
                            >
                                {/* Show file coordinates on the bottom rank */}
                                {(!effectiveBoardFlipped ? rank === '1' : rank === '8') && (
                                    <Coordinate 
                                        isLight={isLight}
                                        position="bottom-left"
                                    >
                                        {file}
                                    </Coordinate>
                                )}
                                
                                {/* Show rank coordinates on the leftmost file */}
                                {(!effectiveBoardFlipped ? file === 'a' : file === 'h') && (
                                    <Coordinate 
                                        isLight={isLight}
                                        position="top-left"
                                    >
                                        {rank}
                                    </Coordinate>
                                )}
                                
                                {pieceImage && <Piece image={pieceImage} isClickable={isClickable} />}
                                {moveClassifications && moveClassifications[square] && (
                                    <ClassificationBadge>
                                        <ClassificationIcon 
                                            src={`/icons/${moveClassifications[square]}.png`} 
                                            alt={moveClassifications[square]} 
                                            title={moveClassifications[square].charAt(0).toUpperCase() + moveClassifications[square].slice(1)}
                                        />
                                    </ClassificationBadge>
                                )}
                            </Square>
                        );
                    })
                )}
            </BoardGrid>
            
            {/* Evaluation bar */}
            {analysisMode && showEvaluationBar && (
                <EvaluationBarContainer theme={theme}>
                    <WhiteBar width={`${getEvaluationPercentage()}%`} />
                    <BlackBar width={`${100 - getEvaluationPercentage()}%`} />
                    <EvaluationText theme={theme}>
                        {evaluationType === 'mate' && evaluation !== null
                            ? `M${Math.abs(evaluation)}`
                            : evaluation !== null
                                ? (evaluation / 100).toFixed(1)
                                : '0.0'
                        }
                    </EvaluationText>
                    <EvaluationDetail theme={theme}>
                        {evaluationType === 'mate' && evaluation !== null
                            ? `Mate in ${Math.abs(evaluation)} for ${evaluation > 0 ? 'white' : 'black'}`
                            : evaluation !== null
                                ? `Evaluation: ${(evaluation / 100).toFixed(2)} pawns ${evaluation > 0 ? 'for white' : 'for black'}`
                                : 'Equal position'
                        }
                    </EvaluationDetail>
                </EvaluationBarContainer>
            )}
        </BoardWrapper>
    );
};

export default Board;
