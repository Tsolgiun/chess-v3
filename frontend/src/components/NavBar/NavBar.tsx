import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaSun, FaMoon, FaBars, FaTimes, FaBlog, FaUser, FaChartBar, FaSignOutAlt } from 'react-icons/fa';
import { NavBarProps } from '../../types/props';
import { ThemeColors } from '../../types/interfaces';
import { media, touchFriendly, zIndex } from '../../styles/responsive';

// Create wrapper components for the icons
const SunIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaSun({})}</div>
);
const MoonIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaMoon({})}</div>
);
const MenuIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaBars({})}</div>
);
const CloseIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaTimes({})}</div>
);

interface NavProps {
  theme: { colors: ThemeColors };
  transparent?: boolean;
}

const Nav = styled.nav<NavProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 70px;
  background: ${({ theme, transparent }) => transparent ? 'transparent' : theme.colors.primary};
  box-shadow: ${({ transparent }) => transparent ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: ${zIndex.navbar};
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
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
  height: 70px;
  padding: 10px 0;

  img {
    height: 50px;
    margin-right: 10px;
    
    ${media.sm(`
      height: 40px;
    `)}
  }

  span {
    font-family: 'Cormorant SC', serif;
    font-size: 1.8rem;
    color: ${({ isDarkMode }) => isDarkMode ? 'white' : 'black'};
    font-weight: 600;
    
    ${media.sm(`
      font-size: 1.5rem;
    `)}
  }

  &:hover {
    opacity: 0.8;
  }
`;

interface ButtonGroupProps {
  theme: { colors: ThemeColors };
}

const ButtonGroup = styled.div<ButtonGroupProps>`
  display: flex;
  gap: 12px;
  align-items: center;
  
  ${media.md(`
    display: none;
  `)}
`;

const BottomNavigation = styled.div`
  display: none;
  
  ${media.md(`
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${(props: { theme: { colors: ThemeColors } }) => 
      props.theme.colors.primary === '#1e1e1e' ? '#1e1e1e' : '#ffffff'
    } !important;
    background: ${(props: { theme: { colors: ThemeColors } }) => 
      props.theme.colors.primary === '#1e1e1e' ? '#1e1e1e' : '#ffffff'
    } !important;
    opacity: 1 !important;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: ${zIndex.navbar};
    height: 60px;
    justify-content: space-between;
    align-items: center;
    padding: 0 5px;
    box-sizing: border-box;
    width: 100%;
  `)}
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  padding: 8px 0;
  width: 25%;
  box-sizing: border-box;
  
  svg {
    font-size: 1.5rem;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const LogoutNavItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  padding: 8px 0;
  width: 25%;
  background: transparent;
  border: none;
  cursor: pointer;
  box-sizing: border-box;
  
  svg {
    font-size: 1.5rem;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

interface ButtonProps {
  variant?: 'primary';
  theme: { colors: ThemeColors };
  fullWidth?: boolean;
}

const Button = styled(Link)<ButtonProps>`
  padding: 6px 20px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 36px;
  
  ${media.md(`
    width: ${(props: ButtonProps) => props.fullWidth ? '100%' : 'auto'};
    min-width: 70px;
    height: 34px;
    padding: 4px 16px;
  `)}

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
  fullWidth?: boolean;
}

const LogoutButton = styled.button<LogoutButtonProps>`
  padding: 6px 20px;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 36px;
  
  ${media.md(`
    width: ${(props: LogoutButtonProps) => props.fullWidth ? '100%' : 'auto'};
    min-width: 70px;
    height: 34px;
    padding: 4px 16px;
  `)}

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
  ${touchFriendly.icon}

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

// Remove MobileMenuButton and Overlay as they're no longer needed

const NavBar: React.FC<NavBarProps> = ({ transparent = false }) => {
  const { user, logout } = useAuth();
  const themeContext = useTheme();
  const { theme, toggleTheme } = themeContext;
  const isDarkMode = theme === 'dark';
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    <>
      <Nav theme={themeContext} transparent={transparent && !scrolled}>
        <Logo to="/" theme={themeContext} isDarkMode={isDarkMode}>
          <img 
            src={isDarkMode ? `${process.env.PUBLIC_URL}/chessMn-white.png` : `${process.env.PUBLIC_URL}/chessMn-black.png`} 
            alt="Chess.mn Logo" 
          />
          <span>chess.mn</span>
        </Logo>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <ThemeToggle 
            onClick={handleThemeToggle} 
            aria-label="Toggle theme"
            isDarkMode={isDarkMode}
            theme={themeContext}
          >
            <SunIcon className="sun-icon icon" />
            <MoonIcon className="moon-icon icon" />
          </ThemeToggle>
          
          <ButtonGroup theme={themeContext}>
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
        </div>
      </Nav>
      
      {/* Bottom Navigation for Mobile */}
      {user ? (
        <BottomNavigation 
          theme={themeContext}
          style={{
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            opacity: 1
          }}
        >
          <NavItem to="/blog" theme={themeContext}>
            <div>{FaBlog({})}</div>
          </NavItem>
          <NavItem to="/profile" theme={themeContext}>
            <div>{FaUser({})}</div>
          </NavItem>
          <NavItem to="/analysis" theme={themeContext}>
            <div>{FaChartBar({})}</div>
          </NavItem>
          <LogoutNavItem onClick={handleLogout} theme={themeContext}>
            <div>{FaSignOutAlt({})}</div>
          </LogoutNavItem>
        </BottomNavigation>
      ) : (
        <BottomNavigation 
          theme={themeContext}
          style={{
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            opacity: 1
          }}
        >
          <NavItem to="/blog" theme={themeContext}>
            <div>{FaBlog({})}</div>
          </NavItem>
          <NavItem to="/login" theme={themeContext}>
            <div>{FaUser({})}</div>
          </NavItem>
          <NavItem to="/register" theme={themeContext}>
            <div>{FaSignOutAlt({})}</div>
          </NavItem>
        </BottomNavigation>
      )}
    </>
  );
};

export default NavBar;
