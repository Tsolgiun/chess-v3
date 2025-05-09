import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { TimerProps } from '../../types/props';
import { ThemeColors } from '../../types/interfaces';
import { media } from '../../styles/responsive';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
  }
`;

const tickAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

interface TimerContainerProps {
    theme: { colors: ThemeColors };
}

const TimerContainer = styled.div<TimerContainerProps>`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    padding: 15px;
    background: ${({ theme }) => theme.colors.secondary};
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    
    ${media.md(`
        gap: 10px;
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 10px;
    `)}
    
    ${media.sm(`
        gap: 8px;
        margin-bottom: 12px;
        padding: 10px;
        border-radius: 8px;
    `)}
`;

interface PlayerTimerProps {
    isActive: boolean;
    isLow?: boolean;
    theme: { colors: ThemeColors };
}

const PlayerTimer = styled.div<PlayerTimerProps>`
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    background: ${props => props.isActive ? ({ theme }) => theme.colors.primary : ({ theme }) => `${theme.colors.primary}80`};
    border-radius: 10px;
    transition: all 0.3s ease, background-color 0.3s ease;
    position: relative;
    overflow: hidden;

    ${props => props.isActive && `
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    `}
    
    ${props => props.isLow && props.isActive && css`
        animation: ${pulse} 1.5s infinite;
    `}
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${props => props.isActive ? ({ theme }) => theme.colors.accent : 'transparent'};
    }
    
    ${media.md(`
        padding: 10px 14px;
        border-radius: 8px;
    `)}
    
    ${media.sm(`
        padding: 8px 12px;
        border-radius: 6px;
    `)}
`;

const TimerHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    ${media.sm(`
        margin-bottom: 6px;
    `)}
`;

const PlayerInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    
    ${media.md(`
        gap: 10px;
    `)}
    
    ${media.sm(`
        gap: 8px;
    `)}
`;

interface AvatarProps {
    isActive: boolean;
    theme: { colors: ThemeColors };
}

const Avatar = styled.div<AvatarProps>`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${props => props.isActive ? ({ theme }) => theme.colors.accent : ({ theme }) => theme.colors.secondary};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: ${props => props.isActive ? '#fff' : ({ theme }) => theme.colors.text};
    font-size: 14px;
    transition: all 0.3s ease;
    box-shadow: ${props => props.isActive ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'};
    
    ${props => props.isActive && css`
        animation: ${tickAnimation} 1s infinite;
    `}
    
    ${media.md(`
        width: 28px;
        height: 28px;
        font-size: 12px;
    `)}
    
    ${media.sm(`
        width: 24px;
        height: 24px;
        font-size: 11px;
    `)}
`;

interface PlayerNameProps {
    isActive: boolean;
    theme?: { colors: ThemeColors };
}

const PlayerName = styled.span<PlayerNameProps>`
    font-weight: ${props => props.isActive ? '600' : '500'};
    color: ${({ theme }) => theme.colors.text};
    transition: all 0.3s ease;
    
    ${media.md(`
        font-size: 0.95rem;
    `)}
    
    ${media.sm(`
        font-size: 0.9rem;
    `)}
`;

interface TimeProps {
    isLow: boolean;
    theme: { colors: ThemeColors };
}

const Time = styled.span<TimeProps>`
    font-family: 'Roboto Mono', monospace;
    font-size: 1.3rem;
    font-weight: 600;
    color: ${props => {
        if (props.isLow) return '#e74c3c';
        return ({ theme }) => theme.colors.text;
    }};
    transition: color 0.3s ease;
    letter-spacing: 0.5px;
    
    ${media.md(`
        font-size: 1.2rem;
        letter-spacing: 0.4px;
    `)}
    
    ${media.sm(`
        font-size: 1.1rem;
        letter-spacing: 0.3px;
    `)}
`;

// Commented out progress bar component
/*
interface TimerProgressBarProps {
    percentage: number;
    isLow: boolean;
    isPlayerActive: boolean; // Add this prop to indicate if it's this player's turn
    theme: { colors: ThemeColors };
}

const TimerProgressBar = styled.div<TimerProgressBarProps>`
    height: 4px;
    background: ${({ theme }) => `${theme.colors.secondary}80`};
    border-radius: 2px;
    margin-top: 8px;
    overflow: hidden;
    
    &::after {
        content: '';
        display: block;
        height: 100%;
        width: ${props => props.percentage}%;
        background: ${props => props.isLow ? '#e74c3c' : ({ theme }) => theme.colors.accent};
        transition: width ${props => props.isPlayerActive ? '1s' : '0s'} linear; // Only animate when it's this player's turn
    }
`;
*/

const formatTime = (seconds: number): string => {
    if (seconds === undefined || seconds < 0) return '0:00';
    
    if (seconds >= 3600) {
        // Format as h:mm:ss for times >= 1 hour
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        // Format as m:ss for times < 1 hour
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
};

// Commented out percentage calculation for progress bar
/*
const calculateTimePercentage = (currentTime: number, initialTime: number = 600): number => {
    if (currentTime <= 0) return 0;
    // Always use initialTime as the reference, even if currentTime is greater
    // Cap at 100% to prevent the bar from overflowing
    return Math.min((currentTime / initialTime) * 100, 100);
};
*/

const Timer: React.FC<TimerProps> = ({ 
    whiteTime = 600, // 10 minutes default
    blackTime = 600,
    isWhiteTurn,
    isGameActive,
    initialTime = 600 // Initial time in seconds (10 minutes)
}) => {
    const theme = useTheme();
    // Commented out percentage calculations for progress bar
    // const whiteTimePercentage = calculateTimePercentage(whiteTime, initialTime);
    // const blackTimePercentage = calculateTimePercentage(blackTime, initialTime);
    
    const isWhiteLow = whiteTime < 30;
    const isBlackLow = blackTime < 30;

    return (
        <TimerContainer theme={theme}>
            <PlayerTimer 
                isActive={!isWhiteTurn && isGameActive} 
                isLow={isBlackLow}
                theme={theme}
            >
                <TimerHeader>
                    <PlayerInfo>
                        <Avatar 
                            isActive={!isWhiteTurn && isGameActive}
                            theme={theme}
                        >
                            B
                        </Avatar>
                        <PlayerName 
                            isActive={!isWhiteTurn && isGameActive}
                            theme={theme}
                        >
                            Black
                        </PlayerName>
                    </PlayerInfo>
                    <Time 
                        isLow={isBlackLow}
                        theme={theme}
                    >
                        {formatTime(blackTime)}
                    </Time>
                </TimerHeader>
                {/* Commented out progress bar
                <TimerProgressBar 
                    percentage={blackTimePercentage}
                    isLow={isBlackLow}
                    isPlayerActive={!isWhiteTurn && isGameActive} // Only active when it's black's turn AND game is active
                    theme={theme}
                />
                */}
            </PlayerTimer>
            
            <PlayerTimer 
                isActive={isWhiteTurn && isGameActive}
                isLow={isWhiteLow}
                theme={theme}
            >
                <TimerHeader>
                    <PlayerInfo>
                        <Avatar 
                            isActive={isWhiteTurn && isGameActive}
                            theme={theme}
                        >
                            W
                        </Avatar>
                        <PlayerName 
                            isActive={isWhiteTurn && isGameActive}
                            theme={theme}
                        >
                            White
                        </PlayerName>
                    </PlayerInfo>
                    <Time 
                        isLow={isWhiteLow}
                        theme={theme}
                    >
                        {formatTime(whiteTime)}
                    </Time>
                </TimerHeader>
                {/* Commented out progress bar
                <TimerProgressBar 
                    percentage={whiteTimePercentage}
                    isLow={isWhiteLow}
                    isPlayerActive={isWhiteTurn && isGameActive} // Only active when it's white's turn AND game is active
                    theme={theme}
                />
                */}
            </PlayerTimer>
        </TimerContainer>
    );
};

export default Timer;
