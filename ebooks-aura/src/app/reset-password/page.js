"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './reset-password.module.css';
import { postAPI } from '../api/apiUtils';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request token, 2 = reset password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const data = await postAPI('/auth/request-reset', { email });
      
      setSuccess('Reset link sent to your email address. Please check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const data = await postAPI('/auth/reset-password', {
        email,
        token,
        password: newPassword
      });

      setSuccess('Password reset successfully! You can now login with your new password.');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.resetBox}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleEbook}>Ebook</span>
            <span className={styles.titleAura}>Aura</span>
          </h1>
          <Link href="/login" className={styles.backLink}>
            <FaArrowLeft className={styles.backIcon} />
            Back to Login
          </Link>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {step === 1 ? (
          <>
            <h2 className={styles.subtitle}>Reset Your Password</h2>
            <form onSubmit={handleRequestReset} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <div className={styles.alternateReset}>
                <p>Or <Link href="/forgot-password">reset with verification code</Link> instead</p>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className={styles.subtitle}>Create New Password</h2>
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="token" className={styles.label}>Reset Token</label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={styles.input}
                  placeholder="Enter the token from your email"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 