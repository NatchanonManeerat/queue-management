import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { showToast } from '../../services/notificationService';
import '../pages.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!password.trim()) {
        throw new Error('Please enter password');
      }

      const result = login(password);

      if (result.success) {
        showToast('Login successful! Welcome admin.', 'success');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 800);
      } else {
        showToast(result.message || 'Login failed', 'error');
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="login-header">
          <h1>🔐 Admin Login</h1>
          <p className="subtitle">Enter your admin password to access dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Admin Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your admin password"
                disabled={loading}
                autoFocus
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>

        <div className="login-footer">
          <p className="hint">
            ℹ️ Default password: <code>admin123</code>
          </p>
          <p className="hint-secondary">
            For production, change this in AdminAuthContext.jsx
          </p>
        </div>
      </div>
    </div>
  );
}
