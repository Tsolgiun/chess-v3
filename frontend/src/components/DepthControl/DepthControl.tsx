import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/interfaces';

interface DepthControlProps {
  initialDepth?: number;
  minDepth?: number;
  maxDepth?: number;
  onChange: (depth: number) => void;
}

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

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Slider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.primary};
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 8px ${({ theme }) => theme.colors.accent}80;
    }
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 8px ${({ theme }) => theme.colors.accent}80;
    }
  }
`;

const DepthValue = styled.div<ContainerProps>`
  font-weight: 600;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.accent};
  min-width: 40px;
  text-align: center;
`;

const DepthLabel = styled.div<ContainerProps>`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text}99;
  margin-top: 4px;
`;

const DepthDescription = styled.div<ContainerProps>`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 12px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.primary}66;
  border-radius: 6px;
`;

const DepthControl: React.FC<DepthControlProps> = ({ 
  initialDepth = 16, 
  minDepth = 1, 
  maxDepth = 24,
  onChange 
}) => {
  const theme = useTheme();
  const [depth, setDepth] = useState<number>(initialDepth);
  
  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDepth = parseInt(e.target.value, 10);
    setDepth(newDepth);
    onChange(newDepth);
  };
  
  const getDepthDescription = (depth: number): string => {
    if (depth <= 5) {
      return 'Quick analysis - fast but may miss some tactics';
    } else if (depth <= 12) {
      return 'Standard analysis - good balance of speed and accuracy';
    } else if (depth <= 18) {
      return 'Deep analysis - thorough evaluation, may take longer';
    } else {
      return 'Very deep analysis - highest accuracy, but significantly slower';
    }
  };
  
  return (
    <Container theme={theme}>
      <Title theme={theme}>Analysis Depth</Title>
      
      <SliderContainer>
        <SliderRow>
          <Slider 
            type="range"
            min={minDepth}
            max={maxDepth}
            value={depth}
            onChange={handleDepthChange}
            theme={theme}
          />
          <DepthValue theme={theme}>{depth}</DepthValue>
        </SliderRow>
        
        <DepthLabel theme={theme}>
          {minDepth} (Faster) — {maxDepth} (Deeper)
        </DepthLabel>
      </SliderContainer>
      
      <DepthDescription theme={theme}>
        {getDepthDescription(depth)}
      </DepthDescription>
    </Container>
  );
};

export default DepthControl;
