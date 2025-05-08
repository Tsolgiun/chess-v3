import React, { useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useGame } from '../../context/GameContext';
import { MoveHistoryProps } from '../../types/props';
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
    background: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.text};
    border-radius: 12px;
    padding: 16px;
    height: 350px;
    overflow-y: auto;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
    transition: background-color 0.3s ease, color 0.3s ease;
    position: relative;

    /* Scrollbar styling */
    &::-webkit-scrollbar {
        width: 8px;
    }
    
    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.colors.primary};
        border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colors.border};
        border-radius: 4px;
        
        &:hover {
            background: ${({ theme }) => theme.colors.accent};
        }
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    position: sticky;
    top: 0;
    background: ${({ theme }) => theme.colors.secondary};
    padding: 4px 0;
    z-index: 10;
`;

interface TitleProps {
    theme: { colors: ThemeColors };
}

const Title = styled.h3<TitleProps>`
    margin: 0;
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 600;
    transition: color 0.3s ease;
`;

const Controls = styled.div`
    display: flex;
    gap: 8px;
`;

interface ControlButtonProps {
    theme: { colors: ThemeColors };
    disabled?: boolean;
}

const ControlButton = styled.button<ControlButtonProps>`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    border: none;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background: ${({ theme }) => theme.colors.accent};
        color: #fff;
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        &:hover {
            background: ${({ theme }) => theme.colors.primary};
            color: ${({ theme }) => theme.colors.text};
        }
    }
`;

const MoveTable = styled.div`
    display: table;
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.95rem;
`;

interface MoveRowProps {
    theme: { colors: ThemeColors };
}

const MoveRow = styled.div<MoveRowProps>`
    display: table-row;
    animation: ${fadeIn} 0.3s ease-out;
    
    &:nth-child(even) {
        background-color: ${({ theme }) => `${theme.colors.primary}33`};
    }
    
    &:hover {
        background-color: ${({ theme }) => `${theme.colors.primary}66`};
    }
`;

interface MoveCellProps {
    theme: { colors: ThemeColors };
}

const MoveCell = styled.div<MoveCellProps>`
    display: table-cell;
    padding: 10px 6px;
    vertical-align: middle;
    border-bottom: 1px solid ${({ theme }) => `${theme.colors.border}33`};
`;

interface MoveNumberProps {
    theme: { colors: ThemeColors };
}

const MoveNumber = styled(MoveCell)<MoveNumberProps>`
    color: ${({ theme }) => `${theme.colors.text}99`};
    font-weight: 500;
    width: 40px;
    text-align: center;
    transition: color 0.3s ease;
`;

interface MoveProps {
    isLatest?: boolean;
    isSelected?: boolean;
    theme: { colors: ThemeColors };
}

const Move = styled(MoveCell)<MoveProps>`
    width: calc(50% - 20px);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-weight: ${props => (props.isLatest || props.isSelected) ? '600' : '400'};
    background: ${props => {
        if (props.isSelected) return props.theme.colors.accent + '66';
        if (props.isLatest) return props.theme.colors.accent + '33';
        return 'transparent';
    }};
    
    &:hover {
        background: ${({ theme }) => `${theme.colors.accent}33`};
    }
`;

const EmptyMove = styled(MoveCell)`
    width: calc(50% - 20px);
`;

interface MoveAnnotationProps {
    type?: 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'checkmate' | 'check';
    theme: { colors: ThemeColors };
}

const MoveAnnotationContainer = styled.span`
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
`;

const MoveAnnotationBadge = styled.img`
    width: 14px;
    height: 14px;
    margin-right: 2px;
`;

const MoveAnnotationText = styled.span<MoveAnnotationProps>`
    font-size: 0.85rem;
    color: ${props => {
        if (props.type === 'brilliant') return '#1abc9c';
        if (props.type === 'good') return '#2ecc71';
        if (props.type === 'inaccuracy') return '#f39c12';
        if (props.type === 'mistake') return '#e67e22';
        if (props.type === 'blunder') return '#e74c3c';
        return props.theme.colors.accent;
    }};
    font-weight: 600;
`;

interface NoMovesMessageProps {
    theme: { colors: ThemeColors };
}

const NoMovesMessage = styled.div<NoMovesMessageProps>`
    text-align: center;
    padding: 30px 0;
    color: ${({ theme }) => theme.colors.text}99;
    font-style: italic;
`;

interface MoveWithAnnotation {
    move: string;
    annotation: {
        symbol: string;
        type: 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'checkmate' | 'check';
    } | null;
}

// Helper function to parse move annotations
const parseMoveWithAnnotation = (move: string | undefined): MoveWithAnnotation => {
    if (!move) return { move: '', annotation: null };
    
    // Check for annotation symbols
    const annotations: Record<string, 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'checkmate' | 'check'> = {
        '!!': 'brilliant',
        '!': 'good',
        '?!': 'inaccuracy',
        '?': 'mistake',
        '??': 'blunder',
        '#': 'checkmate',
        '+': 'check'
    };
    
    let annotation: { symbol: string; type: 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'checkmate' | 'check'; } | null = null;
    let cleanMove = move;
    
    Object.entries(annotations).forEach(([symbol, type]) => {
        if (move.includes(symbol)) {
            annotation = { symbol, type };
            cleanMove = move.replace(symbol, '');
        }
    });
    
    return { move: cleanMove, annotation };
};

interface GroupedMove {
    moveNumber: number;
    whiteMove: string;
    blackMove: string | null;
    whiteIndex: number;
    blackIndex: number;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ 
    moves = [], 
    selectedMoveIndex = -1,
    onMoveClick,
    onFirstMove,
    onPreviousMove,
    onNextMove,
    onLastMove
}) => {
    const theme = useTheme();
    const { game } = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Group moves by pairs (White and Black)
    const groupedMoves: GroupedMove[] = [];
    for (let i = 0; i < moves.length; i += 2) {
        const whiteMove = moves[i];
        const blackMove = i + 1 < moves.length ? moves[i + 1] : null;
        groupedMoves.push({
            moveNumber: Math.floor(i / 2) + 1,
            whiteMove,
            blackMove,
            whiteIndex: i,
            blackIndex: i + 1
        });
    }
    
    const handleMoveClick = (index: number): void => {
        if (onMoveClick) {
            onMoveClick(index);
        }
    };
    
    const handleFirstMove = (): void => {
        if (onFirstMove) {
            onFirstMove();
        }
    };
    
    const handlePreviousMove = (): void => {
        if (onPreviousMove) {
            onPreviousMove();
        }
    };
    
    const handleNextMove = (): void => {
        if (onNextMove) {
            onNextMove();
        }
    };
    
    const handleLastMove = (): void => {
        if (onLastMove) {
            onLastMove();
        }
    };
    
    return (
        <Container ref={containerRef} theme={theme}>
            <Header>
                <Title theme={theme}>Move History</Title>
                <Controls>
                    <ControlButton 
                        onClick={handleFirstMove}
                        disabled={moves.length === 0}
                        title="First move"
                        theme={theme}
                    >
                        ⏮
                    </ControlButton>
                    <ControlButton 
                        onClick={handlePreviousMove}
                        disabled={selectedMoveIndex === -1}
                        title="Previous move"
                        theme={theme}
                    >
                        ◀
                    </ControlButton>
                    <ControlButton 
                        onClick={handleNextMove}
                        disabled={selectedMoveIndex === moves.length - 1 || moves.length === 0}
                        title="Next move"
                        theme={theme}
                    >
                        ▶
                    </ControlButton>
                    <ControlButton 
                        onClick={handleLastMove}
                        disabled={selectedMoveIndex === moves.length - 1 || moves.length === 0}
                        title="Last move"
                        theme={theme}
                    >
                        ⏭
                    </ControlButton>
                </Controls>
            </Header>
            
            {moves.length === 0 ? (
                <NoMovesMessage theme={theme}>No moves yet</NoMovesMessage>
            ) : (
                <MoveTable>
                    {groupedMoves.map((group, index) => {
                        const { move: whiteMove, annotation: whiteAnnotation } = parseMoveWithAnnotation(group.whiteMove);
                        const { move: blackMove, annotation: blackAnnotation } = parseMoveWithAnnotation(group.blackMove || undefined);
                        
                        const isLatestWhite = moves.length - 1 === group.whiteIndex;
                        const isLatestBlack = moves.length - 1 === group.blackIndex;
                        
                        return (
                            <MoveRow key={index} theme={theme}>
                                <MoveNumber theme={theme}>
                                    {group.moveNumber}.
                                </MoveNumber>
                                <Move 
                                    theme={theme}
                                    isLatest={isLatestWhite}
                                    isSelected={selectedMoveIndex === group.whiteIndex}
                                    onClick={() => handleMoveClick(group.whiteIndex)}
                                    
                                >
                                    {whiteMove}
                                    {whiteAnnotation && (
                                        <MoveAnnotationContainer>
                                            {['brilliant', 'good', 'inaccuracy', 'mistake', 'blunder'].includes(whiteAnnotation.type) && (
                                                <MoveAnnotationBadge 
                                                    src={`/icons/${whiteAnnotation.type}.png`} 
                                                    alt={whiteAnnotation.type} 
                                                />
                                            )}
                                            <MoveAnnotationText type={whiteAnnotation.type} theme={theme}>
                                                {whiteAnnotation.symbol}
                                            </MoveAnnotationText>
                                        </MoveAnnotationContainer>
                                    )}
                                </Move>
                                {group.blackMove ? (
                                    <Move 
                                        theme={theme}
                                        isLatest={isLatestBlack}
                                        isSelected={selectedMoveIndex === group.blackIndex}
                                        onClick={() => handleMoveClick(group.blackIndex)}
                                        
                                    >
                                        {blackMove}
                                        {blackAnnotation && (
                                            <MoveAnnotationContainer>
                                                {['brilliant', 'good', 'inaccuracy', 'mistake', 'blunder'].includes(blackAnnotation.type) && (
                                                    <MoveAnnotationBadge 
                                                        src={`/icons/${blackAnnotation.type}.png`} 
                                                        alt={blackAnnotation.type} 
                                                    />
                                                )}
                                                <MoveAnnotationText type={blackAnnotation.type} theme={theme}>
                                                    {blackAnnotation.symbol}
                                                </MoveAnnotationText>
                                            </MoveAnnotationContainer>
                                        )}
                                    </Move>
                                ) : (
                                    <EmptyMove theme={theme} />
                                )}
                            </MoveRow>
                        );
                    })}
                </MoveTable>
            )}
        </Container>
    );
};

export default MoveHistory;
