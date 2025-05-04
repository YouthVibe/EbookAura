'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCoins, FaArrowLeft, FaCrown, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './plans.module.css';
import { getUserCoins } from '../api/coins';
import { getSubscriptionPlans, getCurrentSubscription, purchaseSubscription } from '../api/subscriptions';

export default function PlansPage() {
  const { user, updateUserCoins, isLoggedIn } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const initializePage = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch subscription plans
      const plansData = await getSubscriptionPlans();
      if (plansData && plansData.plans) {
        setPlans(plansData.plans);
        console.log(`Loaded ${plansData.plans.length} subscription plans`);
      } else if (plansData && plansData.data) {
        // Handle potential different response structure
        setPlans(plansData.data);
        console.log(`Loaded ${plansData.data.length} subscription plans (alt format)`);
      }
      
      // Try to fetch current subscription (if any)
      try {
        console.log('Checking current subscription status...');
        const subscriptionData = await getCurrentSubscription();
        console.log('Subscription check response:', subscriptionData);
        
        // Check if user has a subscription using the hasSubscription flag
        // Check multiple potential response formats
        const hasActiveSubscription = 
          (subscriptionData && subscriptionData.hasSubscription === true) || 
          (subscriptionData && subscriptionData.active === true);
        
        if (hasActiveSubscription && subscriptionData.subscription) {
          setCurrentSubscription(subscriptionData.subscription);
          setHasActiveSubscription(true);
          console.log('Active subscription found:', subscriptionData.subscription);
        } else if (hasActiveSubscription) {
          // For cases where we just get a flag without full subscription details
          setHasActiveSubscription(true);
          console.log('User has an active subscription (basic details only)');
        } else {
          // User doesn't have an active subscription, which is expected for many users
          console.log('No active subscription found');
          setHasActiveSubscription(false);
          
          // If the subscription was expired, show a message
          if (subscriptionData && subscriptionData.wasExpired) {
            setError('Your subscription has expired. Please renew to continue enjoying premium benefits.');
          }
          
          setCurrentSubscription(null);
        }
      } catch (err) {
        // Handle any unexpected errors
        console.error('Error fetching subscription:', err);
        // Don't set an error message for users without subscriptions
        setHasActiveSubscription(false);
      }
      
      // Refresh user's coin balance
      try {
        const coinsData = await getUserCoins();
        if (coinsData && typeof coinsData.coins === 'number') {
          updateUserCoins(coinsData.coins);
          console.log(`User has ${coinsData.coins} coins`);
        }
      } catch (coinErr) {
        console.error('Error fetching coin balance:', coinErr);
      }
    } catch (err) {
      console.error('Error initializing plans page:', err);
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  // Run the initialization only once when the component mounts
  // or when the user logs in/out
  useEffect(() => {
    // Only initialize if the user is logged in
    if (isLoggedIn) {
      initializePage();
    } else {
      router.push('/login?redirect=plans');
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, router]); // Remove updateUserCoins from the dependency array

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    
    setPurchaseLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log(`Attempting to purchase plan: ${selectedPlan.name}`);
      
      const purchaseData = {
        planId: selectedPlan._id,
        paymentMethod: 'coins'
      };
      
      console.log('Purchase data:', purchaseData);
      
      const result = await purchaseSubscription(purchaseData);
      
      console.log('Purchase result:', result);
      
      if (result && result.success && result.subscription) {
        setCurrentSubscription(result.subscription);
        setHasActiveSubscription(true);
        setSuccess(`Successfully subscribed to ${selectedPlan.name}!`);
        
        // Update user's coin balance
        try {
          const coinsData = await getUserCoins();
          if (coinsData && typeof coinsData.coins === 'number') {
            updateUserCoins(coinsData.coins);
            console.log(`Updated user coins to: ${coinsData.coins}`);
          }
        } catch (coinErr) {
          console.error('Error updating coin balance after purchase:', coinErr);
        }
        
        // Close modal
        setShowConfirmModal(false);
        // Restore body scrolling
        document.body.style.overflow = '';
        
        // Scroll to top to show success message
        window.scrollTo(0, 0);
      } else {
        // Handle unexpected success response format
        throw new Error('Unexpected response format from subscription purchase');
      }
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      
      // Provide more specific error messages based on common error cases
      if (err.message.includes('enough coins')) {
        setError(`You don't have enough coins to purchase this plan. Please get more coins and try again.`);
      } else if (err.message.includes('already has an active subscription')) {
        setError('You already have an active subscription. Only one subscription can be active at a time.');
        setHasActiveSubscription(true);
      } else {
        setError(err.message || 'Failed to purchase subscription. Please try again later.');
      }
      
      // Close modal on error to show the error message
      setShowConfirmModal(false);
      document.body.style.overflow = '';
      window.scrollTo(0, 0);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const openConfirmModal = (plan) => {
    if (!isLoggedIn) {
      router.push('/login?redirect=plans');
      return;
    }
    
    // Prevent purchase if user already has an active subscription
    if (hasActiveSubscription) {
      setError('You already have an active subscription. Only one subscription can be active at a time.');
      window.scrollTo(0, 0);
      return;
    }
    
    // Check if user has enough coins
    if (user?.coins < plan.price) {
      setError(`You don't have enough coins to purchase this plan. You need ${plan.price - user.coins} more coins.`);
      window.scrollTo(0, 0);
      return;
    }
    
    setSelectedPlan(plan);
    setShowConfirmModal(true);
    
    // Ensure proper scroll position for the modal, especially on Android
    setTimeout(() => {
      window.scrollTo(0, 0);
      // Force body to be non-scrollable when modal is open
      document.body.style.overflow = 'hidden';
    }, 10);
  };

  const formatDuration = (plan) => {
    if (!plan.duration) return '';
    
    const { value, unit } = plan.duration;
    if (value === 1) {
      return `${value} ${unit.slice(0, -1)}`; // Remove 's' from plural unit
    }
    return `${value} ${unit}`;
  };

  // Add this function to handle modal closing properly
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    // Restore body scrolling
    document.body.style.overflow = '';
  };

  // Function to check if a plan matches the current subscription
  const isActivePlan = (plan) => {
    if (!currentSubscription || !currentSubscription.plan) {
      // Also check hasActiveSubscription state for cases where we only have subscription status but not details
      if (hasActiveSubscription) {
        console.log('Using hasActiveSubscription state to determine active plan (no full subscription details available)');
      }
      return false;
    }
    
    console.log('Checking if plan matches current subscription:', { 
      planId: plan._id, 
      subscriptionPlan: currentSubscription.plan
    });
    
    // Check if the plan ID matches the current subscription's plan ID
    const currentPlanId = typeof currentSubscription.plan === 'object' 
      ? currentSubscription.plan._id 
      : currentSubscription.plan;
    
    const isActive = currentPlanId === plan._id;
    if (isActive) {
      console.log(`Plan "${plan.name}" is the active subscription`);
    }
    return isActive;
  };

  // Add an effect to re-fetch subscription status when user navigates to the page
  useEffect(() => {
    // When component mounts and user is logged in
    const checkSubscriptionStatus = async () => {
      if (isLoggedIn) {
        try {
          console.log('Checking subscription status on mount/navigation...');
          const subscriptionData = await getCurrentSubscription();
          
          // Set hasActiveSubscription based on response
          const isActive = 
            subscriptionData.hasSubscription === true || 
            subscriptionData.active === true;
          
          console.log('Subscription status check result:', { 
            isActive, 
            response: subscriptionData 
          });
          
          setHasActiveSubscription(isActive);
          
          if (isActive && subscriptionData.subscription) {
            setCurrentSubscription(subscriptionData.subscription);
          }
        } catch (err) {
          console.error('Error checking subscription status on mount:', err);
        }
      }
    };
    
    checkSubscriptionStatus();
  }, [isLoggedIn]); // Only re-run when login status changes

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            <FaArrowLeft />
          </Link>
          <h1 className={styles.title}>Subscription Plans</h1>
        </div>
        <div className={styles.loading}>Loading plans...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <FaArrowLeft />
        </Link>
        <h1 className={styles.title}>Subscription Plans</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {currentSubscription && (
        <div className={styles.currentSubscription}>
          <div className={styles.subscriptionHeader}>
            <FaCrown className={styles.crownIcon} />
            <h2>Your Current Subscription</h2>
          </div>
          <div className={styles.subscriptionDetails}>
            <p>
              <strong>Plan:</strong> {currentSubscription.plan?.name || 'Premium Plan'}
            </p>
            <p>
              <strong>Status:</strong> {currentSubscription.status}
            </p>
            <p>
              <strong>Active Until:</strong> {new Date(currentSubscription.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className={styles.subscriptionActions}>
            <p className={styles.nonCancelableNotice}>
              <FaInfoCircle className={styles.infoIcon} /> Subscriptions are non-refundable and cannot be canceled once purchased.
            </p>
          </div>
        </div>
      )}

      {/* Message about one subscription at a time when user has active subscription */}
      {hasActiveSubscription && (
        <div className={styles.subscriptionNote}>
          <FaInfoCircle className={styles.infoIcon} />
          <p>You already have an active subscription. Only one subscription can be active at a time.</p>
        </div>
      )}

      <div className={styles.coinsBalance}>
        <FaCoins className={styles.coinIcon} />
        <span className={styles.coinCount}>{user?.coins || 0}</span>
        <span className={styles.coinLabel}>coins</span>
        <Link href="/coins" className={styles.getCoinsButton}>
          Get More Coins
        </Link>
      </div>

      <div className={styles.plansContainer}>
        {plans.length > 0 ? (
          plans.map((plan) => (
            <div 
              key={plan._id} 
              className={`${styles.planCard} ${plan.isPopular ? styles.popularPlan : ''} ${isActivePlan(plan) ? styles.activePlan : ''}`}
            >
              {plan.isPopular && <div className={styles.popularBadge}>Most Popular</div>}
              {isActivePlan(plan) && <div className={styles.activePlanBadge}>Your Active Plan</div>}
              
              <h2 className={styles.planName}>{plan.name}</h2>
              <p className={styles.planDescription}>{plan.description}</p>
              
              <div className={styles.planPrice}>
                <FaCoins className={styles.planCoinIcon} />
                <span className={styles.priceValue}>{plan.price}</span>
                <span className={styles.pricePeriod}>
                  for {formatDuration(plan)}
                </span>
              </div>
              
              <ul className={styles.featuresList}>
                {plan.features?.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <FaCheck className={styles.checkIcon} />
                    {feature}
                  </li>
                ))}
                
                {/* Benefits */}
                {plan.benefits?.maxPremiumBooks > 0 && (
                  <li className={styles.featureItem}>
                    <FaCheck className={styles.checkIcon} />
                    {plan.benefits.maxPremiumBooks === Infinity 
                      ? 'Unlimited premium books' 
                      : `${plan.benefits.maxPremiumBooks} premium books/month`}
                  </li>
                )}
                
                {plan.benefits?.offlineReading && (
                  <li className={styles.featureItem}>
                    <FaCheck className={styles.checkIcon} />
                    Offline reading
                  </li>
                )}
                
                {plan.benefits?.adFree && (
                  <li className={styles.featureItem}>
                    <FaCheck className={styles.checkIcon} />
                    Ad-free experience
                  </li>
                )}
                
                {plan.benefits?.earlyAccess && (
                  <li className={styles.featureItem}>
                    <FaCheck className={styles.checkIcon} />
                    Early access to new releases
                  </li>
                )}
                
                {plan.benefits?.exclusiveContent && (
                  <li className={styles.featureItem}>
                    <FaCheck className={styles.checkIcon} />
                    Exclusive content
                  </li>
                )}
              </ul>
              
              <button 
                className={`${styles.subscribeButton} ${
                  hasActiveSubscription ? styles.disabledButton : ''
                } ${isActivePlan(plan) ? styles.activePlanButton : ''}`}
                onClick={() => openConfirmModal(plan)}
                disabled={hasActiveSubscription}
              >
                {isActivePlan(plan) 
                  ? 'Current Plan' 
                  : hasActiveSubscription
                  ? 'Subscription Active'
                  : user?.coins < plan.price
                  ? 'Need More Coins'
                  : 'Subscribe Now'}
              </button>
              
              {!hasActiveSubscription && user?.coins < plan.price && (
                <p className={styles.insufficientCoins}>
                  You need {plan.price - user.coins} more coins
                </p>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noPlans}>
            <FaInfoCircle className={styles.infoIcon} />
            <p>No subscription plans are currently available.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlan && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Confirm Subscription</h2>
              <button 
                className={styles.closeModalButton}
                onClick={closeConfirmModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p>You are about to subscribe to <strong>{selectedPlan.name}</strong>.</p>
              <p>This will cost <strong>{selectedPlan.price} coins</strong> from your balance.</p>
              
              <div className={styles.balanceInfo}>
                <div className={styles.balanceRow}>
                  <span>Current Balance:</span>
                  <strong>{user?.coins} coins</strong>
                </div>
                <div className={styles.balanceRow}>
                  <span>Balance After:</span>
                  <strong>{user?.coins - selectedPlan.price} coins</strong>
                </div>
              </div>
              
              <div className={styles.nonRefundableWarning}>
                <div className={styles.warningHeader}>
                  <FaInfoCircle className={styles.warningIcon} />
                  <p>Important Information</p>
                </div>
                <p>By purchasing this subscription, you acknowledge that:</p>
                <ul>
                  <li>Subscriptions are <strong>non-refundable</strong></li>
                  <li>Subscriptions <strong>cannot be canceled</strong> once purchased</li>
                  <li>Your subscription will be active until the end date</li>
                </ul>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={closeConfirmModal}
                disabled={purchaseLoading}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handlePurchase}
                disabled={purchaseLoading}
              >
                {purchaseLoading ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 