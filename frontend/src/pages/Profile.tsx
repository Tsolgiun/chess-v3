import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar/NavBar';
import BoardColorSelector from '../components/BoardColorSelector/BoardColorSelector';
import { ThemeColors, User } from '../types';

interface ContainerProps {
  theme: { colors: ThemeColors };
}

const Container = styled.div`
  max-width: 800px;
  margin: 120px auto;
  padding: 20px;
`;

interface ProfileCardProps {
  theme: { colors: ThemeColors };
}

const ProfileCard = styled.div<ProfileCardProps>`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 20px;
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
`;

interface AvatarProps {
  theme: { colors: ThemeColors; theme?: string };
}

const Avatar = styled.div<AvatarProps>`
  width: 100px;
  height: 100px;
  background: ${({ theme }) => theme.colors.accent};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#000000' : '#ffffff'};
  font-weight: bold;
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const UserInfo = styled.div`
  flex: 1;
`;

interface UsernameProps {
  theme: { colors: ThemeColors };
}

const Username = styled.h1<UsernameProps>`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  transition: color 0.3s ease;
`;

interface UserMetaProps {
  theme: { colors: ThemeColors };
}

const UserMeta = styled.div<UserMetaProps>`
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.7;
  font-size: 14px;
  margin-top: 5px;
  transition: color 0.3s ease;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
`;

interface StatCardProps {
  color?: string;
  theme: { colors: ThemeColors };
}

const StatCard = styled.div<StatCardProps>`
  background: ${props => props.color || props.theme.colors.secondary};
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  color: white;
  transition: transform 0.2s ease, background-color 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

interface ButtonProps {
  variant?: 'outline' | 'filled';
  theme: { colors: ThemeColors; theme?: string };
  disabled?: boolean;
}

const Button = styled.button<ButtonProps>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: ${props => props.variant === 'outline' ? 'transparent' : props.theme.colors.accent};
  color: ${props => props.variant === 'outline' ? props.theme.colors.accent : props.theme.theme === 'dark' ? '#000000' : '#ffffff'};
  border: ${props => props.variant === 'outline' ? `2px solid ${props.theme.colors.accent}` : 'none'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    opacity: ${props => props.variant === 'outline' ? 0.8 : 0.9};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logout();
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <NavBar />
      <Container>
      <ProfileCard>
        <Header>
          <Avatar>{getInitials(user.username)}</Avatar>
          <UserInfo>
            <Username>{user.username}</Username>
            <UserMeta>
              Member since {formatDate(user.createdAt)}
              <br />
              Rating: {user.rating}
            </UserMeta>
          </UserInfo>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </Header>

        <Stats>
          <StatCard color="#2ecc71">
            <StatValue>{user.wins || 0}</StatValue>
            <StatLabel>Wins</StatLabel>
          </StatCard>
          <StatCard color="#e74c3c">
            <StatValue>{user.losses || 0}</StatValue>
            <StatLabel>Losses</StatLabel>
          </StatCard>
          <StatCard color="#f39c12">
            <StatValue>{user.draws || 0}</StatValue>
            <StatLabel>Draws</StatLabel>
          </StatCard>
        </Stats>
        
        <BoardColorSelector />
      </ProfileCard>
      </Container>
    </>
  );
};

export default Profile;
