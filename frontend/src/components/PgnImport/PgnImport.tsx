import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';

interface PgnImportProps {
  onImport: (moves: string[], initialFen?: string) => void;
  initialPgn?: string;
}

// Array of month lengths for date calculations
const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const Title = styled.h3<ContainerProps>`
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  transition: color 0.3s ease;
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

const TextArea = styled.textarea<ContainerProps>`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  font-family: monospace;
  resize: vertical;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.accent}33;
  }
`;

const Input = styled.input<ContainerProps>`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.accent}33;
  }
`;

const Button = styled.button<ContainerProps>`
  padding: 10px 20px;
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

const ErrorMessage = styled.div<ContainerProps>`
  color: #e74c3c;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #e74c3c22;
  border-radius: 6px;
  font-size: 0.9rem;
`;

const GameList = styled.div<ContainerProps>`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  margin-bottom: 16px;
  
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

interface GameItemProps {
  selected?: boolean;
  theme: { colors: ThemeColors };
}

const GameItem = styled.div<GameItemProps>`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${props => props.selected ? props.theme.colors.accent + '33' : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const GameTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const GameDetails = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text}99;
`;

interface ChessComGame {
  url: string;
  pgn: string;
  time_class: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
}

interface LichessGame {
  id: string;
  pgn: string;
  speed: string;
  players: {
    white: {
      user?: {
        name: string;
      };
      rating: number;
      aiLevel?: number;
    };
    black: {
      user?: {
        name: string;
      };
      rating: number;
      aiLevel?: number;
    };
  };
}

const PgnImport: React.FC<PgnImportProps> = ({ onImport, initialPgn = '' }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'pgn' | 'chesscom' | 'lichess'>('pgn');
  const [pgnText, setPgnText] = useState<string>(initialPgn);
  
  // Simple effect to update text field when initialPgn changes, but no auto-import
  useEffect(() => {
    if (initialPgn) {
      setPgnText(initialPgn);
      setActiveTab('pgn');
    }
  }, [initialPgn]);
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [games, setGames] = useState<(ChessComGame | LichessGame)[]>([]);
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  
  // Load saved usernames from localStorage
  useEffect(() => {
    const savedChessComUsername = localStorage.getItem('chess-com-username');
    const savedLichessUsername = localStorage.getItem('lichess-username');
    
    if (activeTab === 'chesscom' && savedChessComUsername) {
      setUsername(savedChessComUsername);
    } else if (activeTab === 'lichess' && savedLichessUsername) {
      setUsername(savedLichessUsername);
    }
  }, [activeTab]);

  const handlePgnImport = () => {
    if (!pgnText.trim()) {
      setError('Please enter PGN text');
      return;
    }

    try {
      // Create a new chess instance
      const chess = new Chess();
      
      // Try to load the PGN
      try {
        chess.loadPgn(pgnText);
      } catch (e) {
        setError('Invalid PGN format');
        return;
      }
      
      // Get the move history
      const moves = chess.history();
      
      // Get the initial position if it's not the standard starting position
      // Ensure initialFen is either a string or undefined, never null
      const headerFen = chess.header().FEN;
      const initialFen = headerFen && (chess.header().SetUp === '1' || headerFen !== '') ? headerFen : undefined;
      
      // Call the onImport callback with the moves
      onImport(moves, initialFen);
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error parsing PGN:', error);
      setError('Failed to parse PGN. Please check the format and try again.');
    }
  };

  // Helper function to pad month with leading zero if needed
  const padMonth = (month: number): string => {
    return month < 10 ? `0${month}` : `${month}`;
  };

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setSelectedGameIndex(null);
    setGames([]);
    
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Function to navigate to next month
  const goToNextMonth = () => {
    setSelectedGameIndex(null);
    setGames([]);
    
    const now = new Date();
    const currentMaxYear = now.getFullYear();
    const currentMaxMonth = now.getMonth() + 1;
    
    // Don't allow navigating beyond current month
    if (currentYear === currentMaxYear && currentMonth === currentMaxMonth) {
      return;
    }
    
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Fetch games from Chess.com API
  const fetchChessComGames = useCallback(async () => {
    if (!username.trim()) {
      setError('Please enter a Chess.com username');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGames([]);
    
    try {
      // Save username to localStorage
      localStorage.setItem('chess-com-username', username);
      
      // First try to get archives to check if user exists
      const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
      
      if (!archivesResponse.ok) {
        if (archivesResponse.status === 404) {
          throw new Error(`User "${username}" not found on Chess.com`);
        } else {
          throw new Error(`Failed to fetch archives: ${archivesResponse.status} ${archivesResponse.statusText}`);
        }
      }
      
      const archives = await archivesResponse.json();
      
      if (!archives.archives || archives.archives.length === 0) {
        setError('No game archives found for this user');
        setGames([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch games for the selected month/year
      const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${currentYear}/${padMonth(currentMonth)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`No games found for ${username} in ${currentMonth}/${currentYear}`);
          setGames([]);
        } else {
          throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        
        if (!data.games || !Array.isArray(data.games) || data.games.length === 0) {
          setError(`No games found for ${username} in ${currentMonth}/${currentYear}`);
          setGames([]);
        } else {
          setGames(data.games);
        }
      }
    } catch (error) {
      console.error('Error fetching Chess.com games:', error);
      setError(`${error instanceof Error ? error.message : 'Unknown error'}`);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [username, currentYear, currentMonth]);

  // Fetch games from Lichess.org API
  const fetchLichessGames = useCallback(async () => {
    if (!username.trim()) {
      setError('Please enter a Lichess username');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGames([]);
    
    try {
      // Save username to localStorage
      localStorage.setItem('lichess-username', username);
      
      // Calculate month beginning and ending timestamps
      let monthBeginning = new Date(
        `${currentYear}-${padMonth(currentMonth)}-01T00:00:00Z`
      ).getTime();

      let monthLength = monthLengths[currentMonth - 1];
      // Adjust for leap years
      if (currentMonth === 2 && ((currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0)) {
        monthLength = 29;
      }

      let monthEnding = new Date(
        `${currentYear}-${padMonth(currentMonth)}-${monthLength}T23:59:59Z`
      ).getTime();
      
      // Fetch games from Lichess API
      const response = await fetch(
        `https://lichess.org/api/games/user/${username}?since=${monthBeginning}&until=${monthEnding}&pgnInJson=true`,
        {
          method: "GET",
          headers: {
            "Accept": "application/x-ndjson"
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User "${username}" not found on Lichess`);
        } else {
          throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`);
        }
      }
      
      const gamesNdJson = await response.text();
      const lichessGames = gamesNdJson
        .split("\n")
        .filter(game => game.length > 0)
        .map(game => JSON.parse(game));
      
      if (lichessGames.length === 0) {
        setError(`No games found for ${username} in ${currentMonth}/${currentYear}`);
        setGames([]);
      } else {
        setGames(lichessGames);
      }
    } catch (error) {
      console.error('Error fetching Lichess games:', error);
      setError(`${error instanceof Error ? error.message : 'Unknown error'}`);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [username, currentYear, currentMonth]);

  // Handle game import from either Chess.com or Lichess
  const handleGameImport = () => {
    if (selectedGameIndex === null) {
      setError('Please select a game to import');
      return;
    }

    const selectedGame = games[selectedGameIndex];
    let pgn = '';
    
    // Extract PGN based on the game source
    if ('time_class' in selectedGame) {
      // Chess.com game
      pgn = selectedGame.pgn;
    } else if ('players' in selectedGame) {
      // Lichess game
      pgn = selectedGame.pgn;
    } else {
      setError('Unknown game format');
      return;
    }
    
    try {
      // Create a new chess instance
      const chess = new Chess();
      
      // Try to load the PGN
      try {
        chess.loadPgn(pgn);
      } catch (e) {
        console.error('PGN parsing error:', e);
        setError('Invalid PGN format in the selected game');
        return;
      }
      
      // Get the move history
      const moves = chess.history();
      
      // Get the initial position if it's not the standard starting position
      // Ensure initialFen is either a string or undefined, never null
      const headerFen = chess.header().FEN;
      const initialFen = headerFen && (chess.header().SetUp === '1' || headerFen !== '') ? headerFen : undefined;
      
      // Call the onImport callback with the moves
      onImport(moves, initialFen);
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error parsing game:', error);
      setError('Failed to parse the selected game. Please try another game.');
    }
  };

  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Get player names for display
  const getPlayerNames = (game: ChessComGame | LichessGame): string => {
    if ('white' in game && 'username' in game.white) {
      // Chess.com game
      return `${game.white.username} (${game.white.rating}) vs ${game.black.username} (${game.black.rating})`;
    } else if ('players' in game) {
      // Lichess game
      const whiteName = game.players.white.user?.name || `AI level ${game.players.white.aiLevel || '?'}`;
      const blackName = game.players.black.user?.name || `AI level ${game.players.black.aiLevel || '?'}`;
      const whiteRating = game.players.white.rating;
      const blackRating = game.players.black.rating;
      
      return `${whiteName} (${whiteRating}) vs ${blackName} (${blackRating})`;
    }
    
    return 'Unknown players';
  };

  // Effect to fetch games when month/year changes
  useEffect(() => {
    if (username && (activeTab === 'chesscom' || activeTab === 'lichess')) {
      if (activeTab === 'chesscom') {
        fetchChessComGames();
      } else if (activeTab === 'lichess') {
        fetchLichessGames();
      }
    }
  }, [currentYear, currentMonth, username, activeTab, fetchChessComGames, fetchLichessGames]);

  return (
    <Container theme={theme}>
      <Title theme={theme}>Import Game</Title>
      
      <TabContainer theme={theme}>
        <Tab 
          active={activeTab === 'pgn'} 
          onClick={() => setActiveTab('pgn')}
          theme={theme}
        >
          PGN Text
        </Tab>
        <Tab 
          active={activeTab === 'chesscom'} 
          onClick={() => setActiveTab('chesscom')}
          theme={theme}
        >
          Chess.com
        </Tab>
        <Tab 
          active={activeTab === 'lichess'} 
          onClick={() => setActiveTab('lichess')}
          theme={theme}
        >
          Lichess
        </Tab>
      </TabContainer>
      
      {error && <ErrorMessage theme={theme}>{error}</ErrorMessage>}
      
      <TabContent active={activeTab === 'pgn'}>
        <TextArea 
          theme={theme}
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="Paste PGN text here..."
        />
        <Button 
          theme={theme}
          onClick={handlePgnImport}
          disabled={!pgnText.trim()}
        >
          Import PGN
        </Button>
      </TabContent>
      
      <TabContent active={activeTab === 'chesscom' || activeTab === 'lichess'}>
        <Input 
          theme={theme}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={`Enter ${activeTab === 'chesscom' ? 'Chess.com' : 'Lichess'} username`}
        />
        <Button 
          theme={theme}
          onClick={() => {
            if (activeTab === 'chesscom') {
              fetchChessComGames();
            } else if (activeTab === 'lichess') {
              fetchLichessGames();
            }
          }}
          disabled={!username.trim() || isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Games'}
        </Button>
        
        {(activeTab === 'chesscom' || activeTab === 'lichess') && (
          <MonthSelector theme={theme}>
            <MonthButton theme={theme} onClick={goToPreviousMonth}>
              &lt;
            </MonthButton>
            <MonthDisplay theme={theme}>
              {padMonth(currentMonth)}/{currentYear}
            </MonthDisplay>
            <MonthButton 
              theme={theme} 
              onClick={goToNextMonth}
              disabled={
                currentYear === new Date().getFullYear() && 
                currentMonth === new Date().getMonth() + 1
              }
            >
              &gt;
            </MonthButton>
          </MonthSelector>
        )}
        
        {games.length > 0 && (
          <>
            <GameList theme={theme}>
              {games.map((game, index) => (
                <GameItem 
                  key={index}
                  selected={selectedGameIndex === index}
                  onClick={() => setSelectedGameIndex(index)}
                  theme={theme}
                >
                  <GameTitle>
                    {getPlayerNames(game)}
                  </GameTitle>
                  <GameDetails>
                    {'time_class' in game ? game.time_class : ('players' in game ? game.speed : 'unknown')} • 
                    {'end_time' in game ? formatDate(game.end_time) : ''}
                    {'white' in game && 'result' in game.white ? 
                      (game.white.result === 'win' ? ' 1-0' : game.black.result === 'win' ? ' 0-1' : ' ½-½') : 
                      ''}
                  </GameDetails>
                </GameItem>
              ))}
            </GameList>
            <Button 
              theme={theme}
              onClick={handleGameImport}
              disabled={selectedGameIndex === null}
            >
              Import Selected Game
            </Button>
          </>
        )}
      </TabContent>
    </Container>
  );
};

// Additional styled components for month selector
const MonthSelector = styled.div<ContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
`;

const MonthButton = styled.button<ContainerProps & { disabled?: boolean }>`
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  
  &:hover {
    opacity: ${props => props.disabled ? 0.5 : 0.9};
  }
`;

const MonthDisplay = styled.div<ContainerProps>`
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 4px;
  margin: 0 8px;
  font-weight: 600;
`;

export default PgnImport;
