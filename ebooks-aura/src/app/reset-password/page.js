/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './reset-password.module.css';
import { postAPI } from '../api/apiUtils';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request code, 2 = enter code, 3 = set new password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // Check if email is provided in query params (from external link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const data = await postAPI('/auth/request-reset', { email });
      
      setSuccess('Verification code sent to your email address. Please check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const data = await postAPI('/auth/verify-reset-code', {
        email,
        code: verificationCode
      });

      if (data.isValid) {
        setSuccess('Code verified successfully. Please set your new password.');
        setIsCodeVerified(true);
        setStep(3);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
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

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const data = await postAPI('/auth/reset-password', {
        email,
        code: verificationCode,
        password: newPassword
      });

      setSuccess('Password reset successfully! You can now login with your new password.');
      // Clear form fields for security
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
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
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          </>
        );
      case 2:
        return (
          <>
            <h2 className={styles.subtitle}>Enter Verification Code</h2>
            <form onSubmit={handleVerifyCode} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="verificationCode" className={styles.label}>Verification Code</label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className={styles.input}
                  placeholder="Enter the 6-digit code from your email"
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
              <div className={styles.resendCode}>
                <button 
                  type="button" 
                  onClick={() => {
                    setStep(1);
                    setSuccess('');
                  }}
                  className={styles.textButton}
                >
                  Resend verification code
                </button>
              </div>
            </form>
          </>
        );
      case 3:
        return (
          <>
            <h2 className={styles.subtitle}>Create New Password</h2>
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Enter new password (min. 8 characters)"
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
        );
      default:
        return null;
    }
  };

  // Render the step indicator
  const renderStepIndicator = () => {
    return (
      <div className={styles.verificationSteps}>
        <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''} ${step > 1 ? styles.stepComplete : ''}`}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepText}>Request Code</div>
        </div>
        <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''} ${step > 2 ? styles.stepComplete : ''}`}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepText}>Verify Code</div>
        </div>
        <div className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepText}>New Password</div>
        </div>
      </div>
    );
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

        {renderStepIndicator()}

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {renderStep()}
      </div>
    </div>
  );
} 