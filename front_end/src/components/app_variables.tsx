// AppContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useHistory } from 'react-router-dom';


interface AppContextProps {
    user_id: number | null;
    setuser_id: React.Dispatch<React.SetStateAction<number | null>>;
    username: string | null;
    setusername: React.Dispatch<React.SetStateAction<string | null>>;
  }

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const history = useHistory();
  const [username, setusername] = useState<string | null>(() => localStorage.getItem('username') || null);
  const [user_id, setuser_id] = useState<number | null>(() => {
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id, 10) : null;
  });

  useEffect(() => {
    localStorage.setItem('user_id', user_id?.toString() || '');
    localStorage.setItem('username', username || '');
  }, [user_id, username]);
  
  return (
    <AppContext.Provider
      value={{
        user_id,
        setuser_id,
        username,
        setusername
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};