'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCoins, FaArrowLeft, FaGift, FaAd, FaCalendar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './coins.module.css';
import { getUserCoins, claimDailyCoins, claimAdRewardCoins, checkDailyCoinsStatus } from '../api/coins';

export default function CoinsPage() {
  const { user, updateUserCoins } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dailyClaimLoading, setDailyClaimLoading] = useState(false);
  const [adRewardLoading, setAdRewardLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dailyClaimError, setDailyClaimError] = useState('');
  const [nextDailyClaimTime, setNextDailyClaimTime] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [dailyCoinsClaimed, setDailyCoinsClaimed] = useState(false);

  useEffect(() => {
    // Only run once after component mounts and user is available
    if (!hasInitialized && user) {
      // Fetch initial coins data
      fetchCoinsData();
      setHasInitialized(true);
    } else if (!user) {
      // Redirect if not logged in
      router.push('/login');
    }
  }, [user, router, hasInitialized]);

  const fetchCoinsData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch coins balance
      const data = await getUserCoins();
      
      if (data && typeof data.coins === 'number') {
        updateUserCoins(data.coins);
      }

      // Check daily coins status
      const statusData = await checkDailyCoinsStatus();
      
      if (statusData) {
        setDailyCoinsClaimed(statusData.hasClaimed);
        
        if (statusData.hasClaimed && statusData.nextRewardTime) {
          setNextDailyClaimTime(new Date(statusData.nextRewardTime));
        } else {
          setNextDailyClaimTime(null);
        }
      }
    } catch (err) {
      console.error('Error fetching coins data:', err);
      setError(err.message || 'Failed to fetch coins data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDailyCoins = async () => {
    setDailyClaimLoading(true);
    setDailyClaimError('');
    setSuccess('');

    try {
      const result = await claimDailyCoins();
      
      if (result && typeof result.coins === 'number') {
        updateUserCoins(result.coins);
        setSuccess(`Successfully claimed ${result.coinsAdded} daily coins!`);
        
        // Update state to reflect that daily coins have been claimed
        setDailyCoinsClaimed(true);
        
        // Set next claim time to 24 hours from now
        const nextReward = new Date();
        nextReward.setHours(24, 0, 0, 0);
        setNextDailyClaimTime(nextReward);
      }
    } catch (err) {
      console.error('Error claiming daily coins:', err);
      setDailyClaimError(err.message || 'Failed to claim daily coins');
      
      // Set next claim time if available in error response
      if (err.response && err.response.data && err.response.data.nextReward) {
        setNextDailyClaimTime(new Date(err.response.data.nextReward));
        setDailyCoinsClaimed(true);
      }
    } finally {
      setDailyClaimLoading(false);
    }
  };

  const handleWatchAd = async () => {
    setAdRewardLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate ad loading and watching
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After "watching" the ad, claim the reward
      const result = await claimAdRewardCoins();
      
      if (result && typeof result.coins === 'number') {
        updateUserCoins(result.coins);
        setSuccess(`Successfully claimed ${result.coinsAdded} coins for watching an ad!`);
      }
    } catch (err) {
      console.error('Error claiming ad reward:', err);
      setError(err.message || 'Failed to claim ad reward');
    } finally {
      setAdRewardLoading(false);
    }
  };

  // Format the time nicely
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            <FaArrowLeft />
          </Link>
          <h1 className={styles.title}>My Coins</h1>
        </div>
        <div className={styles.loading}>Loading coins data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <FaArrowLeft />
        </Link>
        <h1 className={styles.title}>My Coins</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.coinsBalance}>
        <FaCoins className={styles.coinIcon} />
        <span className={styles.coinCount}>{user?.coins || 0}</span>
        <span className={styles.coinLabel}>coins</span>
      </div>

      <div className={styles.actionsContainer}>
        <div className={styles.rewardCard}>
          <div className={styles.rewardHeader}>
            <FaCalendar className={styles.rewardIcon} />
            <h2 className={styles.rewardTitle}>Daily Reward</h2>
          </div>
          <p className={styles.rewardDescription}>
            Claim your daily reward of 10 coins. Come back every day!
          </p>
          {dailyClaimError && <p className={styles.errorMessage}>{dailyClaimError}</p>}
          {dailyCoinsClaimed && nextDailyClaimTime && (
            <p className={styles.nextClaimTime}>
              Next claim available at: {formatTime(nextDailyClaimTime)}
            </p>
          )}
          <button 
            className={`${styles.claimButton} ${dailyCoinsClaimed ? styles.disabledButton : ''}`}
            onClick={handleClaimDailyCoins}
            disabled={dailyClaimLoading || dailyCoinsClaimed}
          >
            {dailyClaimLoading ? 'Claiming...' : dailyCoinsClaimed ? 'Already Claimed Today' : 'Claim 10 Coins'}
            <FaGift className={styles.buttonIcon} />
          </button>
        </div>

        <div className={styles.rewardCard}>
          <div className={styles.rewardHeader}>
            <FaAd className={styles.rewardIcon} />
            <h2 className={styles.rewardTitle}>Watch Ad</h2>
          </div>
          <p className={styles.rewardDescription}>
            Watch an advertisement to earn 25 coins. You can watch multiple ads per day.
          </p>
          <button 
            className={styles.adButton}
            onClick={handleWatchAd}
            disabled={adRewardLoading}
          >
            {adRewardLoading ? 'Loading Ad...' : 'Watch Ad & Earn 25 Coins'}
            <FaAd className={styles.buttonIcon} />
          </button>
        </div>
      </div>
    </div>
  );
} 