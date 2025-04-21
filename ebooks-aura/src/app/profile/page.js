'use client';

import { getAPI, postAPI, putAPI, deleteAPI } from '../api/apiUtils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaEdit, FaCamera, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './profile.module.css';

export default function Profile() {
  const { user, logout, getToken } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    // Fetch profile data if user is logged in
    if (user) {
      fetchProfileData();
    }
  }, [user, router]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const data = await getAPI('/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.message || 'An error occurred while fetching your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.profileContainer}>
          <div className={styles.loading}>
            <div className={styles.loadingAnimation}></div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, the redirect will handle it
  if (!user) return null;

  return (
    <div className={styles.container} style={{ marginTop: '20px' }}>
      <div className={styles.profileContainer}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <FaArrowLeft className={styles.backIcon} />
            Back to Home
          </Link>
          <h1 className={styles.headerTitle} style={{ marginTop: '40px' }}>My Profile</h1>
          <p className={styles.headerSubtitle} style={{ marginTop: '10px' }}>Manage your account information</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {profileData && (
          <>
            <div className={styles.avatarSection}>
              <Image
                src={profileData.profileImage || '/logo.svg'}
                alt="Profile"
                width={120}
                height={120}
                className={styles.avatar}
                style={{ objectFit: 'cover', marginTop: '10px' }}
              />
              <Link href="/profile/upload-image" className={styles.editAvatarButton}>
                <FaCamera className={styles.editIcon} />
                Change Photo
              </Link>
            </div>

            <div className={styles.profileContent}>
              <div className={styles.infoSection}>
                <div className={styles.infoHeader}>
                  <h2 className={styles.infoTitle}>Personal Information</h2>
                  <Link href="/profile/edit" className={styles.editButton}>
                    <FaEdit className={styles.editIcon} />
                    Edit
                  </Link>
                </div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Username</p>
                    <p className={styles.infoValue}>{profileData.name}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Full Name</p>
                    <p className={styles.infoValue}>{profileData.fullName || 'Not provided'}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Email</p>
                    <p className={styles.infoValue} style={{ wordBreak: 'break-word' }}>{profileData.email}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Account Created</p>
                    <p className={styles.infoValue}>{new Date(profileData.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Email Verified</p>
                    <p className={styles.infoValue}>{profileData.isEmailVerified ? 'Yes' : 'No'}</p>
                  </div>
                  {((user && user.isAdmin) || (profileData && profileData.isAdmin)) && (
                    <div className={styles.infoItem}>
                      <p className={styles.infoLabel}>Admin Status</p>
                      <p className={styles.infoValue} style={{ color: '#e63946', fontWeight: 'bold' }}>Administrator</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.bioSection}>
                <div className={styles.bioHeader}>
                  <h2 className={styles.bioTitle}>About Me</h2>
                  <Link href="/profile/edit" className={styles.editButton}>
                    <FaEdit className={styles.editIcon} />
                    Edit
                  </Link>
                </div>
                {profileData.bio ? (
                  <p className={styles.bioContent}>{profileData.bio}</p>
                ) : (
                  <p className={styles.noBioMessage}>No bio information added yet.</p>
                )}
              </div>

              <div className={styles.actionButtons}>
                {(user && user.isAdmin) || (profileData && profileData.isAdmin) ? (
                  <Link href="/profile/upload-pdf" className={`${styles.editProfileButton} ${styles.adminButton}`} style={{
                    backgroundColor: '#e63946',
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2zm2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2z"/>
                    </svg>
                    Upload PDF
                  </Link>
                ) : null}
                
                <Link href="/profile/edit" className={styles.editProfileButton}>
                  Edit Profile
                </Link>
                
                <Link href="/profile/api-keys" className={styles.editProfileButton} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                  </svg>
                  API Keys
                </Link>
                
                <Link href="/settings" className={styles.editProfileButton}>
                  <FaCog className={styles.buttonIcon} />
                  Settings
                </Link>
                
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Log Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 