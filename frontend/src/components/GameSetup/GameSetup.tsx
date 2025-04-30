import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import { ThemeColors } from '../../types';
import { PlayerColor } from '../../types/enums';

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

interface ContainerProps {
    theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
    display: grid;
    gap: 30px;
    padding: 20px;
    animation: ${slideUp} 0.5s ease-out forwards;
    color: ${({ theme }) => theme.colors.text};
    transition: color 0.3s ease;
`;

interface SectionProps {
    theme: { colors: ThemeColors };
}

const Section = styled.div<SectionProps>`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 25px;
    background: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease, background-color 0.3s ease, color 0.3s ease;
    border: 1px solid ${({ theme }) => theme.colors.border};

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4);
    }
`;

interface ButtonProps {
    size?: 'large' | 'medium' | 'small';
    variant?: 'primary' | 'secondary';
    theme: { colors: ThemeColors };
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    active?: boolean;
}

const Button = styled.button<ButtonProps>`
    padding: ${props => props.size === 'large' ? '16px 32px' : '12px 24px'};
    font-size: ${props => props.size === 'large' ? '1.2rem' : '1rem'};
    font-weight: 600;
    color: ${props => props.variant === 'primary' ? 
        props.theme.colors.primary : 
        props.theme.colors.accent};
    background: ${props => props.variant === 'primary' ?
        props.theme.colors.accent :
        'transparent'};
    border: 2px solid ${props => props.variant === 'primary' ?
        'transparent' :
        props.theme.colors.accent};
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    min-width: 180px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
        opacity: 0.9;
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        background: ${({ theme }) => theme.colors.border};
        border-color: transparent;
        color: ${({ theme }) => theme.colors.text};
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
    
    ${props => props.active && `
        background: ${props.theme.colors.accent};
        color: ${props.theme.colors.primary};
        border-color: ${props.theme.colors.accent};
    `}
`;

interface InputProps {
    theme: { colors: ThemeColors };
}

const Input = styled.input<InputProps>`
    padding: 12px 16px;
    font-size: 1rem;
    border: 2px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    width: 240px;
    text-transform: uppercase;
    transition: all 0.3s ease;
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.accent};
        box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.accent}33`};
    }

    &::placeholder {
        color: ${({ theme }) => `${theme.colors.text}99`};
    }
`;

interface StatusProps {
    variant?: 'success' | 'error' | 'default';
    theme: { colors: ThemeColors };
}

const Status = styled.p<StatusProps>`
    font-size: 1.1rem;
    color: ${props => props.variant === 'success' ? 
        props.theme.colors.accent : 
        props.theme.colors.text};
    margin: 0;
    text-align: center;
    font-weight: 500;
    line-height: 1.5;
`;

interface GameIdProps {
    theme: { colors: ThemeColors };
}

const GameId = styled.div<GameIdProps>`
    font-size: 1.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.accent};
    padding: 16px 24px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    border: 2px solid ${({ theme }) => theme.colors.border};
`;

const FormWrapper = styled.form`
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
`;

interface OrDividerProps {
    theme: { colors: ThemeColors };
}

const OrDivider = styled.div<OrDividerProps>`
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    margin: 20px 0;
    color: ${({ theme }) => `${theme.colors.text}99`};
    font-weight: 500;

    &::before,
    &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: ${({ theme }) => theme.colors.border};
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
`;

const DifficultySelector = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
`;

const DifficultyLabel = styled.div`
    font-size: 1.1rem;
    font-weight: 500;
    text-align: center;
    margin-bottom: 5px;
`;

const DifficultySlider = styled.div`
    width: 100%;
    padding: 0 10px;
`;

interface SliderProps {
    theme: { colors: ThemeColors };
}

const Slider = styled.input<SliderProps>`
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
    }
    
    &::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${({ theme }) => theme.colors.accent};
        cursor: pointer;
        border: 2px solid ${({ theme }) => theme.colors.primary};
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
`;

const DifficultyValue = styled.div`
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.accent};
    text-align: center;
    margin: 10px 0;
`;

const DifficultyInfo = styled.div`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text};
    text-align: center;
    margin: 5px 0 10px;
    padding: 8px 12px;
    background: ${({ theme }) => theme.colors.secondary};
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border};
`;

const DifficultyDescription = styled.div`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text};
    margin-top: 10px;
    padding: 10px;
    background: ${({ theme }) => theme.colors.primary}66;
    border-radius: 6px;
    text-align: center;
`;

const OptionGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 500px;
    margin: 10px auto;
`;

const OptionLabel = styled.div`
    font-size: 1.1rem;
    font-weight: 500;
    text-align: center;
    margin-bottom: 5px;
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
`;

interface RadioButtonProps {
    theme: { colors: ThemeColors };
    checked: boolean;
}

const RadioButton = styled.div<RadioButtonProps>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: ${props => props.checked ? 
        `${props.theme.colors.accent}33` : 
        props.theme.colors.primary};
    border: 2px solid ${props => props.checked ? 
        props.theme.colors.accent : 
        props.theme.colors.border};
    
    &:hover {
        background: ${props => props.checked ? 
            `${props.theme.colors.accent}33` : 
            `${props.theme.colors.border}33`};
    }
`;

const RadioInput = styled.input`
    margin: 0;
`;

const RadioLabel = styled.label`
    font-size: 1rem;
    cursor: pointer;
`;

const TabGroup = styled.div`
    display: flex;
    gap: 2px;
    justify-content: center;
    margin-bottom: 15px;
    width: 100%;
    max-width: 500px;
`;

interface TabProps {
    theme: { colors: ThemeColors };
    active: boolean;
}

const Tab = styled.div<TabProps>`
    padding: 10px 20px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    flex: 1;
    border-bottom: 3px solid ${props => props.active ? 
        props.theme.colors.accent : 
        props.theme.colors.border};
    color: ${props => props.active ? 
        props.theme.colors.accent : 
        props.theme.colors.text};
    transition: all 0.2s ease;
    
    &:hover {
        color: ${props => props.active ? 
            props.theme.colors.accent : 
            `${props.theme.colors.accent}99`};
    }
`;

const TimeControlGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    width: 100%;
    max-width: 500px;
`;

interface TimeControlOptionProps {
    theme: { colors: ThemeColors };
    selected: boolean;
}

const TimeControlOption = styled.div<TimeControlOptionProps>`
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: ${props => props.selected ? 
        `${props.theme.colors.accent}33` : 
        props.theme.colors.primary};
    border: 2px solid ${props => props.selected ? 
        props.theme.colors.accent : 
        props.theme.colors.border};
    
    &:hover {
        background: ${props => props.selected ? 
            `${props.theme.colors.accent}33` : 
            `${props.theme.colors.border}33`};
        transform: translateY(-2px);
    }
`;

const TimeControlName = styled.div`
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 5px;
`;

const TimeControlDescription = styled.div`
    font-size: 0.8rem;
    opacity: 0.8;
`;

// Define time control options
interface TimeControlOption {
    name: string;
    description: string;
    initial: number; // in seconds
    increment: number; // in seconds
}

// Group time controls by category
interface TimeControlCategory {
    name: string;
    options: TimeControlOption[];
}

const timeControlCategories: TimeControlCategory[] = [
    {
        name: 'Bullet',
        options: [
            { name: '1 min', description: 'No increment', initial: 60, increment: 0 },
            { name: '1+1', description: '1 min + 1 sec increment', initial: 60, increment: 1 },
            { name: '2+1', description: '2 min + 1 sec increment', initial: 120, increment: 1 }
        ]
    },
    {
        name: 'Blitz',
        options: [
            { name: '3 min', description: 'No increment', initial: 180, increment: 0 },
            { name: '3+2', description: '3 min + 2 sec increment', initial: 180, increment: 2 },
            { name: '5 min', description: 'No increment', initial: 300, increment: 0 }
        ]
    },
    {
        name: 'Rapid',
        options: [
            { name: '10 min', description: 'No increment', initial: 600, increment: 0 },
            { name: '10+15', description: '10 min + 15 sec increment', initial: 600, increment: 15 },
            { name: '15 min', description: 'No increment', initial: 900, increment: 0 }
        ]
    }
];

const GameSetup: React.FC = () => {
    const navigate = useNavigate();
    const { createGame, joinGame, startAIGame, gameId, status, isGameActive } = useGame();
    const [joinGameId, setJoinGameId] = useState<string>('');
    const [showAIOptions, setShowAIOptions] = useState<boolean>(false);
    const [difficulty, setDifficulty] = useState<number>(10); // Default to middle value
    
    // New state for color selection and time control
    const [selectedColor, setSelectedColor] = useState<string>('white');
    const [activeTimeCategory, setActiveTimeCategory] = useState<string>('Blitz');
    const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlOption>(
        timeControlCategories[1].options[2] // Default to 5 min blitz
    );

    useEffect(() => {
        if (gameId && isGameActive) {
            navigate(`/game/${gameId}`);
        }
    }, [gameId, isGameActive, navigate]);

    const handleJoinGame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (joinGameId) {
            navigate(`/game/${joinGameId.toUpperCase()}`);
        }
    };

    const handleAIGame = (color: 'white' | 'black') => {
        startAIGame(color, difficulty);
        navigate('/game/ai');
    };
    
    const handleCreateGame = () => {
        // If random is selected, randomly choose white or black
        let colorChoice = selectedColor;
        if (selectedColor === 'random') {
            colorChoice = Math.random() > 0.5 ? 'white' : 'black';
        }
        
        // Create game with selected color and time control
        createGame({
            color: colorChoice as PlayerColor,
            timeControl: {
                initial: selectedTimeControl.initial,
                increment: selectedTimeControl.increment
            }
        });
    };

    if (isGameActive) {
        return (
            <Container>
                <Section>
                    <Status variant="success">{status}</Status>
                    {gameId && <GameId>Game ID: {gameId}</GameId>}
                </Section>
            </Container>
        );
    }

    return (
        <Container>
            <Section>
                <Status>{status}</Status>
                
                <ButtonGroup>
                    <Button 
                        onClick={() => setShowAIOptions(false)}
                        variant={!showAIOptions ? "primary" : "secondary"}
                        size="large"
                    >
                        Play Online
                    </Button>
                    
                    <Button 
                        onClick={() => setShowAIOptions(true)}
                        variant={showAIOptions ? "primary" : "secondary"}
                        size="large"
                    >
                        Play vs AI
                    </Button>
                </ButtonGroup>

                {showAIOptions ? (
                    <>
                        <DifficultySelector>
                            <DifficultyLabel>Select Difficulty Level</DifficultyLabel>
                            <DifficultyValue>{difficulty}</DifficultyValue>
                            
                            {/* Display search depth based on difficulty */}
                            <DifficultyInfo>
                                Search Depth: {
                                    difficulty <= 3 ? 1 :
                                    difficulty <= 6 ? 2 :
                                    difficulty <= 9 ? 3 :
                                    difficulty <= 12 ? 4 :
                                    difficulty <= 15 ? 5 :
                                    difficulty <= 18 ? 6 : 7
                                }
                            </DifficultyInfo>
                            
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
                            
                            {/* Description based on difficulty level */}
                            <DifficultyDescription>
                                {difficulty <= 5 ? 
                                    "Casual play - suitable for beginners learning chess basics." :
                                 difficulty <= 10 ? 
                                    "Challenging for casual players - makes occasional mistakes." :
                                 difficulty <= 15 ? 
                                    "Strong play - requires good chess knowledge to beat." :
                                    "Expert level - plays at a very high standard with deep calculation."}
                            </DifficultyDescription>
                        </DifficultySelector>
                        
                        <ButtonGroup>
                            <Button
                                onClick={() => handleAIGame('white')}
                                variant="primary"
                            >
                                Play as White
                            </Button>
                            <Button
                                onClick={() => handleAIGame('black')}
                                variant="primary"
                            >
                                Play as Black
                            </Button>
                        </ButtonGroup>
                    </>
                ) : (
                    <>
                        {/* Color selection for PvP */}
                        <OptionGroup>
                            <OptionLabel>Choose Your Color</OptionLabel>
                            <RadioGroup>
                                <RadioButton 
                                    checked={selectedColor === 'white'}
                                    onClick={() => setSelectedColor('white')}
                                >
                                    <RadioInput 
                                        type="radio" 
                                        name="color" 
                                        value="white" 
                                        checked={selectedColor === 'white'} 
                                        onChange={() => setSelectedColor('white')}
                                    />
                                    <RadioLabel>White</RadioLabel>
                                </RadioButton>
                                
                                <RadioButton 
                                    checked={selectedColor === 'black'}
                                    onClick={() => setSelectedColor('black')}
                                >
                                    <RadioInput 
                                        type="radio" 
                                        name="color" 
                                        value="black" 
                                        checked={selectedColor === 'black'} 
                                        onChange={() => setSelectedColor('black')}
                                    />
                                    <RadioLabel>Black</RadioLabel>
                                </RadioButton>
                                
                                <RadioButton 
                                    checked={selectedColor === 'random'}
                                    onClick={() => setSelectedColor('random')}
                                >
                                    <RadioInput 
                                        type="radio" 
                                        name="color" 
                                        value="random" 
                                        checked={selectedColor === 'random'} 
                                        onChange={() => setSelectedColor('random')}
                                    />
                                    <RadioLabel>Random</RadioLabel>
                                </RadioButton>
                            </RadioGroup>
                        </OptionGroup>
                        
                        {/* Time control selection */}
                        <OptionGroup>
                            <OptionLabel>Time Control</OptionLabel>
                            
                            <TabGroup>
                                {timeControlCategories.map(category => (
                                    <Tab 
                                        key={category.name}
                                        active={activeTimeCategory === category.name}
                                        onClick={() => setActiveTimeCategory(category.name)}
                                    >
                                        {category.name}
                                    </Tab>
                                ))}
                            </TabGroup>
                            
                            <TimeControlGrid>
                                {timeControlCategories
                                    .find(category => category.name === activeTimeCategory)?.options
                                    .map(option => (
                                        <TimeControlOption 
                                            key={option.name}
                                            selected={selectedTimeControl.name === option.name}
                                            onClick={() => setSelectedTimeControl(option)}
                                        >
                                            <TimeControlName>{option.name}</TimeControlName>
                                            <TimeControlDescription>{option.description}</TimeControlDescription>
                                        </TimeControlOption>
                                    ))
                                }
                            </TimeControlGrid>
                        </OptionGroup>
                        
                        <Button 
                            onClick={handleCreateGame} 
                            variant="primary" 
                            size="large"
                        >
                            Create New Game
                        </Button>
                        
                        <OrDivider>OR</OrDivider>
                        
                        <FormWrapper onSubmit={handleJoinGame}>
                            <Input
                                type="text"
                                placeholder="Enter Game ID to Join"
                                value={joinGameId}
                                onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                            <Button 
                                type="submit" 
                                disabled={!joinGameId}
                                variant="primary"
                            >
                                Join Game
                            </Button>
                        </FormWrapper>
                    </>
                )}
            </Section>
        </Container>
    );
};

export default GameSetup;
