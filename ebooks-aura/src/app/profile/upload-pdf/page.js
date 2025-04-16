'use client';

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
  
  // Character counters
  const [titleChars, setTitleChars] = useState(0);
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

  const handlePdfChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        setPdfFile(null);
        setPdfFileName('No PDF selected');
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('PDF file size should be less than 20MB');
        setPdfFile(null);
        setPdfFileName('No PDF selected');
        return;
      }

      setPdfFile(selectedFile);
      setPdfFileName(selectedFile.name);
      setError('');
    }
  };

  const handleCoverChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file for the cover');
        setCoverFile(null);
        setCoverFileName('No cover image selected');
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Cover image size should be less than 5MB');
        setCoverFile(null);
        setCoverFileName('No cover image selected');
        return;
      }

      setCoverFile(selectedFile);
      setCoverFileName(selectedFile.name);
      setError('');
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

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setDescChars(value.length);
    
    if (value.length > 200) {
      setError('Description must be under 200 characters');
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
    
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (description.length > 200) {
      setError('Description must be under 200 characters');
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
    
    if (!pdfFile) {
      setError('Please select a PDF file to upload');
      return false;
    }
    
    if (pdfFile.size > 20 * 1024 * 1024) {
      setError('PDF file size should be less than 20MB');
      return false;
    }
    
    if (!coverFile) {
      setError('Please select a cover image');
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
      setFilteredTags([]);
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
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleAddCustomTag = () => {
    const customTag = tagInput.trim();
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
      setFilteredCategories([]);
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

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
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

      // Check file size again before upload
      if (pdfFile.size > 20 * 1024 * 1024) {
        throw new Error('PDF file size should be less than 20MB for reliable uploads');
      }

      setSuccess('Uploading your book... This may take a few minutes for larger files.');
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('coverImage', coverFile);
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);
      formData.append('pageSize', pageSize);
      formData.append('category', category);
      if (selectedTags.length > 0) {
        formData.append('tags', selectedTags.join(','));
      }

      // Set up a timeout handler
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minute timeout

      const response = await fetch('http://localhost:5000/api/upload/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        if (data.error && (data.error.includes('Invalid') || data.error.includes('format'))) {
          throw new Error('There was an issue with the file format. Please ensure your PDF is valid.');
        } else {
          throw new Error(data.message || 'Failed to upload book');
        }
      }

      setSuccess('Book uploaded successfully!');
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
      setDescChars(0);
    } catch (err) {
      console.error('Error uploading book:', err);
      
      let errorMessage = err.message || 'An error occurred while uploading the book';
      
      // Provide more helpful message for specific error types
      if (err.name === 'AbortError') {
        errorMessage = 'Upload timed out. Please try a smaller file or check your internet connection.';
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        errorMessage = 'Upload timed out. Please try a smaller file or check your internet connection.';
      } else if (errorMessage.includes('Invalid image') || errorMessage.includes('format')) {
        errorMessage = 'There was an issue with the file format. Please ensure your PDF is valid and try again.';
      }
      
      setError(errorMessage);
      setSuccess('');
    } finally {
      setUploading(false);
    }
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

        {error && (
          <div className={styles.errorMessage}>
            <FaInfoCircle style={{ marginRight: '10px' }} />
            {error}
          </div>
        )}
        
        {success && (
          <div className={styles.successMessage}>
            <FaCheck style={{ marginRight: '10px' }} />
            {success}
          </div>
        )}

        <form onSubmit={handleUpload} className={styles.uploadForm}>
          <div className={styles.formGroup}>
            <label htmlFor="title">
              <FaBook style={{ marginRight: '8px' }} />
              Title <span className={styles.charCount}>{titleChars}/100</span>
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
              Author
            </label>
            <input
              type="text"
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className={styles.textInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">
              <FaInfoCircle style={{ marginRight: '8px' }} />
              Description <span className={styles.charCount}>{descChars}/200</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              maxLength={200}
              placeholder="Enter a brief description"
              className={styles.textArea}
              rows={3}
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
              Tags
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

          <div className={styles.fileInputContainer}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              id="pdf-upload"
              className={styles.fileInput}
            />
            <label htmlFor="pdf-upload" className={styles.fileInputLabel}>
              <FaFileUpload className={styles.uploadIcon} />
              Choose PDF
            </label>
            <span className={styles.fileName}>{pdfFileName}</span>
          </div>

          <div className={styles.fileInputContainer}>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              id="cover-upload"
              className={styles.fileInput}
            />
            <label htmlFor="cover-upload" className={styles.fileInputLabel}>
              <FaImage className={styles.uploadIcon} />
              Choose Cover Image
            </label>
            <span className={styles.fileName}>{coverFileName}</span>
          </div>

          <button
            type="submit"
            className={styles.uploadButton}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className={styles.spinner}></div>
                <span>Uploading... Please wait</span>
              </>
            ) : (
              <>
                <FaFileUpload className={styles.buttonIcon} />
                Upload Book
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 