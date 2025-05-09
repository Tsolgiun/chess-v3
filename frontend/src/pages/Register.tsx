import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import NavBar from '../components/NavBar/NavBar';
import { useAuth } from '../context/AuthContext';
import { ThemeColors } from '../types';

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Container = styled.div<ContainerProps>`
  max-width: 400px;
  margin: 120px auto;
  padding: 20px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, color 0.3s ease;
  
  @media (max-width: 768px) {
    margin-bottom: 90px; /* Add margin for the bottom navigation bar */
  }
`;

interface TitleProps {
  theme: { colors: ThemeColors };
}

const Title = styled.h1<TitleProps>`
  text-align: center;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 24px;
  transition: color 0.3s ease;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface InputProps {
  theme: { colors: ThemeColors };
}

const Input = styled.input<InputProps>`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-size: 16px;
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.accent}33`};
  }
`;

interface ButtonProps {
  theme: { colors: ThemeColors; theme?: string };
  disabled?: boolean;
}

const Button = styled.button<ButtonProps>`
  padding: 12px;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.theme === 'dark' ? '#000000' : '#ffffff'};
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
    transform: none;
  }
`;

const GoogleButton = styled(Button)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 1rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  span {
    padding: 0 10px;
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.875rem;
  }
`;

const Error = styled.div`
  color: #e74c3c;
  text-align: center;
  padding: 8px;
  font-size: 14px;
`;

interface LinkTextProps {
  theme: { colors: ThemeColors };
}

const LinkText = styled(Link)<LinkTextProps>`
  text-align: center;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface PasswordRequirementsProps {
  theme: { colors: ThemeColors };
}

const PasswordRequirements = styled.div<PasswordRequirementsProps>`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.7;
  padding: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.secondary};
  margin-top: -8px;
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const Register: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    
    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'An unknown error occurred during Google sign-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <Container>
      <Title>Create Account</Title>
      {error && <Error>{error}</Error>}
      
      <GoogleButton 
        type="button" 
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        Sign up with Google
      </GoogleButton>
      
      <Divider><span>OR</span></Divider>
      
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          minLength={3}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <PasswordRequirements>
          Password must be at least 6 characters long
        </PasswordRequirements>
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </Button>
        <LinkText to="/login">Already have an account? Login</LinkText>
      </Form>
      </Container>
    </>
  );
};

export default Register;
