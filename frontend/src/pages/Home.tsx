import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Button from '../components/common/Button';
import Board from '../components/Board/Board';
import NavBar from '../components/NavBar/NavBar';
import { motion } from 'framer-motion';
import { media, spacing } from '../styles/responsive';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  
  ${media.md(`
    padding-bottom: 70px; /* Add padding for the bottom navigation bar */
  `)}
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(auto, 700px) minmax(300px, 1fr);
  gap: 40px;
  padding: ${spacing.lg};
  margin-top: 80px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  
  ${media.xl(`
    grid-template-columns: 3fr 2fr;
    gap: 30px;
    padding: ${spacing.md};
  `)}
  
  ${media.lg(`
    grid-template-columns: 1fr;
    max-width: 800px;
    gap: 30px;
  `)}
  
  ${media.md(`
    padding: ${spacing.md} ${spacing.sm};
    gap: 20px;
  `)}
  
  ${media.sm(`
    padding: ${spacing.sm};
    gap: 15px;
    margin-top: 70px;
  `)}
`;

const BoardContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  
  ${media.md(`
    padding: 20px;
  `)}
  
  ${media.sm(`
    padding: 15px;
    border-radius: 12px;
  `)}
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }
`;

const ControlPanel = styled(motion.div)`
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  display: flex;
  flex-direction: column;
  height: fit-content;
  transition: all 0.3s ease;
  
  ${media.md(`
    padding: 20px;
  `)}
  
  ${media.sm(`
    padding: 15px;
    border-radius: 12px;
  `)}
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }
`;

const ControlTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  
  ${media.md(`
    font-size: 1.6rem;
    margin-bottom: 1.2rem;
  `)}
  
  ${media.sm(`
    font-size: 1.4rem;
    margin-bottom: 1rem;
  `)}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 20px;
  
  ${media.sm(`
    gap: 8px;
    margin-bottom: 15px;
  `)}
`;

const StyledButton = styled(Button)<{ isActive?: boolean }>`
  min-width: 140px;
  background-color: ${props => props.isActive ? props.theme.colors.accent : props.theme.colors.secondary};
  color: ${props => props.isActive ? '#ffffff' : props.theme.colors.text};
  border: 1px solid ${props => props.isActive ? props.theme.colors.accent : props.theme.colors.border};
  
  ${media.sm(`
    min-width: 120px;
    padding: 8px 12px;
    font-size: 0.9rem;
  `)}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const DifficultySelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin: 15px 0;
  
  ${media.sm(`
    gap: 8px;
    margin: 12px 0;
  `)}
`;

const DifficultyLabel = styled.div`
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.text};
  
  ${media.sm(`
    font-size: 0.9rem;
    margin-bottom: 3px;
  `)}
`;

const DifficultySlider = styled.div`
  width: 100%;
  padding: 0 10px;
  
  ${media.sm(`
    padding: 0 5px;
  `)}
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.border};
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    
    ${media.sm(`
      width: 18px;
      height: 18px;
    `)}
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    
    ${media.sm(`
      width: 18px;
      height: 18px;
    `)}
  }
`;

const DifficultyMarkers = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 8px;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.8;
  
  ${media.sm(`
    font-size: 0.7rem;
    margin-top: 6px;
  `)}
`;

const DifficultyValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.accent};
  text-align: center;
  margin: 10px 0;
  
  ${media.sm(`
    font-size: 1.3rem;
    margin: 8px 0;
  `)}
`;

const ColorOptions = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 15px 0;
  
  ${media.sm(`
    gap: 8px;
    margin: 12px 0;
    flex-direction: column;
    align-items: center;
  `)}
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  margin: 15px 0;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.7;
  font-weight: 500;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
  
  ${media.sm(`
    margin: 12px 0;
    gap: 10px;
  `)}
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: center;
  
  ${media.sm(`
    gap: 10px;
  `)}
`;

const Input = styled.input`
  padding: 12px 16px;
  font-size: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  width: 100%;
  max-width: 300px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.accent}33`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text};
    opacity: 0.5;
  }
  
  ${media.sm(`
    padding: 10px 14px;
    font-size: 0.9rem;
    max-width: 100%;
  `)}
`;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { startAIGame, createGame } = useGame();
  
  const [showAIOptions, setShowAIOptions] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<number>(10); // Default to middle value
  const [joinGameId, setJoinGameId] = useState<string>('');
  
  const handlePlayVsAI = (color: string) => {
    startAIGame(color, difficulty);
    navigate('/game/ai');
  };
  
  const handleCreateGame = () => {
    createGame();
    navigate('/game/new');
  };
  
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinGameId) {
      navigate(`/game/${joinGameId.toUpperCase()}`);
    }
  };
  
  return (
    <HomeContainer>
      <NavBar />
      <ContentContainer>
        <BoardContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Board demoMode={true} />
        </BoardContainer>
        
        <ControlPanel
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ControlTitle>Play Chess</ControlTitle>
          
          <ButtonGroup>
            <StyledButton 
              onClick={() => setShowAIOptions(false)}
              isActive={!showAIOptions}
              size="large"
            >
              Play Online
            </StyledButton>
            
            <StyledButton 
              onClick={() => setShowAIOptions(true)}
              isActive={showAIOptions}
              size="large"
            >
              Play vs AI
            </StyledButton>
          </ButtonGroup>
          
          {showAIOptions ? (
            <>
              <DifficultySelector>
                <DifficultyLabel>Select Difficulty Level</DifficultyLabel>
                <DifficultyValue>{difficulty}</DifficultyValue>
                <DifficultySlider>
                  <Slider
                    type="range"
                    min="1"
                    max="20"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                  />
                  <DifficultyMarkers>
                    <span>Beginner</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                  </DifficultyMarkers>
                </DifficultySlider>
              </DifficultySelector>
              
              <ColorOptions>
                <StyledButton
                  onClick={() => handlePlayVsAI('white')}
                  primary
                >
                  Play as White
                </StyledButton>
                <StyledButton
                  onClick={() => handlePlayVsAI('black')}
                  primary
                >
                  Play as Black
                </StyledButton>
              </ColorOptions>
            </>
          ) : (
            <>
              <StyledButton 
                onClick={handleCreateGame} 
                primary 
                size="large"
                style={{ width: '100%', maxWidth: '300px', margin: '10px auto' }}
              >
                Create New Game
              </StyledButton>
              
              <OrDivider>OR</OrDivider>
              
              <FormWrapper onSubmit={handleJoinGame}>
                <Input
                  type="text"
                  placeholder="Enter Game ID"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <StyledButton 
                  type="submit" 
                  disabled={!joinGameId}
                  primary
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  Join Game
                </StyledButton>
              </FormWrapper>
            </>
          )}
        </ControlPanel>
      </ContentContainer>
    </HomeContainer>
  );
};

export default Home;
