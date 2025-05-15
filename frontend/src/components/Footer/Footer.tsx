import React from 'react';
import styled from 'styled-components';
import { FaGithub, FaEnvelope, FaUniversity } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { media, touchFriendly } from '../../styles/responsive';
import { ThemeColors } from '../../types/interfaces';

// Create wrapper components for the icons
const GithubIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaGithub({})}</div>
);
const EnvelopeIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaEnvelope({})}</div>
);
const UniversityIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div {...props}>{FaUniversity({})}</div>
);

interface FooterProps {
  theme: { colors: ThemeColors };
}

const FooterContainer = styled.footer<FooterProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  width: 100%;
  margin-top: auto;
  transform: scale(0.9); /* Make the footer 90% of its original size */
  
  ${media.md(`
    padding: 1.2rem 0.8rem;
  `)}
  
  ${media.sm(`
    padding: 1rem 0.5rem;
  `)}
`;

const IconsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 1rem 0;
  
  ${media.sm(`
    gap: 1.2rem;
  `)}
`;

interface IconLinkProps {
  theme: { colors: ThemeColors };
}

const IconLink = styled.a<IconLinkProps>`
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.5rem;
  transition: all 0.3s ease;
  ${touchFriendly.icon}
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-3px);
  }
  
  ${media.sm(`
    font-size: 1.3rem;
  `)}
`;

const Copyright = styled.p`
  font-size: 0.9rem;
  margin: 0.5rem 0;
  text-align: center;
  
  ${media.sm(`
    font-size: 0.8rem;
  `)}
`;

const Footer: React.FC = () => {
  const themeContext = useTheme();
  
  return (
    <FooterContainer theme={themeContext}>
      <IconsContainer>
        <IconLink 
          href="https://github.com/Tsolgiun" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="GitHub Profile"
          theme={themeContext}
        >
          <GithubIcon />
        </IconLink>
        <IconLink 
          href="mailto:tsolgiunjaaya@gmail.com" 
          aria-label="Email"
          theme={themeContext}
        >
          <EnvelopeIcon />
        </IconLink>
        <IconLink 
          href="https://en.csu.edu.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Central South University"
          theme={themeContext}
        >
          <UniversityIcon />
        </IconLink>
      </IconsContainer>
      <Copyright>© {new Date().getFullYear()} Chess.mn. All rights reserved.</Copyright>
    </FooterContainer>
  );
};

export default Footer;
