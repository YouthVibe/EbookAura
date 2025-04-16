'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './verify-email.module.css';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();
  
  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/users/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }
      
      setSuccess(true);
      
      // Use the login function from context
      login(data);
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/users/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }
      
      // Show message that code was sent
      setError('');
      alert('A new verification code has been sent to your email');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.verifyBox}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              <span className={styles.titleEbook}>Ebook</span>
              <span className={styles.titleAura}>Aura</span>
            </h1>
            <p className={styles.subtitle}>Email Verification Successful!</p>
          </div>
          
          <div className={styles.successMessage}>
            <p>Your email has been verified successfully.</p>
            <p>You will be redirected to the homepage in a moment...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.verifyBox}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleEbook}>Ebook</span>
            <span className={styles.titleAura}>Aura</span>
          </h1>
          <p className={styles.subtitle}>Verify Your Email</p>
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
              disabled={!!searchParams.get('email')}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="code" className={styles.label}>Verification Code</label>
            <input
              type="text"
              id="code"
              className={styles.input}
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              required
              pattern="[0-9]{6}"
              maxLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        
        <div className={styles.resendCode}>
          <p>Didn't receive the code? <button 
            type="button" 
            className={styles.resendButton}
            onClick={handleResendCode}
            disabled={isLoading}
          >
            Resend Code
          </button></p>
        </div>
        
        <div className={styles.backToLogin}>
          <Link href="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
} 