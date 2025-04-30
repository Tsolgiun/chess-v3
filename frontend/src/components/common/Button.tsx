import React from 'react';
import styled from 'styled-components';

interface ButtonProps {
  primary?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  /* Size variations */
  padding: ${props => {
    switch (props.size) {
      case 'small':
        return '6px 12px';
      case 'large':
        return '12px 24px';
      default:
        return '8px 16px';
    }
  }};
  
  font-size: ${props => {
    switch (props.size) {
      case 'small':
        return '0.875rem';
      case 'large':
        return '1.125rem';
      default:
        return '1rem';
    }
  }};
  
  /* Primary/Secondary variations */
  background-color: ${props => props.primary 
    ? props.theme.colors.accent 
    : props.theme.colors.secondary};
  
  color: ${props => props.primary 
    ? '#ffffff' 
    : props.theme.colors.text};
  
  border: 1px solid ${props => props.primary 
    ? props.theme.colors.accent 
    : props.theme.colors.border};
  
  &:hover:not(:disabled) {
    background-color: ${props => props.primary 
      ? props.theme.colors.accent + 'dd'  // Add transparency
      : props.theme.colors.secondary + 'dd'};
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const Button: React.FC<ButtonProps> = ({ 
  children, 
  primary = false, 
  size = 'medium', 
  type = 'button',
  ...props 
}) => {
  return (
    <StyledButton
      primary={primary}
      size={size}
      type={type}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
