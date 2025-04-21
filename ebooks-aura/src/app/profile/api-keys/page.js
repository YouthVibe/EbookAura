'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Stack, 
  Divider, Alert, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControlLabel, 
  Checkbox, Chip, IconButton, Card, CardContent, 
  CardActions, Tooltip, CircularProgress, Switch, Link as MuiLink
} from '@mui/material';
import { KeyOutlined, Add, Delete, Edit, FileCopy, Key, KeyOff, Loop, Check, Article } from '@mui/icons-material';
import { getUserApiKeys, createApiKey, updateApiKey, revokeApiKey, activateApiKey, deleteApiKey } from '@/app/api/apiKeyService';
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

  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToEdit, setKeyToEdit] = useState(null);
  const [keyToDelete, setKeyToDelete] = useState(null);

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
    } else if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile/api-keys');
    }
  }, [isAuthenticated, isLoading]);

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
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
            action={
              <IconButton
                aria-label="copy"
                color="inherit"
                size="small"
                onClick={() => handleCopyKey(newKey.key)}
              >
                <FileCopy fontSize="inherit" />
              </IconButton>
            }
          >
            <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold">
              New API Key Created - COPY THIS KEY NOW
            </Typography>
            <Paper
              elevation={0}
              sx={{ 
                fontFamily: 'monospace', 
                wordBreak: 'break-all',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                p: 2,
                borderRadius: 1,
                border: '1px dashed rgba(0, 0, 0, 0.2)',
                my: 1
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                {newKey.key}
              </Typography>
            </Paper>
            <Typography variant="body2" color="error" fontWeight="bold" sx={{ mb: 1 }}>
              ⚠️ This key will only be shown once. Please copy it now or you'll need to create a new one.
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                size="small" 
                color={keyCopied ? "success" : "primary"}
                onClick={() => handleCopyKey(newKey.key)}
                startIcon={keyCopied ? <Check /> : <FileCopy />}
                sx={{ mr: 1 }}
              >
                {keyCopied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleClearNewKey}
              >
                I've Saved My Key
              </Button>
            </Box>
          </Alert>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button 
          variant="outlined"
          onClick={handleBack}
        >
          Back to Profile
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={handleCreateClick}
          disabled={apiKeys.length >= 5}
        >
          Create API Key
        </Button>
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
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Usage Today:
                    </Typography>
                    <Typography variant="body2">
                      Books searched: {apiKey.usage.booksSearched}/{apiKey.limits.booksPerDay}
                    </Typography>
                    <Typography variant="body2">
                      Reviews posted: {apiKey.usage.reviewsPosted}/{apiKey.limits.reviewsPerDay}
                    </Typography>
                  </Box>
                )}
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