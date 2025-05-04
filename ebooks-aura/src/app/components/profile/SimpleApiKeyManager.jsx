/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Grid, 
  Alert, 
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Link as MuiLink
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { toast } from 'react-toastify';
import { getCurrentApiKey, generateApiKey, revokeApiKey } from '../../api/apiKeys';
import Link from 'next/link';

/**
 * A simplified API key manager component for the settings page
 */
const SimpleApiKeyManager = () => {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [error, setError] = useState(null);

  // Fetch current API key on component mount
  useEffect(() => {
    fetchCurrentApiKey();
  }, []);

  // Function to fetch the current API key
  const fetchCurrentApiKey = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCurrentApiKey();
      
      if (response.success && response.apiKey) {
        setApiKey(response.apiKey);
      } else {
        setApiKey(null);
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
      setError('Unable to fetch API key');
      setApiKey(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate a new API key
  const handleGenerateApiKey = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowNewKey(false);
      
      const response = await generateApiKey();
      
      if (response.success && response.apiKey) {
        setNewApiKey(response.apiKey);
        setShowNewKey(true);
        fetchCurrentApiKey(); // Refresh to get the masked version
        toast.success('New API key generated successfully!');
      } else {
        setError('Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      setError('Unable to generate API key');
    } finally {
      setLoading(false);
    }
  };

  // Function to revoke the current API key
  const handleRevokeApiKey = async () => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await revokeApiKey();
      
      if (response.success) {
        setApiKey(null);
        setNewApiKey('');
        setShowNewKey(false);
        toast.success('API key revoked successfully!');
      } else {
        setError('Failed to revoke API key');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      setError('Unable to revoke API key');
    } finally {
      setLoading(false);
    }
  };

  // Function to copy API key to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('API key copied to clipboard!');
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast.error('Failed to copy to clipboard');
      }
    );
  };

  return (
    <Box mb={3}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {showNewKey && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => copyToClipboard(newApiKey)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Your new API key (only shown once):
          </Typography>
          <Box 
            sx={{ 
              fontFamily: 'monospace', 
              p: 1, 
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px dashed rgba(0, 0, 0, 0.2)',
              wordBreak: 'break-all'
            }}
          >
            {newApiKey}
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'error.main' }}>
            Make sure to copy this key now. You won't be able to see it again!
          </Typography>
        </Alert>
      )}
      
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          {apiKey ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon color="primary" fontSize="small" />
              <Chip 
                label="API Key Active" 
                color="success"
                size="small"
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon color="disabled" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                No API key generated
              </Typography>
            </Box>
          )}
        </Box>
        
        <Box>
          {apiKey ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleGenerateApiKey}
                disabled={loading}
              >
                Regenerate
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRevokeApiKey}
                disabled={loading}
              >
                Revoke
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<KeyIcon />}
              onClick={handleGenerateApiKey}
              disabled={loading}
            >
              Generate API Key
            </Button>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Use your API key to access EbookAura services programmatically
        </Typography>
        <Link href="/profile/api-keys" passHref>
          <MuiLink sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2">Manage API Keys</Typography>
            <OpenInNewIcon fontSize="small" />
          </MuiLink>
        </Link>
      </Box>
    </Box>
  );
};

export default SimpleApiKeyManager; 