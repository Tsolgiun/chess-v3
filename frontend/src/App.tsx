import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import styled from 'styled-components';
import { GameProvider } from './context/GameContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import GlobalStyle from './styles/GlobalStyle';
import Home from './pages/Home';
import Game from './pages/Game';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Review from './pages/Review';
import AnalysisPage from './pages/Analysis';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import NavBar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';
import GameSetup from './components/GameSetup/GameSetup';
import { PrivateRouteProps, PublicRouteProps } from './types';

import './App.css';

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : <>{children}</>;
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        style={{ width: '100%', height: '100%' }}
      >
        <Routes location={location}>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/" element={<Home />} />
          <Route path="/game/new" element={
            <PrivateRoute>
              <GameSetup />
            </PrivateRoute>
          } />
          <Route path="/game/:gameId" element={
            <PrivateRoute>
              <Game />
            </PrivateRoute>
          } />
          <Route path="/review/:reviewGameId" element={<Review />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Main container for the application layout
const ScaledContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const AppContent: React.FC = () => {
  const theme = useTheme();
  return (
    <StyledThemeProvider theme={{ colors: theme.colors, boardColors: theme.boardColors }}>
      <GlobalStyle theme={{ colors: theme.colors }} />
      <GameProvider>
        <div className="App">
          <ScaledContainer>
            <NavBar />
            <AnimatedRoutes />
            <Footer />
          </ScaledContainer>
        </div>
      </GameProvider>
    </StyledThemeProvider>
  );
};

export default App;
