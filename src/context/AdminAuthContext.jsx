import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if admin is already logged in (from localStorage)
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('adminAuth');
      if (savedAuth === 'true') {
        setIsAdminLoggedIn(true);
      }
    } catch (error) {
      console.error('Error loading admin auth:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (password) => {
    // Simple password check (in production, use backend authentication)
    const ADMIN_PASSWORD = 'admin123'; // Change this to your desired password
    
    if (password === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('adminAuth', 'true');
      return { success: true };
    }
    
    return { success: false, message: 'Invalid password' };
  };

  const logout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('adminAuth');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
