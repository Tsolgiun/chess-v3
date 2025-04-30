import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ColorPicker from '../ColorPicker/ColorPicker';
import { ThemeColors } from '../../types/interfaces';

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
  margin-top: 30px;
  padding: 20px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

interface TitleProps {
  theme: { colors: ThemeColors };
}

const Title = styled.h3<TitleProps>`
  margin-top: 0;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 18px;
  font-weight: 600;
`;

const ColorPickersContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

interface BoardPreviewProps {
  theme: { colors: ThemeColors };
}

const BoardPreview = styled.div<BoardPreviewProps>`
  margin-top: 20px;
  background: ${({ theme }) => theme.colors.secondary};
  padding: 16px;
  border-radius: 8px;
`;

interface PreviewTitleProps {
  theme: { colors: ThemeColors };
}

const PreviewTitle = styled.h4<PreviewTitleProps>`
  margin-top: 0;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: 600;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  width: 100%;
  max-width: 200px;
  aspect-ratio: 1;
  margin: 0 auto;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
`;

const PreviewSquare = styled.div`
  aspect-ratio: 1;
`;

const BoardColorSelector: React.FC = () => {
  const { boardColors, setBoardColors } = useTheme();
  const { user, updateProfile } = useAuth();
  
  const handleLightSquareChange = (color: string) => {
    setBoardColors({ lightSquare: color });
    if (user) {
      updateProfile({ boardLightSquare: color });
    }
  };
  
  const handleDarkSquareChange = (color: string) => {
    setBoardColors({ darkSquare: color });
    if (user) {
      updateProfile({ boardDarkSquare: color });
    }
  };
  
  return (
    <Container>
      <Title>Chessboard Colors</Title>
      <ColorPickersContainer>
        <ColorPicker 
          label="Light Squares" 
          color={boardColors.lightSquare} 
          onChange={handleLightSquareChange} 
        />
        <ColorPicker 
          label="Dark Squares" 
          color={boardColors.darkSquare} 
          onChange={handleDarkSquareChange} 
        />
      </ColorPickersContainer>
      <BoardPreview>
        <PreviewTitle>Preview</PreviewTitle>
        <PreviewGrid>
          {[...Array(16)].map((_, i) => {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const isLight = (row + col) % 2 === 0;
            return (
              <PreviewSquare 
                key={i} 
                style={{ 
                  backgroundColor: isLight 
                    ? boardColors.lightSquare 
                    : boardColors.darkSquare 
                }} 
              />
            );
          })}
        </PreviewGrid>
      </BoardPreview>
    </Container>
  );
};

export default BoardColorSelector;
