import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { NavBarProps } from '../../types/props';
import { ThemeColors } from '../../types/interfaces';

// Create wrapper components for the icons
const SunIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaSun({})}</div>
);
const MoonIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaMoon({})}</div>
);

interface NavProps {
  theme: { colors: ThemeColors };
}

const Nav = styled.nav<NavProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: ${({ theme }) => theme.colors.primary};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: background-color 0.3s ease;
`;

interface LogoProps {
  theme: { colors: ThemeColors };
  isDarkMode: boolean;
}

const Logo = styled(Link)<LogoProps>`
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: opacity 0.2s ease;

  img {
    height: 50px;
    margin-right: 10px;
  }

  span {
    font-family: 'Cormorant SC', serif;
    font-size: 1.8rem;
    color: ${({ isDarkMode }) => isDarkMode ? 'white' : 'black'};
    font-weight: 600;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

interface ButtonProps {
  variant?: 'primary';
  theme: { colors: ThemeColors };
}

const Button = styled(Link)<ButtonProps>`
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.accent};
  background: ${props => props.variant === 'primary' ?
    props.theme.colors.accent :
    'transparent'};
  border: ${props => props.variant === 'primary' ? 'none' : `2px solid ${props.theme.colors.accent}`};
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
`;

interface LogoutButtonProps {
  theme: { colors: ThemeColors };
}

const LogoutButton = styled.button<LogoutButtonProps>`
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: ${({ theme }) => theme.colors.highlight};
  }

  &:active {
    transform: translateY(0);
  }
`;

interface ThemeToggleProps {
  isDarkMode: boolean;
  theme: { colors: ThemeColors };
}

const ThemeToggle = styled.button<ThemeToggleProps>`
  padding: 8px;
  background: ${({ theme, isDarkMode }) => 
    isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  border: none;
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  width: 36px;
  height: 36px;
  position: relative;
  overflow: hidden;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme, isDarkMode }) => 
      isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  .icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .sun-icon {
    opacity: ${({ isDarkMode }) => isDarkMode ? 1 : 0};
    transform: ${({ isDarkMode }) => 
      isDarkMode ? 'scale(1)' : 'scale(0.5) rotate(-90deg)'};
  }

  .moon-icon {
    opacity: ${({ isDarkMode }) => isDarkMode ? 0 : 1};
    transform: ${({ isDarkMode }) => 
      isDarkMode ? 'scale(0.5) rotate(90deg)' : 'scale(1)'};
  }
`;

const NavBar: React.FC<NavBarProps> = ({ transparent }) => {
  const { user, logout } = useAuth();
  const themeContext = useTheme();
  const { theme, toggleTheme, colors } = themeContext;
  const isDarkMode = theme === 'dark';

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThemeToggle = (): void => {
    toggleTheme();
  };

  return (
    <Nav theme={themeContext}>
      <Logo to="/" theme={themeContext} isDarkMode={isDarkMode}>
        <img 
          src={isDarkMode ? `${process.env.PUBLIC_URL}/chessMn-white.png` : `${process.env.PUBLIC_URL}/chessMn-black.png`} 
          alt="Chess.mn Logo" 
        />
        <span>chess.mn</span>
      </Logo>
      <ButtonGroup>
        <ThemeToggle 
          onClick={handleThemeToggle} 
          aria-label="Toggle theme"
          isDarkMode={isDarkMode}
          theme={themeContext}
        >
          <SunIcon className="sun-icon icon" />
          <MoonIcon className="moon-icon icon" />
        </ThemeToggle>
        <Button to="/blog" theme={themeContext}>Blog</Button>
        {!user ? (
          <>
            <Button to="/login" theme={themeContext}>Login</Button>
            <Button to="/register" variant="primary" theme={themeContext}>Register</Button>
          </>
        ) : (
          <>
            <Button to="/profile" theme={themeContext}>Profile</Button>
            <Button to="/analysis" theme={themeContext}>Analysis</Button>
            <LogoutButton onClick={handleLogout} theme={themeContext}>Logout</LogoutButton>
          </>
        )}
      </ButtonGroup>
    </Nav>
  );
};

export default NavBar;
