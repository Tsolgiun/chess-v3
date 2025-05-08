import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Chess } from 'chess.js';
import io, { Socket } from 'socket.io-client';
import { GameContextType, GameProviderProps, Move, GameOptions, PlayerColor } from '../types';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    // State declarations
    const [socket, setSocket] = useState<Socket | null>(null);
    const [game, setGame] = useState<Chess>(() => new Chess());
    const [gameId, setGameId] = useState<string | null>(null);
    const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [isWaitingForPlayer, setIsWaitingForPlayer] = useState<boolean>(false);
    const [isAIGame, setIsAIGame] = useState<boolean>(false);
    const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
    const [boardFlipped, setBoardFlipped] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('Welcome to Online Chess!');
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameResult, setGameResult] = useState<string | null>(null);
    const [gameResultReason, setGameResultReason] = useState<string | null>(null);
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
    const [drawOffered, setDrawOffered] = useState<boolean>(false);
    const [drawOfferFrom, setDrawOfferFrom] = useState<string | null>(null);
    const [opponentPlatform, setOpponentPlatform] = useState<string | null>(null);
    const [timeControl, setTimeControl] = useState<{ white: number; black: number }>({ white: 600, black: 600 });
    const [moveHistory, setMoveHistory] = useState<string[]>([]); // Track all moves
    const [capturedPieces, setCapturedPieces] = useState<{ white: string[]; black: string[] }>({ white: [], black: [] });
    const [currentPosition, setCurrentPosition] = useState<string>('');
    const [evaluation, setEvaluation] = useState<any>(null);
    const [analysisLines, setAnalysisLines] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    
    // Review mode state
    const [reviewFen, setReviewFen] = useState<string | null>(null);
    const [reviewMoves, setReviewMoves] = useState<string[]>([]);
    const [reviewGameId, setReviewGameId] = useState<string | null>(null);

    // Utility functions
    const updateStatus = useCallback((currentGame: Chess) => {
        let statusText = '';
        
        if (currentGame.isGameOver()) {
            if (currentGame.isCheckmate()) {
                statusText = `Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins!`;
                setGameResultReason('Checkmate');
            } else if (currentGame.isDraw()) {
                if (currentGame.isStalemate()) {
                    statusText = 'Game over! Stalemate!';
                    setGameResultReason('Stalemate');
                } else if (currentGame.isThreefoldRepetition()) {
                    statusText = 'Game over! Draw by threefold repetition!';
                    setGameResultReason('Threefold repetition');
                } else if (currentGame.isInsufficientMaterial()) {
                    statusText = 'Game over! Draw by insufficient material!';
                    setGameResultReason('Insufficient material');
                } else {
                    statusText = 'Game over! Draw!';
                    setGameResultReason('Draw');
                }
            }
            setGameOver(true);
            setGameResult(statusText);
        } else {
            statusText = `${currentGame.turn() === 'w' ? 'White' : 'Black'} to move`;
            if (currentGame.isCheck()) {
                statusText += ', Check!';
            }
        }
        
        setStatus(statusText);
        setCurrentPosition(currentGame.fen());
    }, []);

    // Update captured pieces
    const updateCapturedPieces = useCallback((currentGame: Chess) => {
        const pieces = {
            white: [] as string[],
            black: [] as string[]
        };
        
        // Standard starting pieces
        const startingPieces = {
            p: 8, n: 2, b: 2, r: 2, q: 1, k: 1
        };
        
        // Count pieces on the board
        const board = currentGame.board();
        const piecesOnBoard = {
            w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
            b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
        };
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = board[i][j];
                if (square) {
                    piecesOnBoard[square.color][square.type]++;
                }
            }
        }
        
        // Calculate captured pieces
        for (const pieceType in startingPieces) {
            const whiteCaptured = startingPieces[pieceType as keyof typeof startingPieces] - piecesOnBoard.w[pieceType as keyof typeof piecesOnBoard.w];
            const blackCaptured = startingPieces[pieceType as keyof typeof startingPieces] - piecesOnBoard.b[pieceType as keyof typeof piecesOnBoard.b];
            
            // Add captured white pieces to black's captured list
            for (let i = 0; i < whiteCaptured; i++) {
                pieces.black.push(pieceType);
            }
            
            // Add captured black pieces to white's captured list
            for (let i = 0; i < blackCaptured; i++) {
                pieces.white.push(pieceType);
            }
        }
        
        setCapturedPieces(pieces);
    }, []);

    // Player move function
    const makeMove = useCallback((move: Move): boolean => {
        if (!isGameActive && !isAIGame && !isAnalyzing) return false;
        if (gameOver && !isAnalyzing) return false;
        
        try {
            const newGame = new Chess(game.fen());
            const result = newGame.move(move);
            
            if (result) {
                setGame(newGame);
                setLastMove({ from: move.from, to: move.to });
                
                // Add the move to the moves array
                const moveNotation = result.san; // Standard Algebraic Notation
                setMoveHistory(prevMoves => [...prevMoves, moveNotation]);
                
                updateStatus(newGame);
                updateCapturedPieces(newGame);

                if (socket && !isAIGame && !isAnalyzing) {
                    socket.emit('move', move);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error making move:', error);
        }
        return false;
    }, [game, isGameActive, isAIGame, isAnalyzing, gameOver, socket, updateStatus, updateCapturedPieces]);

    // Game management functions
    const resetGame = useCallback(() => {
        const newGame = new Chess();
        setGame(newGame);
        setGameId(null);
        setPlayerColor(null);
        setIsGameActive(false);
        setIsWaitingForPlayer(false);
        setIsAIGame(false);
        setIsAIThinking(false);
        setBoardFlipped(false);
        setGameOver(false);
        setGameResult(null);
        setGameResultReason(null);
        setLastMove(null);
        setDrawOffered(false);
        setDrawOfferFrom(null);
        setOpponentPlatform(null);
        setTimeControl({ white: 600, black: 600 });
        setMoveHistory([]); // Reset moves history
        setCapturedPieces({ white: [], black: [] });
        setCurrentPosition(newGame.fen());
        setEvaluation(null);
        setAnalysisLines([]);
        setIsAnalyzing(false);
        setStatus('Welcome to Online Chess!');
    }, []);

    const startNewGame = useCallback((options: GameOptions) => {
        resetGame();
        
        const newGame = options.startPosition 
            ? new Chess(options.startPosition) 
            : new Chess();
        
        setGame(newGame);
        setCurrentPosition(newGame.fen());
        setPlayerColor(options.color || PlayerColor.WHITE);
        setBoardFlipped(options.color === PlayerColor.BLACK);
        setIsGameActive(true);
        
        if (options.againstAI) {
            setIsAIGame(true);
            // Additional AI game setup logic would go here
        }
        
        if (options.timeControl) {
            setTimeControl({ 
                white: options.timeControl.initial, 
                black: options.timeControl.initial 
            });
        }
        
        updateStatus(newGame);
    }, [resetGame, updateStatus]);

const flipBoard = useCallback((flipped?: boolean) => {
    if (flipped !== undefined) {
        setBoardFlipped(flipped);
    } else {
        setBoardFlipped(prev => !prev);
    }
}, []);

    const updateTimeControl = useCallback((color: PlayerColor, time: number) => {
        setTimeControl(prev => ({
            ...prev,
            [color]: time
        }));
    }, []);

    // Socket initialization and event handlers
    useEffect(() => {
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });
        
        // Log connection events for debugging
        newSocket.on('connect', () => {
            console.log('Socket connected successfully');
            
            // Send platform information
            newSocket.emit('setPlatform', { platform: 'web' });
        });
        
        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
        
        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
        
        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
        });
        
        (window as any).socket = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.close();
            (window as any).socket = null;
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('gameCreated', ({ gameId, color, timeControl, timeRemaining }: any) => {
            setGameId(gameId);
            setPlayerColor(color === 'white' ? PlayerColor.WHITE : PlayerColor.BLACK);
            setIsGameActive(true);
            setIsWaitingForPlayer(true);
            setStatus('Waiting for an opponent to join...');
            const newGame = new Chess();
            setGame(newGame);
            setCurrentPosition(newGame.fen());
            
            // Set time control if provided
            if (timeControl) {
                setTimeControl({
                    white: timeControl.initialTime || 600,
                    black: timeControl.initialTime || 600
                });
            }
        });
        
        // Handle review availability notification
        socket.on('reviewAvailable', ({ gameId, reviewUrl }: any) => {
            console.log(`Review available for game ${gameId} at ${reviewUrl}`);
            // We could store this information if needed
        });

        socket.on('gameJoined', ({ gameId, color, fen, opponentPlatform, timeControl, timeRemaining, moveHistory }: any) => {
            setGameId(gameId);
            setPlayerColor(color === 'white' ? PlayerColor.WHITE : PlayerColor.BLACK);
            setIsGameActive(true);
            setIsWaitingForPlayer(false);
            setOpponentPlatform(opponentPlatform);
            setStatus(`Game started! You are playing as ${color === 'white' ? 'White' : 'Black'}.`);
            
            if (fen) {
                const newGame = new Chess(fen);
                setGame(newGame);
                setCurrentPosition(newGame.fen());
                updateCapturedPieces(newGame);
                
                // If we have a move history from the server, use it
                if (moveHistory && Array.isArray(moveHistory)) {
                    setMoveHistory(moveHistory);
                } else {
                    // Otherwise, try to reconstruct the move history from the current position
                    try {
                        // Create a temporary game to get the move history
                        const tempGame = new Chess();
                        
                        // Try to replay the moves to get to the current position
                        const pgn = newGame.pgn();
                        if (pgn) {
                            tempGame.loadPgn(pgn);
                            const moveHistory = tempGame.history();
                            setMoveHistory(moveHistory);
                        }
                    } catch (error) {
                        console.error('Failed to reconstruct move history:', error);
                    }
                }
            }
            
            if (color === 'black') {
                setBoardFlipped(true);
            }
            
            // Set time control if provided
            if (timeControl) {
                setTimeControl({
                    white: timeControl.initialTime || 600,
                    black: timeControl.initialTime || 600
                });
            }
        });
        
        // Handle time updates from server
        socket.on('timeUpdate', (times: any) => {
            if (times && times.white !== undefined && times.black !== undefined) {
                setTimeControl({
                    white: times.white,
                    black: times.black
                });
            }
        });

        socket.on('opponentJoined', ({ platform }: any) => {
            setStatus('Game started! You are playing as White.');
            setIsWaitingForPlayer(false);
            setOpponentPlatform(platform);
        });

        socket.on('moveMade', ({ from, to, promotion, fen, moveNotation }: any) => {
            // Update the game with the new FEN
            const newGame = new Chess(fen);
            setGame(newGame);
            setCurrentPosition(newGame.fen());
            setLastMove({ from, to });
            updateCapturedPieces(newGame);
            
            // Get the move notation
            let notation = moveNotation;
            if (!notation) {
                // Fallback if moveNotation is not provided
                try {
                    const tempGame = new Chess(game.fen());
                    const moveResult = tempGame.move({ from, to, promotion });
                    if (moveResult) {
                        notation = moveResult.san;
                    }
                } catch (error) {
                    console.error('Error getting move notation:', error);
                }
            }
            
            // Add the move to the moves array if it's not already there
            if (notation) {
                setMoveHistory(prevMoves => {
                    // Check if this is a new move (not already in the array)
                    // This prevents duplicate moves when the server sends back our own move
                    const lastMove = prevMoves.length > 0 ? prevMoves[prevMoves.length - 1] : null;
                    if (lastMove !== notation) {
                        return [...prevMoves, notation];
                    }
                    return prevMoves;
                });
            }
            
            updateStatus(newGame);
        });

        socket.on('error', ({ message }: any) => {
            setStatus(`Error: ${message}`);
        });

        socket.on('gameOver', ({ result, reason }: any) => {
            setGameOver(true);
            setGameResult(result);
            setGameResultReason(reason);
            setStatus(result);
        });

        socket.on('drawOffered', ({ from }: any) => {
            setDrawOffered(true);
            setDrawOfferFrom(from);
            setStatus(`${from === 'white' ? 'White' : 'Black'} offers a draw`);
        });

        socket.on('drawDeclined', ({ from }: any) => {
            setDrawOffered(false);
            setDrawOfferFrom(null);
            setStatus(`${from === 'white' ? 'White' : 'Black'} declined the draw offer`);
        });

        socket.on('opponentDisconnected', () => {
            setStatus('Your opponent has disconnected.');
            setIsGameActive(false);
        });

        return () => {
            if (socket) {
                socket.off('gameCreated');
                socket.off('gameJoined');
                socket.off('opponentJoined');
                socket.off('moveMade');
                socket.off('error');
                socket.off('gameOver');
                socket.off('opponentDisconnected');
                socket.off('drawOffered');
                socket.off('drawDeclined');
                socket.off('timeUpdate');
                socket.off('reviewAvailable');
            }
        };
    }, [socket, game, updateStatus, updateCapturedPieces]);

    // Analysis functions
    const startAnalysis = useCallback(() => {
        setIsAnalyzing(true);
        // Actual analysis implementation would go here
    }, []);

    const stopAnalysis = useCallback(() => {
        setIsAnalyzing(false);
        setEvaluation(null);
        setAnalysisLines([]);
    }, []);

    // Game actions
    const joinGame = useCallback((gameId: string) => {
        if (socket) {
            socket.emit('joinGame', { gameId });
        } else {
            setStatus('Error: Socket connection not available');
        }
    }, [socket]);

    const resignGame = useCallback(() => {
        if (isAIGame && isGameActive) {
            const winner = playerColor === PlayerColor.WHITE ? 'Black' : 'White';
            const result = `${winner} wins by resignation`;
            
            setGameOver(true);
            setGameResult(result);
            setGameResultReason('Resignation');
            setIsGameActive(false);
            setStatus(result); // Simple status that won't trigger navigation
        } else if (socket && isGameActive && !isWaitingForPlayer) {
            socket.emit('resign');
        }
    }, [socket, isGameActive, isWaitingForPlayer, isAIGame, playerColor]);
    
    
    
    
    
    
    const cancelGame = useCallback(() => {
        if (socket && isGameActive && isWaitingForPlayer) {
            // For games in waiting state, we'll just reset the game state
            resetGame();
            // Navigate back to home page will be handled by the component
        }
    }, [socket, isGameActive, isWaitingForPlayer, resetGame]);

    const offerDraw = useCallback(() => {
        if (socket && isGameActive) {
            socket.emit('offerDraw');
        }
    }, [socket, isGameActive]);

    const acceptDraw = useCallback(() => {
        if (socket && isGameActive && drawOffered) {
            socket.emit('acceptDraw');
        }
    }, [socket, isGameActive, drawOffered]);

    const declineDraw = useCallback(() => {
        if (socket && isGameActive && drawOffered) {
            socket.emit('declineDraw');
            setDrawOffered(false);
            setDrawOfferFrom(null);
        }
    }, [socket, isGameActive, drawOffered]);

    const setGameForReview = useCallback((gameInstance: any, gameMoves: string[], reviewId: string) => {
        try {
            setReviewFen(gameInstance.fen());
            setReviewMoves(gameMoves);
            setReviewGameId(reviewId);
            return true;
        } catch (error) {
            console.error('Error setting game for review:', error);
            return false;
        }
    }, []);

    // Game creation functions
    const createGame = useCallback((options?: GameOptions) => {
        if (socket) {
            socket.emit('createGame', options);
            setStatus('Creating a new game...');
        } else {
            setStatus('Error: Socket connection not available');
        }
    }, [socket]);

    // Reference to store the Stockfish engine instance
    const stockfishEngine = React.useRef<any>(null);
    
    // Function to make an AI move using Stockfish
    const makeAIMove = useCallback(async () => {
        if (!isAIGame || !isGameActive || gameOver) return;
        
        // Only make a move if it's the AI's turn
        const isPlayerTurn = (playerColor === PlayerColor.WHITE && game.turn() === 'w') || 
                            (playerColor === PlayerColor.BLACK && game.turn() === 'b');
        
        if (isPlayerTurn) return;
        
        setIsAIThinking(true);
        setStatus('AI is thinking...');
        
        try {
            // Create Stockfish engine instance if not already created
            if (!stockfishEngine.current) {
                const { Stockfish17 } = await import('../lib/engine/stockfish17');
                stockfishEngine.current = await Stockfish17.create(false);
            }
            
            // Get the best move from the engine based on current position and difficulty
            const aiLevel = parseInt(localStorage.getItem('aiLevel') || '10');
            
            // Calculate search depth based on difficulty level (1-20)
            // This provides a more granular progression of difficulty
            let searchDepth;
            if (aiLevel <= 3) {
                searchDepth = 1;
            } else if (aiLevel <= 6) {
                searchDepth = 2;
            } else if (aiLevel <= 9) {
                searchDepth = 3;
            } else if (aiLevel <= 12) {
                searchDepth = 4;
            } else if (aiLevel <= 15) {
                searchDepth = 5;
            } else if (aiLevel <= 18) {
                searchDepth = 6;
            } else {
                searchDepth = 7;
            }
            
            // Store the current depth for display purposes
            localStorage.setItem('aiDepth', searchDepth.toString());
            
            // Validate the current position before sending to engine
            const currentFen = game.fen();
            console.log('Current FEN:', currentFen);
            
            // Get all legal moves for the current position
            const tempGame = new Chess(currentFen);
            const legalMoves = tempGame.moves({ verbose: true });
            
            if (legalMoves.length === 0) {
                console.log('No legal moves available');
                return;
            }
            
            // Try to get a move from the engine with multiple attempts if needed
            let engineMove = null;
            let attempts = 0;
            const maxAttempts = 2;
            
            while (!engineMove && attempts < maxAttempts) {
                try {
                    engineMove = await stockfishEngine.current.getEngineNextMove(
                        currentFen,
                        aiLevel,
                        searchDepth + attempts // Increase depth on retry for better chances
                    );
                    
                    if (!engineMove) {
                        console.warn(`Engine attempt ${attempts + 1} did not return a move, retrying...`);
                        attempts++;
                        
                        // Short delay before retry
                        if (attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    }
                } catch (error) {
                    console.warn(`Engine attempt ${attempts + 1} failed:`, error);
                    attempts++;
                    
                    // Short delay before retry
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
            }
            
            let moveSuccessful = false;
            
            if (engineMove) {
                try {
                    console.log('Engine returned move:', engineMove);
                    
                    // Parse the move string (e.g., "e2e4")
                    const from = engineMove.substring(0, 2);
                    const to = engineMove.substring(2, 4);
                    const promotion = engineMove.length > 4 ? engineMove.substring(4, 5) : undefined;
                    
                    // Check if the move is in the list of legal moves
                    const isValidMove = legalMoves.some(m => 
                        m.from === from && m.to === to && 
                        (!promotion || m.promotion === promotion)
                    );
                    
                    if (!isValidMove) {
                        console.error('Move not valid for current position:', engineMove);
                        throw new Error('Move not valid for current position');
                    }
                    
                    // Make the move in the actual game
                    moveSuccessful = makeMove({ from, to, promotion });
                    if (moveSuccessful) {
                        console.log('Successfully made engine move:', engineMove);
                    } else {
                        console.error('Failed to make move in game:', engineMove);
                    }
                } catch (error) {
                    console.error('Error processing engine move:', error);
                }
            } else {
                console.warn('Engine did not return a valid move after all attempts');
            }
            
            // If the engine move was invalid or not provided, use an improved fallback mechanism
            if (!moveSuccessful) {
                console.log('Engine provided invalid move, generating a smart fallback move');
                
                if (legalMoves.length > 0) {
                    // Enhanced move selection strategy
                    // 1. Prioritize moves that give check
                    // 2. Prioritize captures by value (queen > rook > bishop/knight > pawn)
                    // 3. Prioritize promotions
                    // 4. Add some randomness to avoid predictability
                    
                    // Piece values for capture evaluation
                    const pieceValues: {[key: string]: number} = {
                        'p': 1,
                        'n': 3,
                        'b': 3,
                        'r': 5,
                        'q': 9
                    };
                    
                    // Score each move
                    const scoredMoves = legalMoves.map(move => {
                        let score = 0;
                        
                        // Check if this move gives check
                        const testGame = new Chess(currentFen);
                        testGame.move({ from: move.from, to: move.to, promotion: move.promotion });
                        if (testGame.isCheck()) {
                            score += 5;
                        }
                        
                        // Score captures by piece value
                        if (move.captured) {
                            score += pieceValues[move.captured] * 2;
                        }
                        
                        // Score promotions
                        if (move.promotion) {
                            score += pieceValues[move.promotion] * 3;
                        }
                        
                        // Add small random factor (0-1)
                        score += Math.random();
                        
                        return { move, score };
                    });
                    
                    // Sort by score (highest first)
                    scoredMoves.sort((a, b) => b.score - a.score);
                    
                    // Select one of the top moves with some randomness
                    // Take one of the top 3 moves (or fewer if less available)
                    const topMoveCount = Math.min(3, scoredMoves.length);
                    const selectedIndex = Math.floor(Math.random() * topMoveCount);
                    const selectedMove = scoredMoves[selectedIndex].move;
                    
                    console.log('Selected smart fallback move:', selectedMove);
                    
                    // Make the move
                    makeMove({ 
                        from: selectedMove.from, 
                        to: selectedMove.to,
                        promotion: selectedMove.promotion
                    });
                }
            }
        } catch (error) {
            console.error('Error making AI move:', error);
            
            // Last resort fallback - make any legal move
            try {
                const currentFen = game.fen();
                const tempGame = new Chess(currentFen);
                const legalMoves = tempGame.moves({ verbose: true });
                
                if (legalMoves.length > 0) {
                    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                    console.log('Using emergency random move:', randomMove);
                    
                    makeMove({ 
                        from: randomMove.from, 
                        to: randomMove.to,
                        promotion: randomMove.promotion
                    });
                }
            } catch (fallbackError) {
                console.error('Even fallback move selection failed:', fallbackError);
            }
        } finally {
            setIsAIThinking(false);
        }
    }, [game, isAIGame, isGameActive, gameOver, playerColor, makeMove]);
    
    // Effect to trigger AI moves
    useEffect(() => {
        if (!isAIGame || !isGameActive || gameOver || isAIThinking) return;
        
        // Check if it's AI's turn
        const isPlayerTurn = (playerColor === PlayerColor.WHITE && game.turn() === 'w') || 
                            (playerColor === PlayerColor.BLACK && game.turn() === 'b');
        
        if (!isPlayerTurn) {
            // Add a small delay before AI makes a move to make it feel more natural
            const timer = setTimeout(() => {
                makeAIMove();
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [isAIGame, isGameActive, gameOver, isAIThinking, game, playerColor, makeAIMove]);
    
    const startAIGame = useCallback((color: string, difficulty: number) => {
        resetGame();
        
        // Set up AI game
        setIsAIGame(true);
        setIsGameActive(true);
        setPlayerColor(color === 'white' ? PlayerColor.WHITE : PlayerColor.BLACK);
        setBoardFlipped(color === 'black');
        
        // Store AI difficulty level in localStorage for use in makeAIMove
        localStorage.setItem('aiLevel', difficulty.toString());
        
        // Generate a unique ID for the AI game
        const aiGameId = `AI-${Date.now()}`;
        setGameId(aiGameId);
        
        setStatus(`Game started! You are playing as ${color} against AI (Level ${difficulty})`);
        
        // If player is black, AI (white) will make the first move automatically via the effect hook
    }, [resetGame]);

    const contextValue: GameContextType = {
        game,
        playerColor: playerColor || PlayerColor.WHITE,
        isGameActive,
        isWaitingForPlayer,
        isAIGame,
        isAIThinking,
        lastMove,
        makeMove,
        resetGame,
        startNewGame,
        flipBoard,
        boardFlipped,
        timeControl,
        updateTimeControl,
        gameOver,
        gameResult,
        gameResultReason,
        capturedPieces,
        moveHistory,
        currentPosition,
        evaluation,
        analysisLines,
        startAnalysis,
        stopAnalysis,
        isAnalyzing,
        
        // Additional properties needed by Game.js
        status,
        socket,
        joinGame,
        gameId,
        setBoardFlipped: flipBoard,
        timeRemaining: timeControl, // Alias for timeControl
        resetGameState: resetGame, // Alias for resetGame
        resignGame,
        cancelGame,
        offerDraw,
        acceptDraw,
        declineDraw,
        drawOffered,
        drawOfferFrom,
        setGameForReview,
        opponentPlatform,
        
        // Game creation functions
        createGame,
        startAIGame
    };

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

export default GameContext;
