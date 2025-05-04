'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaBook, FaTrash, FaBan, FaUnlock, FaEye, FaDownload, FaStar, FaCalendarAlt, FaFilter, FaSearch, FaPlusCircle, FaBookOpen, FaEdit, FaCloudUploadAlt, FaBroom } from 'react-icons/fa';
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
        price: book.price || 0
      });
      setPdfFileName('No new PDF selected');
      setCoverFileName('No new cover image selected');
      setNewPdfFile(null);
      setNewCoverFile(null);
      setError('');
    }
  }, [book, isOpen]);
  
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

  const handleCoverChange = (e) => {
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

      setNewCoverFile(selectedFile);
      setCoverFileName(selectedFile.name);
      setError('');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedBook(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      
      if (!editedBook.tags.includes(newTag)) {
        setEditedBook(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setEditedBook(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!editedBook.title || !editedBook.author || !editedBook.description || !editedBook.category) {
      setError('Please fill all required fields');
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
    
    if (newCoverFile) {
      formData.append('cover', newCoverFile);
    }
    
    // Call the save function with the form data
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
        
        <form onSubmit={handleSubmit} className={styles.editBookForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={editedBook.title}
                onChange={handleInputChange}
                required
                maxLength={100}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="author">Author *</label>
              <input
                type="text"
                id="author"
                name="author"
                value={editedBook.author}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={editedBook.description}
                onChange={handleInputChange}
                rows={3}
                required
                maxLength={200}
              />
              <small>{editedBook.description.length}/200 characters</small>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={editedBook.category}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="pageSize">Page Count *</label>
              <input
                type="number"
                id="pageSize"
                name="pageSize"
                value={editedBook.pageSize}
                onChange={handleInputChange}
                min={1}
                required
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
                <label htmlFor="isPremium">Premium Book</label>
              </div>
            </div>
            
            {editedBook.isPremium && (
              <div className={styles.formGroup}>
                <label htmlFor="price">Price (coins) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={editedBook.price}
                  onChange={handleInputChange}
                  min={0}
                  required={editedBook.isPremium}
                />
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label>Tags</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag and press Enter"
              />
            </div>
            <div className={styles.selectedTags}>
              {editedBook.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
            <small>Press Enter to add a tag</small>
          </div>
          
          <div className={styles.fileUploads}>
            <div className={styles.fileGroup}>
              <label>Update PDF File</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  id="pdf-upload"
                  className={styles.fileInput}
                />
                <label htmlFor="pdf-upload" className={styles.fileInputLabel}>
                  <FaCloudUploadAlt /> Choose New PDF
                </label>
                <span className={styles.fileName}>{pdfFileName}</span>
              </div>
              <small>Leave empty to keep the current PDF</small>
            </div>
            
            <div className={styles.fileGroup}>
              <label>Update Cover Image</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  id="cover-upload"
                  className={styles.fileInput}
                />
                <label htmlFor="cover-upload" className={styles.fileInputLabel}>
                  <FaCloudUploadAlt /> Choose New Cover
                </label>
                <span className={styles.fileName}>{coverFileName}</span>
              </div>
              <small>Leave empty to keep the current cover</small>
            </div>
          </div>
          
          <div className={styles.modalFooter}>
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
              {isSaving ? 'Saving...' : 'Save Changes'}
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
  const router = useRouter();
  const { user } = useAuth();
  
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
    try {
      setIsSaving(true);
      setError(null);
      
      // Call the updateBook API function
      const result = await updateBook(bookId, formData);
      
      // Update the book in the state
      setBooks(books.map(book => 
        book._id === bookId ? result.book : book
      ));
      
      // Close the modal
      setEditBookModalOpen(false);
      setSelectedBook(null);
    } catch (err) {
      console.error('Error updating book:', err);
      setError(`Failed to update book: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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