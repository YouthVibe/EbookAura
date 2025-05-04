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
  Paper,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { toast } from 'react-toastify';
import { getCurrentApiKey, generateApiKey, revokeApiKey } from '../../api/apiKeys';

/**
 * Component for managing API keys in the user profile
 */
const ApiKeyManager = () => {
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
      setError('Unable to fetch API key. Please try again later.');
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
        setError('Failed to generate API key.');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      setError('Unable to generate API key. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to revoke the current API key
  const handleRevokeApiKey = async () => {
    // Ask for confirmation before revoking
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
        setError('Failed to revoke API key.');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      setError('Unable to revoke API key. Please try again later.');
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
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          API Key Management
          <Tooltip title="API keys allow external applications to access the EbookAura API on your behalf. Keep your key secure and never share it publicly.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {showNewKey && (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: 'primary.light', 
              color: 'primary.contrastText' 
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Your new API key (only shown once):
            </Typography>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={newApiKey}
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: { 
                      fontFamily: 'monospace',
                      bgcolor: 'background.paper',
                      color: 'text.primary'
                    }
                  }}
                />
              </Grid>
              <Grid item>
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={() => copyToClipboard(newApiKey)}
                  startIcon={<ContentCopyIcon />}
                >
                  Copy
                </Button>
              </Grid>
            </Grid>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Make sure to copy this key now. For security reasons, you won't be able to see it again.
            </Typography>
          </Paper>
        )}
        
        <Box sx={{ mb: 3 }}>
          {apiKey ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Current API Key:
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={apiKey}
                    disabled
                    size="small"
                    InputProps={{
                      readOnly: true,
                      sx: { fontFamily: 'monospace' }
                    }}
                  />
                </Grid>
                <Grid item>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={handleGenerateApiKey}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                    sx={{ mr: 1 }}
                  >
                    Regenerate
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleRevokeApiKey}
                    disabled={loading}
                    startIcon={<DeleteIcon />}
                  >
                    Revoke
                  </Button>
                </Grid>
              </Grid>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" gutterBottom>
                You don't have an API key yet.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleGenerateApiKey}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                Generate API Key
              </Button>
            </Box>
          )}
        </Box>
        
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Using Your API Key:
        </Typography>
        
        <Typography variant="body2" paragraph>
          Include your API key in the header of your HTTP requests as:
        </Typography>
        
        <Paper elevation={0} sx={{ bgcolor: 'grey.100', p: 2, mb: 2 }}>
          <code style={{ display: 'block', fontFamily: 'monospace' }}>
            X-API-Key: your_api_key_here
          </code>
        </Paper>
        
        <Typography variant="body2" paragraph>
          This API key allows you to:
        </Typography>
        
        <ul style={{ paddingLeft: '20px' }}>
          <li>
            <Typography variant="body2">
              Access premium PDFs if you have an active subscription
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Integrate EbookAura content with external applications
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Make authenticated API requests without logging in each time
            </Typography>
          </li>
        </ul>
        
        <Alert severity="warning" sx={{ mt: 2 }}>
          Keep your API key secure. Never share it in public repositories or client-side code.
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ApiKeyManager; 