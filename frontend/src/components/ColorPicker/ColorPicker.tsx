import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ThemeColors } from '../../types/interfaces';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  background: ${({ theme }) => theme.colors.secondary};
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

interface LabelProps {
  theme: { colors: ThemeColors };
}

const Label = styled.label<LabelProps>`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.text};
`;

interface ColorPreviewProps {
  color: string;
  theme: { colors: ThemeColors };
}

const ColorPreview = styled.div<ColorPreviewProps>`
  width: 100%;
  height: 40px;
  background-color: ${props => props.color};
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.colors.border};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

interface ColorInputProps {
  theme: { colors: ThemeColors };
}

const ColorInput = styled.input<ColorInputProps>`
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  font-family: monospace;
  margin-top: 8px;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    outline: none;
  }
`;

interface ColorValueProps {
  theme: { colors: ThemeColors };
}

const ColorValue = styled.div<ColorValueProps>`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.8;
  font-family: monospace;
  margin-bottom: 8px;
`;

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange }) => {
  const [inputValue, setInputValue] = useState<string>(color);
  
  // Update input value when color prop changes
  useEffect(() => {
    setInputValue(color);
  }, [color]);
  
  // Validate hex color and update if valid
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Only update parent if it's a valid hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
      onChange(value);
    }
  };
  
  // Update color when input loses focus, ensuring it's a valid hex
  const handleBlur = () => {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(inputValue)) {
      // Reset to the current valid color if input is invalid
      setInputValue(color);
    }
  };

  return (
    <Container>
      <Label>{label}</Label>
      <ColorPreview color={color}>
        <input 
          type="color" 
          value={color} 
          onChange={(e) => onChange(e.target.value)} 
        />
      </ColorPreview>
      <ColorValue>{color}</ColorValue>
      <ColorInput 
        type="text" 
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder="Enter hex color (e.g. #RRGGBB)"
      />
    </Container>
  );
};

export default ColorPicker;
