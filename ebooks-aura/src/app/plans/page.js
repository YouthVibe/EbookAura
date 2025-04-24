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

  const initializePage = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch subscription plans
      const plansData = await getSubscriptionPlans();
      if (plansData && plansData.plans) {
        setPlans(plansData.plans);
      } else if (plansData && plansData.data) {
        // Handle potential different response structure
        setPlans(plansData.data);
      }
      
      // Try to fetch current subscription (if any)
      try {
        const subscriptionData = await getCurrentSubscription();
        
        // Check if user has a subscription using the hasSubscription flag
        if (subscriptionData && subscriptionData.hasSubscription && subscriptionData.subscription) {
          setCurrentSubscription(subscriptionData.subscription);
        } else {
          // User doesn't have an active subscription, which is expected for many users
          console.log('No active subscription found');
          setCurrentSubscription(null);
        }
      } catch (err) {
        // Handle any unexpected errors
        console.error('Error fetching subscription:', err);
        // Don't set an error message for users without subscriptions
      }
      
      // Refresh user's coin balance
      const coinsData = await getUserCoins();
      if (coinsData && typeof coinsData.coins === 'number') {
        updateUserCoins(coinsData.coins);
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
      const result = await purchaseSubscription({
        planId: selectedPlan._id,
        paymentMethod: 'coins'
      });
      
      if (result && result.subscription) {
        setCurrentSubscription(result.subscription);
        setSuccess(`Successfully subscribed to ${selectedPlan.name}!`);
        
        // Update user's coin balance
        const coinsData = await getUserCoins();
        if (coinsData && typeof coinsData.coins === 'number') {
          updateUserCoins(coinsData.coins);
        }
        
        // Close modal
        setShowConfirmModal(false);
        
        // Scroll to top to show success message
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      setError(err.message || 'Failed to purchase subscription');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const openConfirmModal = (plan) => {
    if (!isLoggedIn) {
      router.push('/login?redirect=plans');
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
  };

  const formatDuration = (plan) => {
    if (!plan.duration) return '';
    
    const { value, unit } = plan.duration;
    if (value === 1) {
      return `${value} ${unit.slice(0, -1)}`; // Remove 's' from plural unit
    }
    return `${value} ${unit}`;
  };

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
            <p>
              <strong>Auto-Renew:</strong> {currentSubscription.autoRenew ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className={styles.subscriptionActions}>
            <Link href="/settings" className={styles.settingsButton}>
              Manage Subscription
            </Link>
          </div>
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
              className={`${styles.planCard} ${plan.isPopular ? styles.popularPlan : ''}`}
            >
              {plan.isPopular && <div className={styles.popularBadge}>Most Popular</div>}
              
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
                  currentSubscription ? styles.disabledButton : ''
                }`}
                onClick={() => openConfirmModal(plan)}
                disabled={!!currentSubscription}
              >
                {currentSubscription 
                  ? 'Already Subscribed' 
                  : user?.coins < plan.price
                  ? 'Need More Coins'
                  : 'Subscribe Now'}
              </button>
              
              {user?.coins < plan.price && (
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
            <h2>Confirm Subscription</h2>
            <p>You are about to subscribe to <strong>{selectedPlan.name}</strong>.</p>
            <p>This will cost <strong>{selectedPlan.price} coins</strong> from your balance.</p>
            
            <div className={styles.balanceInfo}>
              <p>Current Balance: {user?.coins} coins</p>
              <p>Balance After: {user?.coins - selectedPlan.price} coins</p>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
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