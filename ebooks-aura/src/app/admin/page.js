/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaBook, FaTrash, FaBan, FaUnlock, FaEye, FaDownload, FaStar, FaCalendarAlt, FaFilter, FaSearch, FaPlusCircle, FaBookOpen, FaEdit, FaCloudUploadAlt, FaBroom, FaPlus, FaTimes, FaFileUpload, FaImage, FaFile } from 'react-icons/fa';
import { getAllUsers, toggleUserBan, deleteUser, getAllBooks, deleteBook, updateBook, cleanupCloudinaryResources } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import styles from './admin.module.css';
import Link from 'next/link';
import SearchInput from '../components/SearchInput';
import { FiTrash2, FiX, FiCheckCircle, FiUserX, FiUserCheck, FiCloudRain } from 'react-icons/fi';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalButtons}>
          <button 
            onClick={onCancel}
            className={`${styles.cancelButton} ${isDeleting ? styles.disabledButton : ''}`}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`${styles.confirmButton} ${isDeleting ? styles.disabledButton : ''}`}
            disabled={isDeleting}
          >
            {isDeleting ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Book Modal Component
const EditBookModal = ({ isOpen, book, onSave, onCancel, isSaving }) => {
  const [editedBook, setEditedBook] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    tags: [],
    pageSize: 0,
    isPremium: false,
    price: 0
  });
  const [newPdfFile, setNewPdfFile] = useState(null);
  const [newCoverFile, setNewCoverFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('No new PDF selected');
  const [coverFileName, setCoverFileName] = useState('No new cover image selected');
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  
  // Additional states for enhanced functionality
  const [isPdfUrl, setIsPdfUrl] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [titleChars, setTitleChars] = useState(0);
  const [authorChars, setAuthorChars] = useState(0);
  const [descChars, setDescChars] = useState(0);
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const categoryContainerRef = useRef(null);
  const tagContainerRef = useRef(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  
  // Predefined categories and tags
  const PREDEFINED_CATEGORIES = [
    'Contemporary Fiction', 'Literary Fiction', 'Historical Fiction', 'Science Fiction',
    'Fantasy', 'Mystery', 'Thriller', 'Horror', 'Romance', 'Western',
    'Crime Fiction', 'Adventure', 'Military Fiction', 'Urban Fiction', 'Short Stories',
    'Young Adult Fiction', 'Children\'s Fiction', 'Classic Literature', 'Mythology',
    'Folk Tales', 'Biography', 'Autobiography', 'Memoir', 'History', 'Philosophy',
    'Psychology', 'Self-Help', 'Business', 'Economics', 'Science',
    'Technology', 'Computer Science', 'Programming', 'Art', 'Music',
    'Sports', 'Travel', 'Cooking', 'Health', 'Religion'
  ].sort();

  const PREDEFINED_TAGS = [
    'Adventure', 'Romance', 'Mystery', 'Thriller', 'Fantasy', 'Science Fiction',
    'Horror', 'Historical', 'Contemporary', 'Literary Fiction', 'Young Adult',
    'Children', 'Biography', 'Self-Help', 'Business', 'Psychology',
    'Science', 'Technology', 'Programming', 'Health', 'Education',
    'Politics', 'Sports', 'Art', 'Music'
  ].sort();
  
  // Initialize form with book data when modal opens
  useEffect(() => {
    if (book && isOpen) {
      setEditedBook({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        category: book.category || '',
        tags: book.tags || [],
        pageSize: book.pageSize || 0,
        isPremium: book.isPremium || false,
        price: book.price || 0,
        fileSizeMB: book.fileSizeMB || 0
      });
      setPdfFileName('No new PDF selected');
      setCoverFileName('No new cover image selected');
      setNewPdfFile(null);
      setNewCoverFile(null);
      setError('');
      setPdfUrl(book.isCustomUrl ? book.pdfUrl : '');
      setIsPdfUrl(book.isCustomUrl || false);
      setTitleChars(book.title ? book.title.length : 0);
      setAuthorChars(book.author ? book.author.length : 0);
      setDescChars(book.description ? book.description.length : 0);
      setCategoryInput(book.category || '');
    }
  }, [book, isOpen]);
  
  useEffect(() => {
    // Filter categories based on input
    if (categoryInput) {
      const filtered = PREDEFINED_CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(categoryInput.toLowerCase())
      ).slice(0, 5);
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(PREDEFINED_CATEGORIES.slice(0, 5));
    }
  }, [categoryInput]);

  useEffect(() => {
    // Filter tags based on input
    if (tagInput) {
      const filtered = PREDEFINED_TAGS.filter(tag => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) && 
        !editedBook.tags.includes(tag)
      ).slice(0, 5);
      setFilteredTags(filtered);
    } else {
      setFilteredTags(PREDEFINED_TAGS.filter(tag => !editedBook.tags.includes(tag)).slice(0, 5));
    }
  }, [tagInput, editedBook.tags]);
  
  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target)) {
        setShowCategorySuggestions(false);
      }
      if (tagContainerRef.current && !tagContainerRef.current.contains(event.target)) {
        setShowTagSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  if (!isOpen) return null;
  
  const handlePdfChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        setNewPdfFile(null);
        setPdfFileName('No new PDF selected');
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('PDF file size should be less than 20MB');
        setNewPdfFile(null);
        setPdfFileName('No new PDF selected');
        return;
      }

      setNewPdfFile(selectedFile);
      setPdfFileName(selectedFile.name);
      setError('');
    }
  };

  const togglePdfInputMethod = (useUrl) => {
    setIsPdfUrl(useUrl);
    if (useUrl) {
      setNewPdfFile(null);
      setPdfFileName('No new PDF selected');
    } else {
      setPdfUrl('');
    }
  };

  const handlePdfUrlChange = (e) => {
    const url = e.target.value;
    setPdfUrl(url);
    
    // Basic URL validation
    if (url && !url.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://');
    } else {
      setError('');
    }
  };

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

  const handleCoverChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file for the cover');
        setNewCoverFile(null);
        setCoverFileName('No new cover image selected');
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Cover image size should be less than 5MB');
        setNewCoverFile(null);
        setCoverFileName('No new cover image selected');
        return;
      }
      
      try {
        // Check image dimensions
        const dimensionCheck = await checkImageDimensions(selectedFile);
        
        if (!dimensionCheck.valid) {
          setError(dimensionCheck.message);
          setNewCoverFile(null);
          setCoverFileName('No new cover image selected');
          return;
        }
        
        setNewCoverFile(selectedFile);
        setCoverFileName(selectedFile.name);
        setError('');
      } catch (err) {
        setError(err.message);
        setNewCoverFile(null);
        setCoverFileName('No new cover image selected');
      }
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'title') {
      setTitleChars(value.length);
      if (value.length > 100) {
        setError('Title must be under 100 characters');
      } else {
        setError('');
      }
    }

    if (name === 'author') {
      setAuthorChars(value.length);
      if (value.length > 100) {
        setError('Author name must be under 100 characters');
      } else {
        setError('');
      }
    }

    if (name === 'description') {
      setDescChars(value.length);
      if (value.length > 1000) {
        setError('Description must be under 1000 characters');
      } else {
        setError('');
      }
    }
    
    setEditedBook(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
    setShowTagSuggestions(true);
  };
  
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };
  
  const addTag = (tag) => {
    const newTag = tag.trim();
    
    if (newTag && !editedBook.tags.includes(newTag)) {
      setEditedBook(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setTagInput('');
    }
  };
  
  const handleTagSelect = (tag) => {
    addTag(tag);
    setShowTagSuggestions(false);
  };
  
  const removeTag = (tagToRemove) => {
    setEditedBook(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleCategoryInputChange = (e) => {
    setCategoryInput(e.target.value);
    setEditedBook(prev => ({
      ...prev,
      category: e.target.value
    }));
    setShowCategorySuggestions(true);
  };
  
  const handleCategorySelect = (selectedCategory) => {
    setCategoryInput(selectedCategory);
    setEditedBook(prev => ({
      ...prev,
      category: selectedCategory
    }));
    setShowCategorySuggestions(false);
  };
  
  const handleCategoryInputKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      setShowCategorySuggestions(false);
    }
  };
  
  const getCharCountClassName = (current, max) => {
    if (current > max) return styles.charCountExceeded;
    if (current > max * 0.8) return styles.charCountWarning;
    return styles.charCount;
  };
  
  const validateForm = () => {
    if (!editedBook.title.trim()) {
      setError('Please enter a book title');
      return false;
    }
    
    if (editedBook.title.length > 100) {
      setError('Title must be under 100 characters');
      return false;
    }
    
    if (!editedBook.author.trim()) {
      setError('Please enter the author name');
      return false;
    }
    
    if (editedBook.author.length > 100) {
      setError('Author name must be under 100 characters');
      return false;
    }
    
    if (!editedBook.description.trim()) {
      setError('Please provide a book description');
      return false;
    }
    
    if (editedBook.description.length > 1000) {
      setError('Description must be under 1000 characters');
      return false;
    }
    
    if (!editedBook.category.trim()) {
      setError('Please select or enter a category');
      return false;
    }
    
    if (editedBook.tags.length === 0) {
      setError('Please add at least one tag');
      return false;
    }
    
    if (isPdfUrl && !pdfUrl.trim()) {
      setError('Please enter a PDF URL');
      return false;
    }
    
    if (isPdfUrl && !pdfUrl.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return false;
    }
    
    if (editedBook.isPremium && (!editedBook.price || editedBook.price <= 0)) {
      setError('Please enter a valid price for premium content');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!validateForm()) {
      return;
    }
    
    // Create FormData object
    const formData = new FormData();
    
    // Add book metadata
    Object.keys(editedBook).forEach(key => {
      if (key === 'tags') {
        formData.append(key, JSON.stringify(editedBook[key]));
      } else {
        formData.append(key, editedBook[key]);
      }
    });
    
    // Add files if selected
    if (newPdfFile) {
      formData.append('pdf', newPdfFile);
    }
    
    if (isPdfUrl && pdfUrl) {
      formData.append('isCustomUrl', 'true');
      formData.append('pdfUrl', pdfUrl.trim());
      formData.append('fileSizeMB', editedBook.fileSizeMB || 0);
    }
    
    if (newCoverFile) {
      formData.append('cover', newCoverFile);
    }
    
    // Call the save function with the form data
    setIsUploading(true);
    setUploadStatus('Processing your update...');
    onSave(book._id, formData);
  };
  
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.editBookModal}`}>
        <div className={styles.modalHeader}>
          <h2>Edit Book</h2>
          <button onClick={onCancel} className={`${styles.closeButton} ${isSaving ? styles.disabledButton : ''}`} disabled={isSaving}>
            <FiX />
          </button>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        {isUploading && (
          <div className={styles.uploadProgressContainer}>
            <p className={styles.uploadStatus}>{uploadStatus}</p>
            <div className={styles.progressBarWrapper}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.editBookForm}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="title">
                Title <span className={styles.requiredField}>*</span>
                <span className={getCharCountClassName(titleChars, 100)}>{titleChars}/100</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={editedBook.title}
                onChange={handleInputChange}
                maxLength={100}
                className={titleChars > 100 ? styles.inputError : ''}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="author">
                Author <span className={styles.requiredField}>*</span>
                <span className={getCharCountClassName(authorChars, 100)}>{authorChars}/100</span>
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={editedBook.author}
                onChange={handleInputChange}
                maxLength={100}
                className={authorChars > 100 ? styles.inputError : ''}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">
                Description <span className={styles.requiredField}>*</span>
                <span className={getCharCountClassName(descChars, 1000)}>{descChars}/1000</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={editedBook.description}
                onChange={handleInputChange}
                rows={5}
                maxLength={1000}
                className={descChars > 1000 ? styles.inputError : ''}
              />
            </div>
            
            <div className={styles.formGroup} ref={categoryContainerRef}>
              <label htmlFor="category">
                Category <span className={styles.requiredField}>*</span>
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={categoryInput}
                onChange={handleCategoryInputChange}
                onFocus={() => setShowCategorySuggestions(true)}
                onKeyDown={handleCategoryInputKeyDown}
                placeholder="Select or type a category"
              />
              {showCategorySuggestions && (
                <div className={styles.suggestionsList}>
                  {filteredCategories.map((cat, index) => (
                    <div 
                      key={index} 
                      className={styles.suggestionItem}
                      onClick={() => handleCategorySelect(cat)}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Tags</h3>
            
            <div className={styles.formGroup} ref={tagContainerRef}>
              <label htmlFor="tags">
                Tags <span className={styles.requiredField}>*</span>
                <span className={styles.helpText}>(At least one tag required)</span>
              </label>
              <div className={styles.tagInputContainer}>
                <input
                  type="text"
                  id="tagInput"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onFocus={() => setShowTagSuggestions(true)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Type and press Enter to add a tag"
                />
                <button 
                  type="button" 
                  onClick={() => addTag(tagInput)}
                  className={styles.addTagButton}
                  disabled={!tagInput.trim()}
                >
                  <FaPlus />
                </button>
              </div>
              
              {showTagSuggestions && (
                <div className={styles.suggestionsList}>
                  {filteredTags.map((tag, index) => (
                    <div 
                      key={index} 
                      className={styles.suggestionItem}
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
              
              <div className={styles.selectedTagsContainer}>
                {editedBook.tags.map((tag, index) => (
                  <div key={index} className={styles.tagPill}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className={styles.removeTagButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Files</h3>
            
            <div className={styles.fileSwitchContainer}>
              <button
                type="button"
                className={`${styles.fileSwitch} ${!isPdfUrl ? styles.activePdfSwitch : ''}`}
                onClick={() => togglePdfInputMethod(false)}
              >
                Upload PDF
              </button>
              <button
                type="button"
                className={`${styles.fileSwitch} ${isPdfUrl ? styles.activePdfSwitch : ''}`}
                onClick={() => togglePdfInputMethod(true)}
              >
                PDF URL
              </button>
            </div>
            
            {!isPdfUrl ? (
              <div className={styles.formGroup}>
                <label htmlFor="pdfFile">
                  PDF File <span className={styles.helpText}>(Optional - Max 20MB)</span>
                </label>
                <div className={styles.fileInputContainer}>
                  <input
                    type="file"
                    id="pdfFile"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    className={styles.fileInput}
                  />
                  <label htmlFor="pdfFile" className={styles.fileInputLabel}>
                    <FaFileUpload className={styles.fileIcon} />
                    Choose PDF
                  </label>
                  <div className={styles.fileName}>{pdfFileName}</div>
                </div>
                <div className={styles.helpText}>Current PDF: {book.pdfUrl ? 'Available' : 'Not available'}</div>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label htmlFor="pdfUrl">
                  PDF URL <span className={styles.helpText}>(Enter URL to an existing PDF)</span>
                </label>
                <input
                  type="url"
                  id="pdfUrl"
                  name="pdfUrl"
                  value={pdfUrl}
                  onChange={handlePdfUrlChange}
                  placeholder="https://example.com/your-book.pdf"
                />
                
                {/* File size input for URL PDF uploads */}
                {isPdfUrl && (
                  <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                    <label htmlFor="fileSizeMB">
                      File Size (MB) <span className={styles.helpText}>(Required for URL PDFs)</span>
                    </label>
                    <input
                      type="number"
                      id="fileSizeMB"
                      name="fileSizeMB"
                      value={editedBook.fileSizeMB || ''}
                      onChange={(e) => setEditedBook({...editedBook, fileSizeMB: parseFloat(e.target.value) || 0})}
                      placeholder="Enter file size in MB"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="coverFile">
                Cover Image <span className={styles.helpText}>(Optional - Must be 500x700px)</span>
              </label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  id="coverFile"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className={styles.fileInput}
                />
                <label htmlFor="coverFile" className={styles.fileInputLabel}>
                  <FaImage className={styles.fileIcon} />
                  Choose Cover
                </label>
                <div className={styles.fileName}>{coverFileName}</div>
              </div>
              <div className={styles.helpText}>Current Cover: {book.coverImage ? 'Available' : 'Not available'}</div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Additional Details</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="pageSize">
                Page Count <span className={styles.helpText}>(Optional)</span>
              </label>
              <input
                type="number"
                id="pageSize"
                name="pageSize"
                value={editedBook.pageSize}
                onChange={handleInputChange}
                min="0"
                placeholder="Number of pages"
              />
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="isPremium"
                  name="isPremium"
                  checked={editedBook.isPremium}
                  onChange={handleInputChange}
                />
                <label htmlFor="isPremium" className={styles.checkboxLabel}>
                  Premium Content
                </label>
              </div>
            </div>
            
            {editedBook.isPremium && (
              <div className={styles.formGroup}>
                <label htmlFor="price">
                  Price (Coins) <span className={styles.requiredField}>*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={editedBook.price}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Enter price in coins"
                />
              </div>
            )}
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onCancel}
              className={`${styles.cancelButton} ${isSaving ? styles.disabledButton : ''}`}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.saveButton} ${isSaving ? styles.disabledButton : ''}`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [isCleanupLoading, setIsCleanupLoading] = useState(false);
  const [cleanupResults, setCleanupResults] = useState(null);
  const [editBookModalOpen, setEditBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const router = useRouter();
  const { user, getToken, getApiKey } = useAuth();
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!user) {
      // Wait for auth to initialize
      return;
    }
    
    if (!user.isAdmin) {
      router.push('/');
    }
  }, [user, router]);
  
  // Fetch users or books based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (activeTab === 'users') {
          const userData = await getAllUsers();
          setUsers(userData);
        } else if (activeTab === 'books') {
          const bookData = await getAllBooks();
          setBooks(bookData);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Open confirmation modal
  const openModal = (type, id, title, message) => {
    setModal({ isOpen: true, type, id, title, message });
  };
  
  // Close confirmation modal
  const closeModal = () => {
    setModal({ isOpen: false, type: '', id: null, title: '', message: '' });
  };
  
  // Confirm action
  const confirmAction = async () => {
    try {
      setIsProcessing(true);
      
      switch (modal.type) {
        case 'ban-user':
          await toggleUserBan(modal.id);
          setUsers(users.map(user => 
            user._id === modal.id ? { ...user, isBanned: !user.isBanned } : user
          ));
          break;
          
        case 'delete-user':
          await deleteUser(modal.id);
          setUsers(users.filter(user => user._id !== modal.id));
          break;
          
        case 'delete-book':
          await deleteBook(modal.id);
          setBooks(books.filter(book => book._id !== modal.id));
          break;
          
        default:
          break;
      }
      
      closeModal();
    } catch (err) {
      console.error('Error processing action:', err);
      setError(`Action failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const searchTermLower = userSearch.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTermLower) || 
      user.email.toLowerCase().includes(searchTermLower)
    );
  });
  
  // Filter books based on search
  const filteredBooks = books.filter(book => {
    const searchTermLower = bookSearch.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchTermLower) || 
      book.author.toLowerCase().includes(searchTermLower) ||
      book.category.toLowerCase().includes(searchTermLower)
    );
  });
  
  // Handle Cloudinary cleanup
  const handleCloudinaryCleanup = async () => {
    try {
      setIsCleanupLoading(true);
      const results = await cleanupCloudinaryResources();
      setCleanupResults(results);
    } catch (error) {
      console.error('Error cleaning up Cloudinary resources:', error);
      setCleanupResults({
        success: false,
        error: error.message || 'Failed to cleanup Cloudinary resources'
      });
    } finally {
      setIsCleanupLoading(false);
    }
  };
  
  // Handle edit book
  const handleEditBook = (book) => {
    setSelectedBook(book);
    setEditBookModalOpen(true);
  };
  
  // Handle save book changes
  const handleSaveBookChanges = async (bookId, formData) => {
    setIsSaving(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update the book
      const updatedBook = await updateBook(bookId, formData, token);
      
      // Close the edit modal and refresh books
      closeEditModal();
      fetchBooks();
      
      // Show success message
      setNotification({
        type: 'success',
        message: `Book "${updatedBook.title}" has been successfully updated.`
      });
      
      setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 5000);
    } catch (err) {
      console.error('Error updating book:', err);
      
      setEditError(err.message || 'An error occurred while updating the book');
      
      // Show error notification
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update book. Please try again.'
      });
      
      setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to fetch books (needed to refresh after edits)
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const bookData = await getAllBooks();
      setBooks(bookData);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(`Failed to load books. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Close edit modal
  const closeEditModal = () => {
    setEditBookModalOpen(false);
    setSelectedBook(null);
    setEditError('');
  };
  
  // Conditional rendering for auth check
  if (!user) {
    return <div className={styles.loading}>Checking authentication...</div>;
  }
  
  // Prevent unauthorized access
  if (user && !user.isAdmin) {
    return <div className={styles.error}>Access denied. Admin privileges required.</div>;
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('users')}
        >
          <FaUser /> Manage Users
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'books' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('books')}
        >
          <FaBook /> Manage Books
        </button>
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {/* Admin Actions */}
      <div className={styles.adminActions}>
        <button 
          className={`${styles.adminActionButton} ${isCleanupLoading ? styles.disabledButton : ''}`}
          onClick={handleCloudinaryCleanup}
          disabled={isCleanupLoading}
        >
          <FiCloudRain />
          {isCleanupLoading ? 'Cleaning up...' : 'Cleanup Cloudinary Resources'}
        </button>
      </div>
      
      {/* Cleanup Results */}
      {cleanupResults && (
        <div className={styles.cleanupResults}>
          <h3>Cloudinary Cleanup Results</h3>
          <div className={styles.cleanupSummary}>
            {!cleanupResults.error ? (
              <>
                <p><strong>Status:</strong> Success</p>
                <p><strong>PDFs Cleaned:</strong> {cleanupResults.deleted?.pdfs?.length || 0}</p>
                <p><strong>Covers Cleaned:</strong> {cleanupResults.deleted?.covers?.length || 0}</p>
                {cleanupResults.errors && cleanupResults.errors.length > 0 && (
                  <p className={styles.cleanupErrors}>
                    <strong>Errors:</strong>
                    {cleanupResults.errors.map((error, index) => (
                      <div key={index} className={styles.cleanupError}>
                        {error.type === 'pdf' ? 'PDF: ' : 'Cover: '}
                        {error.id ? `${error.id} - ` : ''}
                        {error.error || error}
                      </div>
                    ))}
                  </p>
                )}
              </>
            ) : (
              <p><strong>Error:</strong> {cleanupResults.error || 'Unknown error occurred'}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className={styles.tabContent}>
          <div className={styles.searchContainer}>
            <SearchInput
              placeholder="Search users by name or email..."
              onSearch={setUserSearch}
              initialValue={userSearch}
              debounceTime={500}
              className={styles.searchBar}
            />
          </div>
          
          {loading ? (
            <div className={styles.loading}>Loading users...</div>
          ) : filteredUsers.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Admin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td className={styles.userName}>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <span className={`${styles.status} ${user.isBanned ? styles.banned : styles.active}`}>
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.adminStatus} ${user.isAdmin ? styles.isAdmin : ''}`}>
                          {user.isAdmin ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className={styles.actions}>
                        {!user.isAdmin && (
                          <>
                            <button 
                              className={`${styles.actionButton} ${user.isBanned ? styles.unbanButton : styles.banButton}`}
                              onClick={() => openModal(
                                'ban-user', 
                                user._id, 
                                user.isBanned ? 'Unban User' : 'Ban User', 
                                user.isBanned 
                                  ? `Are you sure you want to unban ${user.name}?`
                                  : `Are you sure you want to ban ${user.name}? They will no longer be able to log in.`
                              )}
                              title={user.isBanned ? 'Unban User' : 'Ban User'}
                            >
                              {user.isBanned ? <FaUnlock /> : <FaBan />}
                            </button>
                            <button 
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => openModal(
                                'delete-user', 
                                user._id, 
                                'Delete User', 
                                `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`
                              )}
                              title="Delete User"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noResults}>No users found</div>
          )}
        </div>
      )}
      
      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className={styles.tabContent}>
          <div className={styles.searchContainer}>
            <SearchInput
              placeholder="Search books by title, author, or category..."
              onSearch={setBookSearch}
              initialValue={bookSearch}
              debounceTime={500}
              className={styles.searchBar}
            />
          </div>
          
          {loading ? (
            <div className={styles.loading}>Loading books...</div>
          ) : filteredBooks.length > 0 ? (
            <div className={styles.bookGrid}>
              {filteredBooks.map(book => (
                <div key={book._id} className={styles.bookCard}>
                  <div className={styles.bookCover}>
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} />
                    ) : (
                      <div className={styles.placeholderCover}>
                        <FaBook />
                      </div>
                    )}
                  </div>
                  <div className={styles.bookInfo}>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>by {book.author}</p>
                    <p className={styles.bookCategory}>{book.category}</p>
                    <div className={styles.bookStats}>
                      <span className={styles.stat}>
                        <FaEye /> {book.views || 0}
                      </span>
                      <span className={styles.stat}>
                        <FaDownload /> {book.downloads || 0}
                      </span>
                      <span className={styles.stat}>
                        <FaStar /> {book.averageRating ? book.averageRating.toFixed(1) : '0.0'}
                      </span>
                      {book.fileSizeMB > 0 && (
                        <span className={styles.stat}>
                          <FaFile /> {book.fileSizeMB}MB
                        </span>
                      )}
                    </div>
                    <div className={styles.bookMeta}>
                      <span className={styles.bookDate}>
                        <FaCalendarAlt /> {formatDate(book.createdAt)}
                      </span>
                      {book.uploadedBy && (
                        <span className={styles.bookUploader}>
                          <FaUser /> {book.uploadedBy.name}
                        </span>
                      )}
                    </div>
                    <div className={styles.bookActions}>
                      <button 
                        className={`${styles.bookAction} ${styles.editButton}`}
                        onClick={() => handleEditBook(book)}
                        title="Edit Book"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className={`${styles.bookAction} ${styles.deleteButton}`}
                        onClick={() => openModal(
                          'delete-book', 
                          book._id, 
                          'Delete Book', 
                          `Are you sure you want to permanently delete "${book.title}"? This will delete the book record, PDF file, cover image, and all associated reviews and bookmarks. This action cannot be undone.`
                        )}
                        title="Delete Book"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>No books found</div>
          )}
        </div>
      )}
      
      <ConfirmationModal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={confirmAction}
        onCancel={closeModal}
        isDeleting={isProcessing}
      />
      
      <EditBookModal
        isOpen={editBookModalOpen}
        book={selectedBook}
        onSave={handleSaveBookChanges}
        onCancel={() => setEditBookModalOpen(false)}
        isSaving={isSaving}
      />
    </div>
  );
} 