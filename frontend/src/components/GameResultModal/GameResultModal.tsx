import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { GameResultModalProps } from '../../types/props';
import { ThemeColors } from '../../types/interfaces';
import { media, spacing } from '../../styles/responsive';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideIn = keyframes`
  from {
    transform: translate(-50%, -60%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
`;

interface OverlayProps {
  show: boolean;
}

const Overlay = styled.div<OverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.show ? 'block' : 'none'};
  animation: ${fadeIn} 0.3s ease-out;
  z-index: 1000;
`;

interface ModalContainerProps {
  theme: { colors: ThemeColors };
}

const ModalContainer = styled.div<ModalContainerProps>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 300px;
  animation: ${slideIn} 0.3s ease-out;
  z-index: 1001;
  transition: background-color 0.3s ease, color 0.3s ease;
  
  ${media.md(`
    padding: 25px;
    min-width: 280px;
  `)}
  
  ${media.sm(`
    padding: 20px;
    min-width: 260px;
    border-radius: 10px;
  `)}
`;

interface ResultTextProps {
  theme: { colors: ThemeColors };
}

const ResultText = styled.h2<ResultTextProps>`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 20px;
  font-size: 1.5rem;
  transition: color 0.3s ease;
  
  ${media.md(`
    font-size: 1.4rem;
    margin-bottom: 18px;
  `)}
  
  ${media.sm(`
    font-size: 1.3rem;
    margin-bottom: 16px;
  `)}
`;

interface ButtonProps {
  secondary?: boolean;
  theme: { colors: ThemeColors; isDarkMode?: boolean };
}

const Button = styled.button<ButtonProps>`
  padding: 10px 20px;
  background: ${props => props.secondary ? 'transparent' : props.theme.colors.accent};
  color: ${props => props.secondary ? props.theme.colors.accent : (props.theme.isDarkMode ? '#000000' : '#ffffff')};
  border: ${props => props.secondary ? `1px solid ${props.theme.colors.accent}` : 'none'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  
  ${media.md(`
    padding: 9px 18px;
    font-size: 0.95rem;
  `)}
  
  ${media.sm(`
    padding: 8px 16px;
    font-size: 0.9rem;
    border-radius: 5px;
  `)}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
  
  ${media.md(`
    gap: 8px;
    margin-top: 18px;
  `)}
  
  ${media.sm(`
    gap: 6px;
    margin-top: 16px;
  `)}
`;

const GameResultModal: React.FC<GameResultModalProps> = ({ show, result, onNewGame, onReview }) => {
  const theme = useTheme();
  if (!show) return null;

  const handleReviewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("Review button clicked in GameResultModal");
    // Prevent event propagation issues
    e.stopPropagation();
    // Call the onReview function
    if (typeof onReview === 'function') {
      onReview();
    } else {
      console.error("onReview is not a function:", onReview);
    }
  };

  const handleNewGameClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("New Game button clicked in GameResultModal");
    // Prevent event propagation issues
    e.stopPropagation();
    // Call the onNewGame function
    if (typeof onNewGame === 'function') {
      onNewGame();
    } else {
      console.error("onNewGame is not a function:", onNewGame);
    }
  };

  return (
    <Overlay show={show}>
      <ModalContainer theme={theme}>
        <ResultText theme={theme}>{result}</ResultText>
        <ButtonGroup>
          <Button onClick={handleReviewClick} theme={theme}>Review</Button>
          <Button secondary onClick={handleNewGameClick} theme={theme}>New Game</Button>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
};

export default GameResultModal;
