import { createGlobalStyle } from 'styled-components';
import { ThemeColors } from '../types';
import { media, spacing, touchFriendly } from './responsive';

interface GlobalStyleProps {
  theme: {
    colors: ThemeColors;
    boardColors?: {
      lightSquare: string;
      darkSquare: string;
    };
  };
}

const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    
    ${media.md(`
      font-size: 15px;
    `)}
    
    ${media.sm(`
      font-size: 14px;
    `)}
  }

  body {
    font-family: 'Roboto', sans-serif;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.3s ease, color 0.3s ease;
    overflow-x: hidden;
    min-height: 100vh;
    width: 100%;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    margin-bottom: ${spacing.md};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.2;
  }

  h1 { 
    font-size: 2.5rem; 
    ${media.md(`font-size: 2.25rem;`)}
    ${media.sm(`font-size: 2rem;`)}
  }
  
  h2 { 
    font-size: 2rem; 
    ${media.md(`font-size: 1.75rem;`)}
    ${media.sm(`font-size: 1.5rem;`)}
  }
  
  h3 { 
    font-size: 1.75rem; 
    ${media.md(`font-size: 1.5rem;`)}
    ${media.sm(`font-size: 1.25rem;`)}
  }
  
  h4 { 
    font-size: 1.5rem; 
    ${media.md(`font-size: 1.25rem;`)}
    ${media.sm(`font-size: 1.125rem;`)}
  }
  
  h5 { 
    font-size: 1.25rem; 
    ${media.md(`font-size: 1.125rem;`)}
    ${media.sm(`font-size: 1rem;`)}
  }
  
  h6 { 
    font-size: 1rem; 
    ${media.sm(`font-size: 0.9rem;`)}
  }

  p {
    margin-bottom: ${spacing.md};
  }

  button {
    font-family: inherit;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    ${touchFriendly.button}
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  }

  input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border};
    transition: all 0.3s ease;
    ${touchFriendly.input}

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accent};
    }
  }

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.accent};
    transition: all 0.2s ease;
    display: inline-block;
    min-height: 44px;
    line-height: 44px;

    &:hover {
      opacity: 0.8;
    }
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Improve accessibility for focus states */
  :focus {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  /* Improve scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;

    &:hover {
      background: ${({ theme }) => theme.colors.accent};
    }
  }

  /* Animation classes */
  .fadeIn {
    animation: fadeIn 0.3s ease-in;
  }

  .moveIn {
    animation: moveIn 0.3s ease-out;
  }

  .pulse {
    animation: pulse 1s infinite;
  }

  /* Container class for consistent layout */
  .container {
    width: 100%;
    padding-right: ${spacing.md};
    padding-left: ${spacing.md};
    margin-right: auto;
    margin-left: auto;
    
    ${media.minWidth('576px', `
      max-width: 540px;
    `)}
    
    ${media.minWidth('768px', `
      max-width: 720px;
    `)}
    
    ${media.minWidth('992px', `
      max-width: 960px;
    `)}
    
    ${media.minWidth('1200px', `
      max-width: 1140px;
    `)}
    
    ${media.minWidth('1400px', `
      max-width: 1320px;
    `)}
  }

  /* Utility classes */
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  
  .d-flex { display: flex; }
  .flex-column { flex-direction: column; }
  .flex-row { flex-direction: row; }
  .justify-content-center { justify-content: center; }
  .justify-content-between { justify-content: space-between; }
  .align-items-center { align-items: center; }
  .flex-wrap { flex-wrap: wrap; }
  
  .mt-1 { margin-top: ${spacing.xs}; }
  .mt-2 { margin-top: ${spacing.sm}; }
  .mt-3 { margin-top: ${spacing.md}; }
  .mt-4 { margin-top: ${spacing.lg}; }
  .mt-5 { margin-top: ${spacing.xl}; }
  
  .mb-1 { margin-bottom: ${spacing.xs}; }
  .mb-2 { margin-bottom: ${spacing.sm}; }
  .mb-3 { margin-bottom: ${spacing.md}; }
  .mb-4 { margin-bottom: ${spacing.lg}; }
  .mb-5 { margin-bottom: ${spacing.xl}; }
  
  .mx-auto { 
    margin-left: auto;
    margin-right: auto;
  }

  .w-100 { width: 100%; }
  .h-100 { height: 100%; }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes moveIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  /* Hide elements visually but keep them accessible for screen readers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Touch device optimizations */
  @media (hover: none) {
    a, button {
      &:hover {
        /* Remove hover effects on touch devices */
        transform: none !important;
        box-shadow: none !important;
      }
    }
  }
`;

export default GlobalStyle;
