'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaUpload } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import styles from './upload-image.module.css';

export default function UploadProfileImage() {
  const { user, login, getToken } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should not exceed 2MB');
      return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should not exceed 2MB');
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }
    
    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch('http://localhost:5000/api/users/profile/image', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }
      
      // Update user context with new profile image
      login({
        ...user,
        profileImage: data.profileImage,
      });
      
      setSuccess('Profile image updated successfully!');
      
      // Redirect to profile page after short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setError(err.message || 'An error occurred while uploading your image');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // If user is not logged in, redirect to login
  if (!user) {
    typeof window !== 'undefined' && router.push('/login');
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.uploadContainer}>
        <div className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            <FaArrowLeft className={styles.backIcon} />
            Back to Profile
          </Link>
          <h1 className={styles.headerTitle}>Update Profile Picture</h1>
          <p className={styles.headerSubtitle}>Upload a new profile image</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <div className={styles.uploadContent}>
          <div 
            className={styles.dropArea}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            {previewUrl ? (
              <div className={styles.previewContainer}>
                <Image 
                  src={previewUrl} 
                  alt="Preview" 
                  width={200} 
                  height={200}
                  className={styles.imagePreview} 
                />
              </div>
            ) : (
              <>
                <FaUpload className={styles.uploadIcon} />
                <p className={styles.dropText}>Drag & drop your image here or click to browse</p>
                <p className={styles.fileTypeText}>Supported formats: JPG, PNG, GIF (Max: 2MB)</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className={styles.fileInput}
            />
          </div>

          <div className={styles.buttonContainer}>
            <Link href="/profile" className={styles.cancelButton}>
              Cancel
            </Link>
            <button
              onClick={handleUpload}
              className={styles.uploadButton}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 