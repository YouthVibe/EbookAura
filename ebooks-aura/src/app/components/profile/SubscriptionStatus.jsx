/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Divider, 
  Button, 
  Alert,
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  Stars as StarsIcon,
  LockOpen as LockOpenIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { getCurrentSubscription } from '../../api/subscriptions';

/**
 * Component to display the user's subscription status
 */
const SubscriptionStatus = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCurrentSubscription();
      
      if (response.success) {
        setSubscription(response);
      } else {
        setError('Could not retrieve subscription status');
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setError('Unable to check subscription status');
    } finally {
      setLoading(false);
    }
  };

  // Format expiry date if available
  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate days remaining until expiry
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    
    const expiryDate = new Date(dateString);
    const today = new Date();
    
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Get appropriate color and icon based on subscription status
  const getStatusInfo = () => {
    if (!subscription) {
      return {
        color: 'default',
        icon: <WarningIcon />,
        label: 'Unknown'
      };
    }

    if (subscription.active) {
      return {
        color: 'success',
        icon: <CheckCircleIcon />,
        label: subscription.planType ? `${subscription.planType.toUpperCase()} Plan` : 'Active'
      };
    } else {
      return {
        color: 'default',
        icon: <LockOpenIcon />,
        label: 'Free Plan'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const daysRemaining = subscription?.expiresAt ? getDaysRemaining(subscription.expiresAt) : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box mb={3}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
          <Typography variant="subtitle2" gutterBottom>
            Subscription Status
          </Typography>
          <Chip 
            icon={statusInfo.icon} 
            label={statusInfo.label}
            color={statusInfo.color}
            size="medium"
          />
        </Box>
        
        {subscription?.active && subscription?.expiresAt && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Expires: {formatExpiryDate(subscription.expiresAt)}
            </Typography>
            {daysRemaining !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: daysRemaining < 7 ? 'warning.main' : 'text.secondary' }} />
                <Typography 
                  variant="body2" 
                  color={daysRemaining < 7 ? 'warning.main' : 'text.secondary'}
                  fontWeight={daysRemaining < 7 ? 'bold' : 'regular'}
                >
                  {daysRemaining} days remaining
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
      
      {subscription?.active ? (
        <>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Alert severity="success" icon={<StarsIcon />}>
              <Typography variant="body2">
                You have full access to all premium content with your {subscription.planType?.toUpperCase() || 'PRO'} subscription.
              </Typography>
            </Alert>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Link href="/plans" passHref>
              <MuiLink sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">Manage Subscription</Typography>
                <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />
              </MuiLink>
            </Link>
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Upgrade to a premium plan to access all content and features.
              </Typography>
            </Alert>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Link href="/plans" passHref>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                endIcon={<OpenInNewIcon />}
              >
                View Plans
              </Button>
            </Link>
          </Box>
        </>
      )}
      
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default SubscriptionStatus; 