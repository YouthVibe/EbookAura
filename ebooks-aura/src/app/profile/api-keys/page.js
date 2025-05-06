/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Stack, 
  Divider, Alert, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControlLabel, 
  Checkbox, Chip, IconButton, Card, CardContent, 
  CardActions, Tooltip, CircularProgress, Switch, Link as MuiLink,
  LinearProgress, Collapse, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { KeyOutlined, Add, Delete, Edit, FileCopy, Key, KeyOff, Loop, Check, Article, Refresh, BarChart, ExpandMore, ExpandLess } from '@mui/icons-material';
import { getUserApiKeys, createApiKey, updateApiKey, revokeApiKey, activateApiKey, deleteApiKey, getApiKey, getApiKeyUsageHistory } from '@/app/api/apiKeyService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// Function to copy text to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

export default function ApiKeysPage() {
  const { user, loading: isLoading } = useAuth();
  const isAuthenticated = !!user;
  const router = useRouter();
  
  // State for API keys and UI controls
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // State for newly created key display
  const [newKey, setNewKey] = useState(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // State for analytics
  const [expandedAnalytics, setExpandedAnalytics] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState({});

  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState(null);
  const [keyToDelete, setKeyToDelete] = useState(null);
  
  // State for refreshing usage data
  const [refreshingUsage, setRefreshingUsage] = useState(false);
  const refreshInterval = useRef(null);

  // Form states
  const [keyName, setKeyName] = useState('');
  const [permissions, setPermissions] = useState({
    read: true,
    write: false,
    getPdf: false,
    download: false,
    postReviews: false
  });

  // Load API keys when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadApiKeys();
      
      // Start the refresh interval
      startUsageRefresh();
      
      // Clean up interval on unmount
      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current);
        }
      };
    } else if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile/api-keys');
    }
  }, [isAuthenticated, isLoading]);

  // Start refreshing usage data periodically
  const startUsageRefresh = () => {
    // Refresh usage data every 30 seconds
    refreshInterval.current = setInterval(() => {
      refreshApiKeyUsage();
    }, 30000); // 30 seconds
  };

  // Refresh API key usage data without loading UI
  const refreshApiKeyUsage = useCallback(async () => {
    if (apiKeys.length === 0 || !isAuthenticated) return;
    
    try {
      setRefreshingUsage(true);
      const updatedKeys = await getUserApiKeys();
      setApiKeys(updatedKeys);
    } catch (err) {
      console.error('Error refreshing API key usage:', err);
      // Don't show error to user for background refresh
    } finally {
      setRefreshingUsage(false);
    }
  }, [apiKeys, isAuthenticated]);

  // Manually refresh usage data with loading UI
  const handleRefreshUsage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await refreshApiKeyUsage();
      setSuccess('API key usage data refreshed successfully!');
      // Reset success message after 3 seconds
      setTimeout(() => {
        if (setSuccess) { // Check if component is still mounted
          setSuccess(null);
        }
      }, 3000);
    } catch (err) {
      setError('Failed to refresh API key usage data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load API keys from the server
  const loadApiKeys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const keys = await getUserApiKeys();
      setApiKeys(keys);
    } catch (err) {
      setError('Failed to load API keys. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open create dialog
  const handleCreateClick = () => {
    setKeyName('');
    setPermissions({
      read: true,
      write: false,
      getPdf: false,
      download: false,
      postReviews: false
    });
    setCreateDialogOpen(true);
  };

  // Handle API key creation
  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      setError('API key name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const newApiKey = await createApiKey(keyName, permissions);
      
      // Make sure we have the API key value
      if (!newApiKey || !newApiKey.key) {
        throw new Error('API key creation was successful but no key was returned');
      }
      
      // Add the new key to the list
      setApiKeys(prevKeys => [...prevKeys, newApiKey]);
      
      // Set the new key for display
      setNewKey(newApiKey);
      
      // Show success message
      setSuccess('API key created successfully! Please copy your key now - it will only be shown once.');
      
      // Close the dialog
      setCreateDialogOpen(false);
      
      // Scroll to the top to ensure the user sees the new key
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to create API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog
  const handleEditClick = (key) => {
    setKeyToEdit(key);
    setKeyName(key.name);
    setPermissions({ ...key.permissions });
    setEditDialogOpen(true);
  };

  // Handle API key update
  const handleUpdateKey = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedKey = await updateApiKey(keyToEdit.id, keyName, permissions);
      setApiKeys(apiKeys.map(key => key.id === updatedKey.id ? updatedKey : key));
      setSuccess('API key updated successfully!');
      setEditDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to update API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle revoking/activating an API key
  const handleToggleKeyActive = async (key) => {
    setLoading(true);
    setError(null);
    
    try {
      let updatedKey;
      if (key.isActive) {
        updatedKey = await revokeApiKey(key.id);
        setSuccess('API key revoked successfully!');
      } else {
        updatedKey = await activateApiKey(key.id);
        setSuccess('API key activated successfully!');
      }
      
      setApiKeys(apiKeys.map(k => k.id === updatedKey.id ? { ...k, isActive: updatedKey.isActive } : k));
    } catch (err) {
      setError(err.message || 'Failed to update API key status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (key) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  // Handle API key deletion
  const handleDeleteKey = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteApiKey(keyToDelete.id);
      setApiKeys(apiKeys.filter(key => key.id !== keyToDelete.id));
      setSuccess('API key deleted successfully!');
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to delete API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle copying API key
  const handleCopyKey = async (key) => {
    const copied = await copyToClipboard(key);
    setKeyCopied(copied);
    
    if (copied) {
      setSuccess('API key copied to clipboard!');
      // Reset copy success message after 3 seconds
      setTimeout(() => {
        if (setSuccess) { // Check if component is still mounted
          setSuccess(null);
        }
      }, 3000);
    } else {
      setError('Failed to copy API key. Please try manually selecting and copying.');
    }
  };

  // Handle permission change
  const handlePermissionChange = (permission) => {
    setPermissions({
      ...permissions,
      [permission]: !permissions[permission]
    });
  };

  // Clear new key display
  const handleClearNewKey = () => {
    setNewKey(null);
    setKeyCopied(false);
  };

  // Clear alerts
  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  // Return to profile
  const handleBack = () => {
    router.push('/profile');
  };

  // Toggle analytics section expansion
  const toggleAnalytics = async (keyId) => {
    const newExpandedState = !expandedAnalytics[keyId];
    setExpandedAnalytics(prev => ({
      ...prev,
      [keyId]: newExpandedState
    }));
    
    // Fetch analytics data if expanding and we don't have data yet
    if (newExpandedState && !analyticsData[keyId]) {
      await loadAnalyticsData(keyId);
    }
  };

  // Load analytics data for a specific API key
  const loadAnalyticsData = async (keyId) => {
    setLoadingAnalytics(prev => ({ ...prev, [keyId]: true }));
    
    try {
      const history = await getApiKeyUsageHistory(keyId);
      
      // Check if we have valid data
      if (!history || !history.lastWeek) {
        console.error('Invalid analytics data format:', history);
        throw new Error('Invalid data format received from server');
      }
      
      setAnalyticsData(prev => ({ ...prev, [keyId]: history }));
      setError(null); // Clear any existing errors
    } catch (err) {
      console.error(`Error loading analytics for API key ${keyId}:`, err);
      
      // Show error in the analytics section
      setAnalyticsData(prev => ({ 
        ...prev, 
        [keyId]: { 
          error: err.message || 'Failed to load analytics data',
          retryable: true 
        } 
      }));
      
      // Show a general error message if this is the first attempt
      if (!analyticsData[keyId]?.error) {
        setError('Failed to load API key analytics. Please try again.');
        
        // Auto-hide the error after 5 seconds
        setTimeout(() => {
          if (setError) { // Check if component is still mounted
            setError(null);
          }
        }, 5000);
      }
    } finally {
      setLoadingAnalytics(prev => ({ ...prev, [keyId]: false }));
    }
  };

  // If not authenticated yet, show loading
  if (isLoading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography mt={2}>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <KeyOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
          API Keys
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your API keys to access EbookAura programmatically. You can create up to 5 API keys.
          <Link href="/profile/api-keys/docs" passHref>
            <MuiLink sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
              <Article fontSize="small" sx={{ mr: 0.5 }} />
              View API Documentation
            </MuiLink>
          </Link>
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearAlerts}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={clearAlerts}>
            {success}
          </Alert>
        )}
        
        {newKey && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" gutterBottom color="primary">
              Your New API Key
            </Typography>
            <Typography variant="body2" paragraph color="error">
              Important: Copy this key now. It will only be shown once!
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              bgcolor: '#f0f0f0', 
              borderRadius: 1, 
              fontFamily: 'monospace', 
              fontSize: '0.9rem',
              position: 'relative',
              mb: 2
            }}>
              <code style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>
                {newKey.key}
              </code>
              <IconButton 
                size="small" 
                sx={{ position: 'absolute', right: 8, top: 8 }}
                onClick={() => handleCopyKey(newKey.key)}
                color={keyCopied ? "success" : "default"}
              >
                {keyCopied ? <Check fontSize="small" /> : <FileCopy fontSize="small" />}
              </IconButton>
            </Box>
            
            <Button variant="outlined" onClick={handleClearNewKey}>
              I've copied my key
            </Button>
          </Paper>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button 
          variant="outlined"
          onClick={handleBack}
        >
          Back to Profile
        </Button>
        <Box>
          <Button 
            variant="outlined" 
            onClick={handleRefreshUsage} 
            startIcon={<Refresh />}
            disabled={loading || refreshingUsage}
            sx={{ mr: 2 }}
          >
            Refresh Usage
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleCreateClick}
            disabled={loading || apiKeys.length >= 5}
          >
            Create API Key
          </Button>
        </Box>
      </Box>
      
      {loading && !apiKeys.length ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : apiKeys.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Key sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No API Keys Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first API key to start using the EbookAura API programmatically.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={handleCreateClick}
          >
            Create API Key
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} sx={{ 
              position: 'relative',
              opacity: apiKey.isActive ? 1 : 0.7
            }}>
              {!apiKey.isActive && (
                <Chip 
                  label="Revoked" 
                  color="error" 
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8,
                  }}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" gutterBottom>
                    {apiKey.name}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={expandedAnalytics[apiKey.id] ? "Hide Analytics" : "Show Analytics"}>
                      <IconButton 
                        size="small"
                        onClick={() => toggleAnalytics(apiKey.id)}
                        color={expandedAnalytics[apiKey.id] ? "primary" : "default"}
                      >
                        {expandedAnalytics[apiKey.id] ? <ExpandLess /> : <BarChart />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={apiKey.isActive ? "Revoke Key" : "Activate Key"}>
                      <IconButton 
                        size="small"
                        onClick={() => handleToggleKeyActive(apiKey)}
                        color={apiKey.isActive ? "default" : "primary"}
                      >
                        {apiKey.isActive ? <KeyOff /> : <Key />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small"
                        onClick={() => handleEditClick(apiKey)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small"
                        onClick={() => handleDeleteClick(apiKey)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDistanceToNow(new Date(apiKey.createdAt))} ago
                </Typography>
                
                {apiKey.lastUsed && (
                  <Typography variant="body2" color="text.secondary">
                    Last used: {formatDistanceToNow(new Date(apiKey.lastUsed))} ago
                  </Typography>
                )}
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Permissions:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {apiKey.permissions.read && <Chip size="small" label="Read" color="primary" />}
                    {apiKey.permissions.write && <Chip size="small" label="Write" color="secondary" />}
                    {apiKey.permissions.getPdf && <Chip size="small" label="PDF Access" color="success" />}
                    {apiKey.permissions.download && <Chip size="small" label="Download" color="info" />}
                    {apiKey.permissions.postReviews && <Chip size="small" label="Post Reviews" color="warning" />}
                  </Stack>
                </Box>
                
                {apiKey.usage && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        API Usage Today:
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {apiKey.usage.lastReset ? (
                          <>Reset {formatDistanceToNow(new Date(apiKey.usage.lastReset))} ago</>
                        ) : (
                          'Resets at midnight UTC'
                        )}
                      </Typography>
                    </Box>
                    
                    {/* Books searched usage */}
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          Books searched:
                        </Typography>
                        <Typography variant="body2" fontWeight={apiKey.usage.booksSearched > 0 ? 'bold' : 'normal'}>
                          {apiKey.usage.booksSearched}/{apiKey.limits.booksPerDay}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(apiKey.usage.booksSearched / apiKey.limits.booksPerDay) * 100}
                        color={apiKey.usage.booksSearched > apiKey.limits.booksPerDay * 0.8 ? "warning" : "primary"}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    
                    {/* Reviews posted usage */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          Reviews posted:
                        </Typography>
                        <Typography variant="body2" fontWeight={apiKey.usage.reviewsPosted > 0 ? 'bold' : 'normal'}>
                          {apiKey.usage.reviewsPosted}/{apiKey.limits.reviewsPerDay}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(apiKey.usage.reviewsPosted / apiKey.limits.reviewsPerDay) * 100}
                        color={apiKey.usage.reviewsPosted > apiKey.limits.reviewsPerDay * 0.8 ? "warning" : "primary"}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Last used: {apiKey.lastUsed ? formatDistanceToNow(new Date(apiKey.lastUsed)) + ' ago' : 'Never'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Next reset: {(() => {
                          const now = new Date();
                          const tomorrow = new Date(now);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(0, 0, 0, 0);
                          return formatDistanceToNow(tomorrow);
                        })()}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* Analytics Section */}
                <Collapse in={expandedAnalytics[apiKey.id]} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      API Key Analytics
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loadingAnalytics[apiKey.id] ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ mt: 1 }}>Loading analytics data...</Typography>
                      </Box>
                    ) : analyticsData[apiKey.id]?.error ? (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {analyticsData[apiKey.id].error}
                        </Alert>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => loadAnalyticsData(apiKey.id)}
                          startIcon={<Refresh />}
                        >
                          Retry Loading Data
                        </Button>
                      </Box>
                    ) : analyticsData[apiKey.id] ? (
                      <>
                        {/* Daily Averages */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>Daily Averages</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                              <Typography variant="body2">Books searched:</Typography>
                              <Typography variant="h5" color="primary" fontWeight="bold">
                                {analyticsData[apiKey.id].dailyAverages?.booksSearched || 0}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  per day
                                </Typography>
                              </Typography>
                            </Box>
                            <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                              <Typography variant="body2">Reviews posted:</Typography>
                              <Typography variant="h5" color="primary" fontWeight="bold">
                                {analyticsData[apiKey.id].dailyAverages?.reviewsPosted || 0}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  per day
                                </Typography>
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        {/* Usage Chart */}
                        <Typography variant="subtitle2" gutterBottom>Last 7 Days</Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                          <Box sx={{ display: 'flex', minWidth: '550px', mt: 2, height: 100 }}>
                            {analyticsData[apiKey.id].lastWeek.map((day) => (
                              <Box key={day.date} sx={{ flex: 1, px: 0.5, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                  {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                </Typography>
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                  <Box sx={{ 
                                    height: `${Math.min((day.booksSearched / apiKey.limits.booksPerDay) * 100, 100)}%`, 
                                    minHeight: day.booksSearched > 0 ? 4 : 0,
                                    bgcolor: 'primary.main',
                                    borderTopLeftRadius: 4,
                                    borderTopRightRadius: 4,
                                    mb: 0.5,
                                    position: 'relative'
                                  }}>
                                    <Typography variant="caption" sx={{ 
                                      position: 'absolute', 
                                      top: -20, 
                                      left: '50%', 
                                      transform: 'translateX(-50%)',
                                      fontSize: '0.7rem',
                                      fontWeight: day.booksSearched > 0 ? 'bold' : 'normal'
                                    }}>
                                      {day.booksSearched}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ 
                                    height: `${Math.min((day.reviewsPosted / apiKey.limits.reviewsPerDay) * 100, 100)}%`,
                                    minHeight: day.reviewsPosted > 0 ? 4 : 0,
                                    bgcolor: 'secondary.main',
                                    borderTopLeftRadius: 4,
                                    borderTopRightRadius: 4,
                                    position: 'relative'
                                  }}>
                                    <Typography variant="caption" sx={{ 
                                      position: 'absolute', 
                                      top: -20, 
                                      left: '50%', 
                                      transform: 'translateX(-50%)',
                                      fontSize: '0.7rem',
                                      fontWeight: day.reviewsPosted > 0 ? 'bold' : 'normal'
                                    }}>
                                      {day.reviewsPosted}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', mr: 1 }} />
                              <Typography variant="caption">Books Searched</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'secondary.main', mr: 1 }} />
                              <Typography variant="caption">Reviews Posted</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No usage history available yet. Start using this API key to generate analytics data.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => loadAnalyticsData(apiKey.id)}
                          startIcon={<Refresh />}
                        >
                          Check Again
                        </Button>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => loadAnalyticsData(apiKey.id)}
                        startIcon={<Refresh />}
                        disabled={loadingAnalytics[apiKey.id]}
                      >
                        Refresh Analytics
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      
      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="API Key Name"
            fullWidth
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
            helperText="Give your API key a descriptive name (e.g. 'Mobile App', 'Personal Script')"
          />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Permissions:
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.read}
                onChange={() => handlePermissionChange('read')}
                disabled={true} // Read is always enabled
              />
            }
            label="Read (Search books, view categories/tags)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.write}
                onChange={() => handlePermissionChange('write')}
              />
            }
            label="Write (Update user profile)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.getPdf}
                onChange={() => handlePermissionChange('getPdf')}
              />
            }
            label="PDF Access (View PDF content)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.download}
                onChange={() => handlePermissionChange('download')}
              />
            }
            label="Download (Download PDF files)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.postReviews}
                onChange={() => handlePermissionChange('postReviews')}
              />
            }
            label="Post Reviews (Create book reviews)"
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Rate limits per day:</strong>
              <br />
              • 50 book searches
              <br />
              • 10 review posts
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateKey} 
            variant="contained"
            disabled={!keyName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit API Key Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit API Key</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="API Key Name"
            fullWidth
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
          />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Permissions:
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.read}
                onChange={() => handlePermissionChange('read')}
                disabled={true} // Read is always enabled
              />
            }
            label="Read (Search books, view categories/tags)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.write}
                onChange={() => handlePermissionChange('write')}
              />
            }
            label="Write (Update user profile)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.getPdf}
                onChange={() => handlePermissionChange('getPdf')}
              />
            }
            label="PDF Access (View PDF content)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.download}
                onChange={() => handlePermissionChange('download')}
              />
            }
            label="Download (Download PDF files)"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.postReviews}
                onChange={() => handlePermissionChange('postReviews')}
              />
            }
            label="Post Reviews (Create book reviews)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateKey} 
            variant="contained"
            disabled={!keyName.trim()}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete API Key</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the API key "{keyToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteKey} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 