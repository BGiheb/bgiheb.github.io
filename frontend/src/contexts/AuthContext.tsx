import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  firstLogin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isFirstLogin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  checkFirstLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      
      // Vérifier si c'est la première connexion
      await checkFirstLogin();
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      logout();
      setLoading(false);
    }
  };

  const checkFirstLogin = async (): Promise<boolean> => {
    try {
      if (!token) return false;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${apiUrl}/api/password/check-first-login`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const isFirst = response.data.firstLogin;
      setIsFirstLogin(isFirst);
      
      if (isFirst) {
        navigate('/first-login');
      }
      
      return isFirst;
    } catch (error) {
      console.error('Erreur lors de la vérification de première connexion:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });
      
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // Vérifier si c'est la première connexion après le login
      await checkFirstLogin();
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsFirstLogin(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isFirstLogin,
        loading,
        login,
        logout,
        checkFirstLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};