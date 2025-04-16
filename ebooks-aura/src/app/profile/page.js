'use client';

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

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile data');
      }

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
                    <p className={styles.infoValue}>{profileData.fullName}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Email</p>
                    <p className={styles.infoValue}>{profileData.email}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Account Created</p>
                    <p className={styles.infoValue}>{new Date(profileData.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <p className={styles.infoLabel}>Email Verified</p>
                    <p className={styles.infoValue}>{profileData.isEmailVerified ? 'Yes' : 'No'}</p>
                  </div>
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
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Log Out
                </button>
                <Link href="/profile/edit" className={styles.editProfileButton}>
                  Edit Profile
                </Link>
                <Link href="/settings" className={styles.editProfileButton}>
                  <FaCog className={styles.buttonIcon} />
                  Settings
                </Link>
                {(user && user.isAdmin) || (profileData && profileData.isAdmin) ? (
                  <Link href="/profile/upload-pdf" className={styles.editProfileButton}>
                    Upload PDF
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 