import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthContextType, AuthProviderProps, User } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to get or create user profile in Firestore
  const getUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      // Get ID token for backend requests
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // User exists in Firestore, return data
        const userData = userSnap.data();
        return { 
          _id: userSnap.id, 
          ...userData 
        } as User;
      } else {
        // Create new user profile
        const newUser: Omit<User, '_id'> = {
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          rating: 1200,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save to Firestore
        await setDoc(userRef, newUser);
        return { _id: firebaseUser.uid, ...newUser } as User;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userProfile = await getUserProfile(firebaseUser);
          setUser(userProfile);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Email/Password login
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await getUserProfile(userCredential.user);
      return userProfile;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'An error occurred during login');
    }
  };

  // Google sign-in
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userProfile = await getUserProfile(result.user);
      return userProfile;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'An error occurred during Google login');
    }
  };

  // Register with email/password
  const register = async (username: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile with username
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userData: Omit<User, '_id'> = {
        username,
        email,
        rating: 1200,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(userRef, userData);
      
      // Get ID token
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      
      const newUser = { _id: userCredential.user.uid, ...userData } as User;
      setUser(newUser);
      
      return newUser;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'An error occurred during registration');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'An error occurred during logout');
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      const userRef = doc(db, 'users', user._id);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, updatedData);
      
      // Update local state
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'An error occurred while updating profile');
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
