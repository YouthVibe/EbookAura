'use client';

import { getAPI, postAPI, putAPI, deleteAPI } from '../../api/apiUtils';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaFileUpload, 
  FaImage, 
  FaTimes, 
  FaPlus, 
  FaBook, 
  FaUser, 
  FaInfoCircle, 
  FaHashtag, 
  FaLayerGroup, 
  FaBookOpen,
  FaCheck
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import styles from '../profile.module.css';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/config';
import ProgressBar from '../../components/ProgressBar';
import Alert from '../../components/Alert';

// Comprehensive list of book categories
const PREDEFINED_CATEGORIES = [
  // Fiction Categories
  'Contemporary Fiction', 'Literary Fiction', 'Historical Fiction', 'Science Fiction',
  'Fantasy', 'Mystery', 'Thriller', 'Horror', 'Romance', 'Western',
  'Crime Fiction', 'Adventure', 'Military Fiction', 'Urban Fiction', 'Short Stories',
  'Young Adult Fiction', 'Children\'s Fiction', 'Classic Literature', 'Mythology',
  'Folk Tales',

  // Non-Fiction Categories
  'Biography', 'Autobiography', 'Memoir', 'History', 'Military History',
  'World History', 'Ancient History', 'Modern History', 'Philosophy', 'Psychology',
  'Self-Help', 'Personal Development', 'Business', 'Economics', 'Finance',
  'Management', 'Leadership', 'Marketing', 'Entrepreneurship', 'Career Development',

  // Science & Technology
  'Science', 'Popular Science', 'Physics', 'Chemistry', 'Biology',
  'Mathematics', 'Computer Science', 'Programming', 'Artificial Intelligence',
  'Technology', 'Engineering', 'Environmental Science', 'Astronomy', 'Medicine',
  'Healthcare', 'Neuroscience', 'Data Science', 'Robotics', 'Biotechnology',
  'Information Technology',

  // Arts & Humanities
  'Art', 'Art History', 'Photography', 'Music', 'Film Studies',
  'Theater', 'Dance', 'Architecture', 'Design', 'Fashion',
  'Creative Arts', 'Literary Criticism', 'Poetry', 'Drama', 'Essays',
  'Journalism', 'Language', 'Linguistics', 'Cultural Studies', 'Religious Studies',

  // Social Sciences
  'Sociology', 'Anthropology', 'Political Science', 'International Relations',
  'Law', 'Criminal Justice', 'Education', 'Teaching', 'Social Work',
  'Gender Studies', 'Environmental Studies', 'Urban Studies', 'Geography',
  'Archaeology', 'Communication Studies', 'Media Studies', 'Public Policy',
  'Human Rights', 'Social Justice', 'Ethics',

  // Lifestyle & Hobbies
  'Cooking', 'Food & Wine', 'Health & Fitness', 'Sports', 'Travel',
  'Gardening', 'Home Improvement', 'Crafts', 'Games', 'Pets',
  'Parenting', 'Relationships', 'Lifestyle', 'Self-Care', 'Mindfulness',
  'Meditation', 'Yoga', 'Alternative Medicine', 'Nutrition', 'Wellness'
].sort();

// Predefined tags list (you can expand this list)
const PREDEFINED_TAGS = [
  'Adventure', 'Romance', 'Mystery', 'Thriller', 'Fantasy', 'Science Fiction',
  'Horror', 'Historical', 'Contemporary', 'Literary Fiction', 'Young Adult',
  'Children', 'Biography', 'Autobiography', 'Memoir', 'Self-Help',
  'Business', 'Finance', 'Psychology', 'Philosophy', 'Religion',
  'Science', 'Technology', 'Computer Science', 'Programming', 'Mathematics',
  'Physics', 'Chemistry', 'Biology', 'Medicine', 'Health',
  'Fitness', 'Cooking', 'Food', 'Travel', 'Photography',
  'Art', 'Music', 'Film', 'Theater', 'Poetry',
  'Education', 'Reference', 'Language', 'Politics', 'Social Science',
  'Economics', 'Law', 'Environment', 'Nature', 'Sports'
].sort();

export default function UploadPdf() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('No PDF selected');
  const [coverFileName, setCoverFileName] = useState('No cover image selected');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [pageSize, setPageSize] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Updated character counters
  const [titleChars, setTitleChars] = useState(0);
  const [authorChars, setAuthorChars] = useState(0);
  const [descChars, setDescChars] = useState(0);

  // New state variables for tag management
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const tagContainerRef = useRef(null);

  // New state variables for category management
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const categoryContainerRef = useRef(null);

  // New state variables for upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('Preparing upload...');
  
  // New state variables for notifications
  const [notification, setNotification] = useState({
    show: false,
    type: 'info',
    message: ''
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch profile data
    fetchProfileData();
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
      
      // Redirect if not an admin
      if (!data.isAdmin) {
        router.push('/profile');
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err.message || 'An error occurred while fetching your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorChange = (e) => {
    const value = e.target.value;
    setAuthor(value);
    setAuthorChars(value.length);
    
    if (value.length > 100) {
      setError('Author name must be under 100 characters');
    } else {
      setError('');
    }
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setDescChars(value.length);
    
    if (value.length > 1000) {
      setError('Description must be under 1000 characters');
    } else {
      setError('');
    }
  };

  // Enhance the checkImageDimensions function to validate 500x700px dimensions
  const checkImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        // Get image dimensions
        const width = img.width;
        const height = img.height;
        
        // Check if dimensions match 500x700 pixels
        if (width === 500 && height === 700) {
          resolve({ 
            valid: true, 
            width, 
            height,
            message: `Image dimensions are correct: ${width}x${height} pixels`
          });
        } else {
          resolve({ 
            valid: false, 
            width, 
            height,
            message: `Image must be exactly 500x700 pixels, but got ${width}x${height} pixels`
          });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load the image. Please try another file.'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePdfChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        setPdfFile(null);
        setPdfFileName('No PDF selected');
        return;
      }

      // Update size limit to 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('PDF file size should be less than 10MB');
        setPdfFile(null);
        setPdfFileName('No PDF selected');
        return;
      }

      setPdfFile(selectedFile);
      setPdfFileName(selectedFile.name);
      setError('');
    }
  };

  const handleCoverChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file for the cover');
        setCoverFile(null);
        setCoverFileName('No cover image selected');
        return;
      }

      // Update size limit to 1MB
      if (selectedFile.size > 1 * 1024 * 1024) {
        setError('Cover image size should be less than 1MB');
        setCoverFile(null);
        setCoverFileName('No cover image selected');
        return;
      }

      try {
        // Check image dimensions (500x700px)
        const dimensionCheck = await checkImageDimensions(selectedFile);
        
        if (dimensionCheck.valid) {
          setCoverFile(selectedFile);
          setCoverFileName(`${selectedFile.name} (${dimensionCheck.width}x${dimensionCheck.height}px)`);
          setError('');
        } else {
          setError(dimensionCheck.message);
          setCoverFile(null);
          setCoverFileName('No cover image selected');
        }
      } catch (err) {
        setError(err.message);
        setCoverFile(null);
        setCoverFileName('No cover image selected');
      }
    }
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    setTitleChars(value.length);
    
    if (value.length > 100) {
      setError('Title must be under 100 characters');
    } else {
      setError('');
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (title.length > 100) {
      setError('Title must be under 100 characters');
      return false;
    }
    
    if (!author.trim()) {
      setError('Author is required');
      return false;
    }
    
    if (author.length > 100) {
      setError('Author name must be under 100 characters');
      return false;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (description.length > 1000) {
      setError('Description must be under 1000 characters');
      return false;
    }
    
    if (!pageSize || isNaN(pageSize) || pageSize <= 0) {
      setError('Please enter a valid number of pages');
      return false;
    }
    
    if (!category) {
      setError('Please select a category');
      return false;
    }
    
    // Check min 1 tag requirement
    if (selectedTags.length < 1) {
      setError('Please add at least 1 tag');
      return false;
    }
    
    // Check max 10 tags limit
    if (selectedTags.length > 10) {
      setError('Maximum 10 tags allowed');
      return false;
    }
    
    // Both files are required by the backend
    if (!pdfFile) {
      setError('Please select a PDF file to upload');
      return false;
    }
    
    // Update size limit to 10MB
    if (pdfFile.size > 10 * 1024 * 1024) {
      setError('PDF file size should be less than 10MB');
      return false;
    }
    
    if (!coverFile) {
      setError('Please select a cover image');
      return false;
    }
    
    // Update size limit to 1MB
    if (coverFile.size > 1 * 1024 * 1024) {
      setError('Cover image size should be less than 1MB');
      return false;
    }
    
    return true;
  };

  // Filter tags based on input
  useEffect(() => {
    if (tagInput) {
      const filtered = PREDEFINED_TAGS.filter(tag => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !selectedTags.includes(tag)
      );
      setFilteredTags(filtered);
      setShowTagSuggestions(true);
    } else {
      setShowTagSuggestions(false);
    }
  }, [tagInput, selectedTags]);

  // Close tag suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (tagContainerRef.current && !tagContainerRef.current.contains(event.target)) {
        setShowTagSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagSelect = (tag) => {
    // Check max 10 tags limit
    if (selectedTags.length >= 10) {
      setError('Maximum 10 tags allowed');
      return;
    }
    
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleAddCustomTag = () => {
    const customTag = tagInput.trim();
    // Check max 10 tags limit
    if (selectedTags.length >= 10) {
      setError('Maximum 10 tags allowed');
      return;
    }
    
    if (customTag && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags.length > 0) {
        handleTagSelect(filteredTags[0]);
      } else if (tagInput.trim()) {
        handleAddCustomTag();
      }
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Filter categories based on input
  useEffect(() => {
    if (categoryInput) {
      const filtered = PREDEFINED_CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(categoryInput.toLowerCase()) &&
        cat !== category
      );
      setFilteredCategories(filtered);
      setShowCategorySuggestions(true);
    } else {
      setShowCategorySuggestions(false);
    }
  }, [categoryInput, category]);

  // Close category suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target)) {
        setShowCategorySuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setCategoryInput('');
    setShowCategorySuggestions(false);
  };

  const handleAddCustomCategory = () => {
    const customCategory = categoryInput.trim();
    if (customCategory) {
      setCategory(customCategory);
      setCategoryInput('');
      setShowCategorySuggestions(false);
    }
  };

  const handleCategoryInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCategories.length > 0) {
        handleCategorySelect(filteredCategories[0]);
      } else if (categoryInput.trim()) {
        handleAddCustomCategory();
      }
    }
  };

  // Add function to handle notifications
  const showNotification = (message, type = 'info') => {
    setNotification({
      show: true,
      type,
      message
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      show: false
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to top to show error
      window.scrollTo(0, 0);
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing files...');
    setError('');
    setSuccess('');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Create form data for multipart form upload
      const formData = new FormData();
      
      // Update status for PDF
      setUploadStatus('Uploading PDF file...');
      setUploadProgress(10);
      
      // Ensure files are properly appended with the exact field names expected by the backend
      if (pdfFile) formData.append('pdf', pdfFile);
      
      // Progress increment for PDF (40% of total)
      setTimeout(() => {
        setUploadProgress(30);
        setUploadStatus('Processing PDF file...');
      }, 800);
      
      setTimeout(() => {
        setUploadProgress(50);
        setUploadStatus('Uploading cover image...');
      }, 1500);
      
      // Add cover image if available
      if (coverFile) formData.append('coverImage', coverFile);
      
      // Append all other required fields
      formData.append('title', title.trim());
      formData.append('author', author.trim());
      formData.append('description', description.trim());
      
      if (pageSize) {
        formData.append('pageSize', pageSize);
      }
      
      if (category) {
        formData.append('category', category);
      }
      
      // Join tags with comma
      if (selectedTags.length > 0) {
        formData.append('tags', selectedTags.join(','));
      } else {
        formData.append('tags', ''); // Send empty string if no tags
      }
      
      setTimeout(() => {
        setUploadProgress(70);
        setUploadStatus('Finalizing upload...');
      }, 2000);
      
      // Use direct fetch with FormData instead of postAPI for better progress tracking
      const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to upload e-book';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || `Upload failed: ${response.status}`;
        } else {
          errorMessage = `Upload failed: ${response.statusText || response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Upload completed
      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      
      // Show success notification
      showNotification('E-book successfully uploaded!', 'success');
      
      // Reset form
      setPdfFile(null);
      setCoverFile(null);
      setPdfFileName('No PDF selected');
      setCoverFileName('No cover image selected');
      setTitle('');
      setAuthor('');
      setDescription('');
      setPageSize('');
      setCategory('');
      setCategoryInput('');
      setSelectedTags([]);
      setTagInput('');
      setTitleChars(0);
      setAuthorChars(0);
      setDescChars(0);
      
      // Set success message
      setSuccess('E-book successfully uploaded!');
      
      // Simulate a delay before resetting the upload progress
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 2000);
      
    } catch (err) {
      console.error('Error uploading e-book:', err);
      
      // Set upload progress to error state
      setUploadProgress(100);
      setUploadStatus('Upload failed');
      setIsUploading(false);
      
      let errorMessage = err.message || 'An error occurred while uploading the e-book';
      
      // Provide more helpful message for specific error types
      if (err.name === 'AbortError') {
        errorMessage = 'Upload timed out. Please try a smaller file or check your internet connection.';
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        errorMessage = 'Upload timed out. Please try a smaller file or check your internet connection.';
      } else if (errorMessage.includes('Invalid image') || errorMessage.includes('format')) {
        errorMessage = 'There was an issue with the file format. Please ensure your PDF and image are valid.';
      }
      
      // Show error notification
      showNotification(errorMessage, 'error');
      
      // Set error message
      setError(errorMessage);
    }
  };

  // Helper function to get character count className based on current length and max length
  const getCharCountClassName = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) {
      return `${styles.charCount} ${styles.charCountError}`;
    } else if (percentage >= 80) {
      return `${styles.charCount} ${styles.charCountWarning}`;
    }
    return styles.charCount;
  };

  // Helper function to get file input container className based on validation state
  const getFileContainerClassName = (file, isValid) => {
    if (!file) return styles.fileInputContainer;
    if (isValid === false) return `${styles.fileInputContainer} ${styles.error}`;
    if (isValid === true) return `${styles.fileInputContainer} ${styles.success}`;
    return styles.fileInputContainer;
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ marginTop: '20px' }}>
        <div className={styles.profileContainer}>
          <div className={styles.loading}>
            <div className={styles.loadingAnimation}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (user && !user.isAdmin && profileData && !profileData.isAdmin)) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className={styles.container} style={{ marginTop: '20px' }}>
      <div className={styles.profileContainer}>
        <div className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            <FaArrowLeft className={styles.backIcon} />
            Back to Profile
          </Link>
          <h1 className={styles.headerTitle} style={{ marginTop: '40px' }}>
            <FaBookOpen style={{ marginRight: '12px', display: 'inline' }} />
            Upload Book
          </h1>
          <p className={styles.headerSubtitle} style={{ marginTop: '10px' }}>
            Fill out the form below to add a new book to the library
          </p>
        </div>

        {/* Notification Alert */}
        {notification.show && (
          <Alert
            type={notification.type}
            message={notification.message}
            show={notification.show}
            onClose={hideNotification}
            autoCloseTime={5000} // Auto close after 5 seconds
            className={styles.notificationAlert}
          />
        )}

        {error && !notification.show && (
          <div className={styles.errorMessage}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FaInfoCircle style={{ marginRight: '10px' }} />
              {error}
            </span>
            <button 
              onClick={() => setError('')} 
              className={styles.closeErrorButton}
              aria-label="Close error message"
            >
              <FaTimes />
            </button>
          </div>
        )}
        
        {success && !notification.show && (
          <div className={styles.successMessage}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FaCheck style={{ marginRight: '10px' }} />
              {success}
            </span>
            <button 
              onClick={() => setSuccess('')} 
              className={styles.closeSuccessButton}
              aria-label="Close success message"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <ProgressBar
            progress={uploadProgress}
            status={uploadStatus}
            showPercentage={true}
            className={uploadProgress === 100 ? styles.completed : ''}
          />
        )}

        <form onSubmit={handleUpload} className={styles.uploadForm}>
          <div className={styles.formGroup}>
            <label htmlFor="title">
              <FaBook style={{ marginRight: '8px' }} />
              Title <span className={getCharCountClassName(titleChars, 100)}>{titleChars}/100</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={handleTitleChange}
              maxLength={100}
              placeholder="Enter book title"
              className={styles.textInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="author">
              <FaUser style={{ marginRight: '8px' }} />
              Author <span className={getCharCountClassName(authorChars, 100)}>{authorChars}/100</span>
            </label>
            <input
              type="text"
              id="author"
              value={author}
              onChange={handleAuthorChange}
              maxLength={100}
              placeholder="Enter author name"
              className={styles.textInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">
              <FaInfoCircle style={{ marginRight: '8px' }} />
              Description <span className={getCharCountClassName(descChars, 1000)}>{descChars}/1000</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              maxLength={1000}
              placeholder="Enter a description (up to 1000 characters)"
              className={styles.textArea}
              rows={5}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="pageSize">
                <FaLayerGroup style={{ marginRight: '8px' }} />
                Number of Pages
              </label>
              <input
                type="number"
                id="pageSize"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                min="1"
                placeholder="Enter page count"
                className={styles.numberInput}
              />
            </div>

            <div className={styles.formGroup} ref={categoryContainerRef}>
              <label htmlFor="category">
                <FaBookOpen style={{ marginRight: '8px' }} />
                Category
              </label>
              <div className={styles.categoryInputContainer}>
                {category && (
                  <div className={styles.selectedCategory}>
                    <span>{category}</span>
                    <button
                      type="button"
                      onClick={() => setCategory('')}
                      className={styles.removeCategory}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                {!category && (
                  <div className={styles.categoryInputWrapper}>
                    <input
                      type="text"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyDown={handleCategoryInputKeyDown}
                      placeholder="Search or add category..."
                      className={styles.categoryInput}
                    />
                    {categoryInput && (
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className={styles.addCategoryButton}
                      >
                        <FaPlus />
                      </button>
                    )}
                  </div>
                )}
                {showCategorySuggestions && filteredCategories.length > 0 && (
                  <div className={styles.categorySuggestions}>
                    {filteredCategories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={styles.categorySuggestion}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formGroup} ref={tagContainerRef}>
            <label htmlFor="tags">
              <FaHashtag style={{ marginRight: '8px' }} />
              Tags <span className={styles.tagLimitInfo}>(min 1, max 10)</span>
              <span className={selectedTags.length > 9 ? `${styles.tagCount} ${styles.charCountError}` : styles.tagCount}>
                {selectedTags.length}/10
              </span>
            </label>
            <div className={styles.tagInputContainer}>
              <div className={styles.selectedTags}>
                {selectedTags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={styles.removeTag}
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
              <div className={styles.tagInputWrapper}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Search or add tags..."
                  className={styles.tagInput}
                />
                {tagInput && (
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className={styles.addTagButton}
                  >
                    <FaPlus />
                  </button>
                )}
              </div>
              {showTagSuggestions && filteredTags.length > 0 && (
                <div className={styles.tagSuggestions}>
                  {filteredTags.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className={styles.tagSuggestion}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={getFileContainerClassName(pdfFile, pdfFile && pdfFile.size <= 10 * 1024 * 1024)}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              id="pdf-upload"
              className={styles.fileInput}
            />
            <label htmlFor="pdf-upload" className={styles.fileInputLabel}>
              <FaFileUpload className={styles.uploadIcon} />
              Choose PDF (max 10MB)
            </label>
            <span className={styles.fileName}>{pdfFileName}</span>
            {pdfFile && pdfFile.size > 0 && (
              <span className={styles.fileSize}>
                {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </div>

          <div className={getFileContainerClassName(coverFile, coverFile && coverFile.size <= 1 * 1024 * 1024)}>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              id="cover-upload"
              className={styles.fileInput}
            />
            <label htmlFor="cover-upload" className={styles.fileInputLabel}>
              <FaImage className={styles.uploadIcon} />
              Choose Cover Image (500x700px, max 1MB)
            </label>
            <span className={styles.fileName}>{coverFileName}</span>
            {coverFile && coverFile.size > 0 && (
              <span className={styles.fileSize}>
                {(coverFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
            <span className={styles.fileRequirements}>Cover image must be exactly 500x700 pixels and less than 1MB</span>
          </div>

          <button
            type="submit"
            className={styles.uploadButton}
            disabled={isUploading || !pdfFile}
          >
            {isUploading ? (
              <>
                <div className={styles.spinner}></div>
                Uploading...
              </>
            ) : (
              <>
                <FaFileUpload className={styles.uploadIcon} />
                Upload E-Book
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 