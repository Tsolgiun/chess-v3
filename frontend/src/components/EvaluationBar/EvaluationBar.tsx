import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';

interface EvaluationBarProps {
  evaluation: number | null;
  evaluationType: 'cp' | 'mate' | null;
  boardFlipped?: boolean;
  movedPlayer?: 'white' | 'black';
}

const BarContainer = styled.div`
  width: 100%;
  height: 30px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: row;
`;

const WhiteBar = styled.div<{ width: string }>`
  height: 100%;
  width: ${props => props.width};
  position: relative;
  background-color: #ffffff;
  transition: width 0.3s ease;
`;

const BlackBar = styled.div<{ width: string }>`
  height: 100%;
  width: ${props => props.width};
  position: relative;
  background-color: #000000;
  transition: width 0.3s ease;
`;

const EvaluationText = styled.div<{ isWhite: boolean; visible: boolean }>`
  position: absolute;
  text-align: center;
  font-weight: bold;
  font-size: 12px;
  color: #1976d2; /* Hardcoded blue color for the evaluation number */
  visibility: ${props => (props.visible ? 'visible' : 'hidden')};
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 5px;
`;

const WhiteText = styled(EvaluationText)`
  left: 5px;
`;

const BlackText = styled(EvaluationText)`
  right: 5px;
`;

const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  evaluationType,
  boardFlipped = false,
  movedPlayer = 'white'
}) => {
  const { colors } = useTheme();
  const [whiteWidth, setWhiteWidth] = useState('50%');
  const [blackWidth, setBlackWidth] = useState('50%');
  const [evaluationText, setEvaluationText] = useState('0.0');
  const [isWhiteWinning, setIsWhiteWinning] = useState(true);
  const [isCheckmated, setIsCheckmated] = useState(false);

  useEffect(() => {
    const totalWidth = 100; // percentage
    const maxEval = 1000; // max centipawn value
    const cpPerPixel = maxEval / (totalWidth / 2);

    let text = '0.0';
    let checkmated = false;
    
    if (evaluationType === 'cp' && evaluation !== null) {
      // Calculate widths based on centipawn evaluation
      const whiteWidthValue = Math.max(Math.min(totalWidth / 2 + evaluation / cpPerPixel, totalWidth), 0);
      const blackWidthValue = totalWidth - whiteWidthValue;
      
      setWhiteWidth(`${whiteWidthValue}%`);
      setBlackWidth(`${blackWidthValue}%`);
      
      text = (Math.abs(evaluation) / 100).toFixed(1);
      setIsWhiteWinning(evaluation >= 0);
    } else if (evaluationType === 'mate' && evaluation !== null) {
      // Handle mate scores
      text = `M${Math.abs(evaluation)}`;
      
      if (evaluation === 0) {
        checkmated = true;
        text = movedPlayer === 'white' ? '1-0' : '0-1';
      }
      
      // Set bar to show winner
      if (evaluation > 0) {
        // White is winning
        setWhiteWidth('100%');
        setBlackWidth('0%');
        setIsWhiteWinning(true);
      } else if (evaluation < 0) {
        // Black is winning
        setWhiteWidth('0%');
        setBlackWidth('100%');
        setIsWhiteWinning(false);
      } else if (evaluation === 0) {
        // Checkmate
        if (movedPlayer === 'white') {
          setWhiteWidth('100%');
          setBlackWidth('0%');
          setIsWhiteWinning(true);
        } else {
          setWhiteWidth('0%');
          setBlackWidth('100%');
          setIsWhiteWinning(false);
        }
      }
    }
    
    setEvaluationText(text);
    setIsCheckmated(checkmated);
  }, [evaluation, evaluationType, movedPlayer]);

  return (
    <BarContainer>
      <WhiteBar width={whiteWidth}>
        <WhiteText 
          isWhite={true} 
          visible={
            boardFlipped 
              ? isCheckmated 
                ? movedPlayer === 'black'
                : !isWhiteWinning
              : isCheckmated 
                ? movedPlayer === 'white'
                : isWhiteWinning
          }
        >
          {evaluationText}
        </WhiteText>
      </WhiteBar>
      
      <BlackBar width={blackWidth}>
        <BlackText 
          isWhite={false} 
          visible={
            boardFlipped 
              ? isCheckmated 
                ? movedPlayer === 'white'
                : isWhiteWinning
              : isCheckmated 
                ? movedPlayer === 'black'
                : !isWhiteWinning
          }
        >
          {evaluationText}
        </BlackText>
      </BlackBar>
    </BarContainer>
  );
};

export default EvaluationBar;
