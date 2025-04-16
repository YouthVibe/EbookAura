'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaBook, FaTrash, FaBan, FaUnlock, FaEye, FaDownload, FaStar, FaCalendarAlt, FaFilter, FaSearch, FaPlusCircle, FaBookOpen, FaEdit } from 'react-icons/fa';
import { getAllUsers, toggleUserBan, deleteUser, getAllBooks, deleteBook } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import styles from './admin.module.css';
import Link from 'next/link';
import SearchInput from '../components/SearchInput';

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
            className={styles.cancelButton}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={styles.confirmButton}
            disabled={isDeleting}
          >
            {isDeleting ? 'Processing...' : 'Confirm'}
          </button>
        </div>
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
      
      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className={styles.tabContent}>
          <div className={styles.searchContainer}>
            <SearchInput
              placeholder="Search users by name or email..."
              onSearch={setUserSearch}
              initialValue={userSearch}
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
                        className={`${styles.bookAction} ${styles.deleteButton}`}
                        onClick={() => openModal(
                          'delete-book', 
                          book._id, 
                          'Delete Book', 
                          `Are you sure you want to permanently delete "${book.title}"? This action cannot be undone.`
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
    </div>
  );
} 