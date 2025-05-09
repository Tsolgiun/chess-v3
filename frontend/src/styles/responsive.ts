import { css } from 'styled-components';

// Breakpoints for different screen sizes
export const breakpoints = {
  xs: '320px',   // Small phones
  sm: '576px',   // Large phones
  md: '768px',   // Tablets
  lg: '992px',   // Small laptops
  xl: '1200px',  // Desktops
  xxl: '1400px'  // Large screens
};

// Media query helpers for styled-components
export const media = {
  xs: (styles: any) => css`
    @media (max-width: ${breakpoints.xs}) {
      ${styles}
    }
  `,
  sm: (styles: any) => css`
    @media (max-width: ${breakpoints.sm}) {
      ${styles}
    }
  `,
  md: (styles: any) => css`
    @media (max-width: ${breakpoints.md}) {
      ${styles}
    }
  `,
  lg: (styles: any) => css`
    @media (max-width: ${breakpoints.lg}) {
      ${styles}
    }
  `,
  xl: (styles: any) => css`
    @media (max-width: ${breakpoints.xl}) {
      ${styles}
    }
  `,
  xxl: (styles: any) => css`
    @media (max-width: ${breakpoints.xxl}) {
      ${styles}
    }
  `,
  custom: (maxWidth: string, styles: any) => css`
    @media (max-width: ${maxWidth}) {
      ${styles}
    }
  `,
  between: (minWidth: string, maxWidth: string, styles: any) => css`
    @media (min-width: ${minWidth}) and (max-width: ${maxWidth}) {
      ${styles}
    }
  `,
  minWidth: (minWidth: string, styles: any) => css`
    @media (min-width: ${minWidth}) {
      ${styles}
    }
  `,
  // Orientation-specific media queries
  portrait: (styles: any) => css`
    @media (orientation: portrait) {
      ${styles}
    }
  `,
  landscape: (styles: any) => css`
    @media (orientation: landscape) {
      ${styles}
    }
  `,
  // Touch device detection
  touch: (styles: any) => css`
    @media (hover: none) and (pointer: coarse) {
      ${styles}
    }
  `,
  mouse: (styles: any) => css`
    @media (hover: hover) and (pointer: fine) {
      ${styles}
    }
  `
};

// Container widths for different screen sizes
export const containerWidths = {
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  xxl: '1320px'
};

// Fluid spacing utility
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  xxl: '3rem',     // 48px
  xxxl: '4rem',    // 64px
  // Responsive spacing that changes based on screen size
  responsive: {
    xs: (multiplier: number = 1) => css`
      ${spacing.xs};
      
      ${media.md(`
        ${parseFloat(spacing.xs) * 0.85 * multiplier}rem
      `)}
      
      ${media.sm(`
        ${parseFloat(spacing.xs) * 0.75 * multiplier}rem
      `)}
    `,
    sm: (multiplier: number = 1) => css`
      ${spacing.sm};
      
      ${media.md(`
        ${parseFloat(spacing.sm) * 0.85 * multiplier}rem
      `)}
      
      ${media.sm(`
        ${parseFloat(spacing.sm) * 0.75 * multiplier}rem
      `)}
    `,
    md: (multiplier: number = 1) => css`
      ${spacing.md};
      
      ${media.md(`
        ${parseFloat(spacing.md) * 0.85 * multiplier}rem
      `)}
      
      ${media.sm(`
        ${parseFloat(spacing.md) * 0.75 * multiplier}rem
      `)}
    `,
    lg: (multiplier: number = 1) => css`
      ${spacing.lg};
      
      ${media.md(`
        ${parseFloat(spacing.lg) * 0.85 * multiplier}rem
      `)}
      
      ${media.sm(`
        ${parseFloat(spacing.lg) * 0.75 * multiplier}rem
      `)}
    `,
    xl: (multiplier: number = 1) => css`
      ${spacing.xl};
      
      ${media.md(`
        ${parseFloat(spacing.xl) * 0.85 * multiplier}rem
      `)}
      
      ${media.sm(`
        ${parseFloat(spacing.xl) * 0.75 * multiplier}rem
      `)}
    `
  }
};

// Responsive grid system
export const grid = {
  columns: 12,
  gutter: spacing.md,
  container: css`
    width: 100%;
    padding-right: ${spacing.md};
    padding-left: ${spacing.md};
    margin-right: auto;
    margin-left: auto;
    
    ${media.sm(css`
      max-width: ${containerWidths.sm};
    `)}
    
    ${media.minWidth(breakpoints.md, css`
      max-width: ${containerWidths.md};
    `)}
    
    ${media.minWidth(breakpoints.lg, css`
      max-width: ${containerWidths.lg};
    `)}
    
    ${media.minWidth(breakpoints.xl, css`
      max-width: ${containerWidths.xl};
    `)}
    
    ${media.minWidth(breakpoints.xxl, css`
      max-width: ${containerWidths.xxl};
    `)}
  `,
  row: css`
    display: flex;
    flex-wrap: wrap;
    margin-right: -${spacing.md};
    margin-left: -${spacing.md};
    
    ${media.md(css`
      margin-right: -${spacing.sm};
      margin-left: -${spacing.sm};
    `)}
  `,
  col: (size: number = 12) => css`
    flex: 0 0 ${(size / 12) * 100}%;
    max-width: ${(size / 12) * 100}%;
    padding-right: ${spacing.md};
    padding-left: ${spacing.md};
    
    ${media.md(css`
      padding-right: ${spacing.sm};
      padding-left: ${spacing.sm};
    `)}
  `
};

// Fluid typography
export const fluidTypography = {
  base: css`
    font-size: 16px;
    
    ${media.md(css`
      font-size: 15px;
    `)}
    
    ${media.sm(css`
      font-size: 14px;
    `)}
  `,
  heading1: css`
    font-size: 2.5rem;
    
    ${media.md(css`
      font-size: 2.25rem;
    `)}
    
    ${media.sm(css`
      font-size: 2rem;
    `)}
  `,
  heading2: css`
    font-size: 2rem;
    
    ${media.md(css`
      font-size: 1.75rem;
    `)}
    
    ${media.sm(css`
      font-size: 1.5rem;
    `)}
  `,
  heading3: css`
    font-size: 1.75rem;
    
    ${media.md(css`
      font-size: 1.5rem;
    `)}
    
    ${media.sm(css`
      font-size: 1.25rem;
    `)}
  `,
  heading4: css`
    font-size: 1.5rem;
    
    ${media.md(css`
      font-size: 1.25rem;
    `)}
    
    ${media.sm(css`
      font-size: 1.125rem;
    `)}
  `,
  paragraph: css`
    font-size: 1rem;
    
    ${media.sm(css`
      font-size: 0.95rem;
    `)}
  `,
  // Fluid typography that scales smoothly between viewport sizes
  fluid: (minSize: number, maxSize: number) => css`
    font-size: calc(${minSize}px + (${maxSize} - ${minSize}) * ((100vw - 320px) / (1200 - 320)));
    
    ${media.minWidth('1200px', css`
      font-size: ${maxSize}px;
    `)}
    
    ${media.xs(css`
      font-size: ${minSize}px;
    `)}
  `
};

// Helper for touch-friendly sizing
export const touchFriendly = {
  minTapSize: '44px',
  button: css`
    min-height: 44px;
    min-width: 44px;
    padding: 0.5rem 1rem;
    touch-action: manipulation;
    
    ${media.sm(css`
      min-height: 40px;
      min-width: 40px;
      padding: 0.4rem 0.8rem;
    `)}
  `,
  input: css`
    min-height: 44px;
    padding: 0.5rem 1rem;
    
    ${media.sm(css`
      min-height: 40px;
      padding: 0.4rem 0.8rem;
    `)}
  `,
  icon: css`
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    ${media.sm(css`
      min-width: 40px;
      min-height: 40px;
    `)}
  `
};

// Z-index management
export const zIndex = {
  navbar: 1000,
  modal: 2000,
  tooltip: 1500,
  dropdown: 1200,
  overlay: 1800,
  drawer: 1900
};

// Responsive layout helpers
export const layout = {
  // Responsive padding that adjusts based on screen size
  responsivePadding: css`
    padding: ${spacing.lg};
    
    ${media.md(css`
      padding: ${spacing.md};
    `)}
    
    ${media.sm(css`
      padding: ${spacing.sm};
    `)}
  `,
  // Responsive margin that adjusts based on screen size
  responsiveMargin: css`
    margin: ${spacing.lg};
    
    ${media.md(css`
      margin: ${spacing.md};
    `)}
    
    ${media.sm(css`
      margin: ${spacing.sm};
    `)}
  `,
  // Responsive gap for flex and grid layouts
  responsiveGap: css`
    gap: ${spacing.md};
    
    ${media.md(css`
      gap: ${spacing.sm};
    `)}
    
    ${media.sm(css`
      gap: ${spacing.xs};
    `)}
  `,
  // Airbnb-style card grid layout
  cardGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: ${spacing.md};
    
    ${media.md(css`
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: ${spacing.sm};
    `)}
    
    ${media.sm(css`
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: ${spacing.xs};
    `)}
  `
};
