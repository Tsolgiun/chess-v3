import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';

interface LoadingScreenProps {
  progress: number;
  totalPositions: number;
  currentPosition: number;
}

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  border-radius: 12px;
`;

const Container = styled.div<ContainerProps>`
  background: ${({ theme }) => theme.colors.primary};
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 80%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h3<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 20px;
  font-size: 1.2rem;
`;

const ProgressBarContainer = styled.div<ContainerProps>`
  background: ${({ theme }) => theme.colors.secondary};
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
`;

const ProgressFill = styled.div<{ progress: number; theme: { colors: ThemeColors } }>`
  height: 100%;
  width: ${props => props.progress * 100}%;
  background: ${({ theme }) => theme.colors.accent};
  transition: width 0.3s ease;
`;

const ProgressText = styled.div<ContainerProps>`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
`;

const AnalysisLoadingScreen: React.FC<LoadingScreenProps> = ({ 
  progress, 
  totalPositions,
  currentPosition 
}) => {
  const theme = useTheme();
  
  return (
    <Overlay>
      <Container theme={theme}>
        <Title theme={theme}>Analyzing Game</Title>
        <ProgressBarContainer theme={theme}>
          <ProgressFill progress={progress} theme={theme} />
        </ProgressBarContainer>
        <ProgressText theme={theme}>
          Analyzing position {currentPosition}/{totalPositions}
        </ProgressText>
      </Container>
    </Overlay>
  );
};

export default AnalysisLoadingScreen;
