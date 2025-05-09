import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useGame } from '../../context/GameContext';
import { useTheme } from '../../context/ThemeContext';
import GameResultModal from '../GameResultModal/GameResultModal';
import { ThemeColors } from '../../types/interfaces';
import { media } from '../../styles/responsive';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface ContainerProps {
    theme?: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
    display: flex;
    flex-direction: column;
    gap: 15px;
    animation: ${fadeIn} 0.5s ease-out;
    
    ${media.md(`
        gap: 12px;
    `)}
    
    ${media.sm(`
        gap: 10px;
    `)}
`;

interface InfoCardProps {
    theme: { colors: ThemeColors };
}

const InfoCard = styled.div<InfoCardProps>`
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 15px;
    
    ${media.md(`
        padding: 16px;
        border-radius: 10px;
        margin-bottom: 12px;
    `)}
    
    ${media.sm(`
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 10px;
    `)}
`;

interface TitleProps {
    theme: { colors: ThemeColors };
}

const Title = styled.h3<TitleProps>`
    margin: 0 0 15px 0;
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 600;
    transition: color 0.3s ease;
    border-bottom: 1px solid ${({ theme }) => `${theme.colors.border}40`};
    padding-bottom: 10px;
    
    ${media.md(`
        margin: 0 0 12px 0;
        font-size: 1rem;
        padding-bottom: 8px;
    `)}
    
    ${media.sm(`
        margin: 0 0 10px 0;
        font-size: 0.95rem;
        padding-bottom: 6px;
    `)}
`;

interface InfoRowProps {
    theme: { colors: ThemeColors };
}

const InfoRow = styled.div<InfoRowProps>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: ${({ theme }) => `${theme.colors.secondary}80`};
    border-radius: 8px;
    margin-bottom: 10px;
    transition: all 0.2s ease;

    &:hover {
        transform: translateX(2px);
        background: ${({ theme }) => theme.colors.secondary};
    }
    
    &:last-child {
        margin-bottom: 0;
    }
    
    ${media.md(`
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 8px;
    `)}
    
    ${media.sm(`
        padding: 6px 8px;
        border-radius: 4px;
        margin-bottom: 6px;
    `)}
`;

interface LabelProps {
    theme: { colors: ThemeColors };
}

const Label = styled.span<LabelProps>`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.95rem;
    
    ${media.md(`
        font-size: 0.9rem;
    `)}
    
    ${media.sm(`
        font-size: 0.85rem;
    `)}
`;

interface ValueProps {
    theme: { colors: ThemeColors };
}

const Value = styled.span<ValueProps>`
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 500;
    padding: 4px 8px;
    background: ${({ theme }) => `${theme.colors.primary}80`};
    border-radius: 6px;
    font-size: 0.9rem;
    
    ${media.md(`
        padding: 3px 6px;
        font-size: 0.85rem;
        border-radius: 5px;
    `)}
    
    ${media.sm(`
        padding: 2px 5px;
        font-size: 0.8rem;
        border-radius: 4px;
    `)}
`;

const GameInfo: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const {
        gameId,
        playerColor,
        status,
        isGameActive,
        gameOver,
        isAIGame,
        opponentPlatform,
        resetGameState
    } = useGame();

    const handleNewGame = (): void => {
        resetGameState();
        navigate('/');
    };

    if (!isGameActive) {
        return null;
    }

    return (
        <Container>
            <InfoCard theme={theme}>
                <Title theme={theme}>Game Details</Title>
                <InfoRow theme={theme}>
                    <Label theme={theme}>Game ID</Label>
                    <Value theme={theme}>{gameId}</Value>
                </InfoRow>
                <InfoRow theme={theme}>
                    <Label theme={theme}>Your Color</Label>
                    <Value theme={theme}>{playerColor}</Value>
                </InfoRow>
                <InfoRow theme={theme}>
                    <Label theme={theme}>Game Type</Label>
                    <Value theme={theme}>{isAIGame ? 'vs AI' : 'vs Human'}</Value>
                </InfoRow>
                {opponentPlatform && (
                    <InfoRow theme={theme}>
                        <Label theme={theme}>Opponent</Label>
                        <Value theme={theme}>{opponentPlatform}</Value>
                    </InfoRow>
                )}
            </InfoCard>
            
            <GameResultModal 
                show={gameOver}
                result={status}
                onNewGame={handleNewGame}
                onReview={() => {}}
            />
        </Container>
    );
};

export default GameInfo;
