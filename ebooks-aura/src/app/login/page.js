'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../api/apiUtils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting login for:', email);
      
      try {
        const data = await postAPI('/auth/login', {
          email,
          password,
        });
        
        console.log('Login successful, received data:', { ...data, token: data.token ? '***TOKEN_REDACTED***' : 'no token' });
        
        if (!data.token) {
          console.error('No token received in login response');
          setError('Authentication error: No token received');
          setIsLoading(false);
          return;
        }
        
        // Use the login function from context with the complete data (including token)
        login(data);
        
        console.log('Redirecting to home page...');
        // Redirect to homepage
        router.push('/');
      } catch (apiError) {
        console.error('API login error:', apiError);
        
        // Provide more user-friendly error messages
        if (apiError.message.includes('404') || apiError.message.includes('not found')) {
          setError('Login failed: The service is currently unavailable. Please try again later.');
        } else if (apiError.message.includes('401') || apiError.message.includes('unauthorized')) {
          setError('Invalid email or password. Please check your credentials.');
        } else {
          setError(apiError.message || 'Login failed. Please try again.');
        }
        
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleEbook}>Ebook</span>
            <span className={styles.titleAura}>Aura</span>
          </h1>
          <p className={styles.subtitle}>Welcome back! Please login to your account.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className={styles.forgotPassword}>
            <Link href="/forgot-password">Forgot Password?</Link>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={styles.register}>
          <p>Don't have an account? <Link href="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
} 