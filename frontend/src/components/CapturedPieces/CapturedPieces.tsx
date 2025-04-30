import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { CapturedPiecesProps } from '../../types/props';
import { ThemeColors } from '../../types/interfaces';

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
    theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
`;

interface TitleProps {
    theme: { colors: ThemeColors };
}

const Title = styled.h3<TitleProps>`
    margin: 0 0 12px 0;
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 600;
    transition: color 0.3s ease;
`;

interface RowProps {
    isLight?: boolean;
    advantage: number;
    theme: { colors: ThemeColors };
}

const Row = styled.div<RowProps>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: ${props => props.isLight ? ({ theme }) => theme.colors.primary : ({ theme }) => `${theme.colors.primary}80`};
    border-radius: 10px;
    min-height: 40px;
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${props => props.advantage > 0 ? ({ theme }) => theme.colors.accent : 
                              props.advantage < 0 ? '#e74c3c' : 'transparent'};
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }
`;

const PiecesContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    animation: ${fadeIn} 0.3s ease-out;
`;

const PieceGroup = styled.div`
    display: flex;
    align-items: center;
    margin-right: 8px;
    position: relative;
`;

interface PieceProps {
    image: string;
    isDimmed?: boolean;
}

const Piece = styled.div<PieceProps>`
    width: 28px;
    height: 28px;
    background-image: url(${props => props.image});
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    filter: ${props => props.isDimmed ? 'brightness(0.8)' : 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.2))'};
    transition: all 0.2s ease;

    &:hover {
        transform: scale(1.15);
        filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3));
    }
`;

interface PieceCountProps {
    theme: { colors: ThemeColors };
}

const PieceCount = styled.span<PieceCountProps>`
    position: absolute;
    bottom: -5px;
    right: -5px;
    background: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

interface MaterialDifferenceProps {
    advantage: number;
    theme: { colors: ThemeColors };
}

const MaterialDifference = styled.div<MaterialDifferenceProps>`
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: 600;
    font-size: 0.95rem;
    color: ${props => props.advantage > 0 ? ({ theme }) => theme.colors.accent : 
                      props.advantage < 0 ? '#e74c3c' : ({ theme }) => theme.colors.text};
    padding: 4px 8px;
    background: ${({ theme }) => `${theme.colors.secondary}80`};
    border-radius: 6px;
    transition: all 0.3s ease;
    
    &::before {
        content: ${props => props.advantage > 0 ? '"+"' : ''};
    }
`;

interface CapturedPiecesCount {
    [color: string]: {
        [pieceType: string]: number;
    };
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ position }) => {
    const theme = useTheme();
    // Calculate captured pieces from position
    const calculateCapturedPieces = (): CapturedPiecesCount => {
        const initialPieces: Record<string, number> = {
            'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1
        };
        
        const currentPieces: Record<string, Record<string, number>> = {
            'w': { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0 },
            'b': { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0 }
        };

        // Count current pieces on board
        for (let piece of position.split(' ')[0].split('')) {
            if (piece === '/') continue;
            if (!isNaN(parseInt(piece))) continue;

            const color = piece === piece.toUpperCase() ? 'w' : 'b';
            const pieceType = piece.toLowerCase();
            
            if (currentPieces[color][pieceType] !== undefined) {
                currentPieces[color][pieceType]++;
            }
        }

        // Calculate captured pieces
        const captured: Record<string, Record<string, number>> = {
            'w': {},
            'b': {}
        };

        for (let pieceType in initialPieces) {
            captured['w'][pieceType] = initialPieces[pieceType] - currentPieces['w'][pieceType];
            captured['b'][pieceType] = initialPieces[pieceType] - currentPieces['b'][pieceType];
        }

        return captured;
    };

    const pieceValues: Record<string, number> = {
        'p': 1,
        'n': 3,
        'b': 3,
        'r': 5,
        'q': 9
    };

    const calculateAdvantage = (captured: CapturedPiecesCount): number => {
        let whiteAdvantage = 0;
        
        for (let pieceType in captured['b']) {
            whiteAdvantage += captured['b'][pieceType] * pieceValues[pieceType];
        }
        
        for (let pieceType in captured['w']) {
            whiteAdvantage -= captured['w'][pieceType] * pieceValues[pieceType];
        }
        
        return whiteAdvantage;
    };

    const captured = calculateCapturedPieces();
    const advantage = calculateAdvantage(captured);

    const renderPieceGroups = (color: string): React.ReactElement[] => {
        const pieceGroups: React.ReactElement[] = [];
        const pieceTypes = ['q', 'r', 'b', 'n', 'p'];
        const opponentColor = color === 'w' ? 'black' : 'white';
        
        pieceTypes.forEach(type => {
            const count = captured[color][type];
            if (count > 0) {
                const pieceType = 
                    type === 'p' ? 'pawn' :
                    type === 'n' ? 'knight' :
                    type === 'b' ? 'bishop' :
                    type === 'r' ? 'rook' : 'queen';
                
                pieceGroups.push(
                    <PieceGroup key={`${color}-${type}`}>
                        <Piece 
                            image={`/pieces/${opponentColor}-${pieceType}.png`}
                            isDimmed={advantage === 0}
                        />
                        {count > 1 && <PieceCount theme={theme}>{count}</PieceCount>}
                    </PieceGroup>
                );
            }
        });
        
        return pieceGroups;
    };

    return (
        <Container theme={theme}>
            <Title theme={theme}>Material</Title>
            <Row 
                isLight 
                advantage={advantage}
                theme={theme}
            >
                <PiecesContainer>
                    {renderPieceGroups('b')}
                </PiecesContainer>
                {advantage > 0 && (
                    <MaterialDifference advantage={advantage} theme={theme}>
                        {Math.abs(advantage)}
                    </MaterialDifference>
                )}
            </Row>
            <Row 
                advantage={-advantage}
                theme={theme}
            >
                <PiecesContainer>
                    {renderPieceGroups('w')}
                </PiecesContainer>
                {advantage < 0 && (
                    <MaterialDifference advantage={-advantage} theme={theme}>
                        {Math.abs(advantage)}
                    </MaterialDifference>
                )}
            </Row>
        </Container>
    );
};

export default CapturedPieces;
