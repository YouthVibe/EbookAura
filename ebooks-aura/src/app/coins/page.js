'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCoins, FaArrowLeft, FaGift, FaAd, FaCalendar, FaHistory } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './coins.module.css';
import { getUserCoins, claimDailyCoins, claimAdRewardCoins } from '../api/coins';

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
  const [coinHistory, setCoinHistory] = useState([]);
  const [hasInitialized, setHasInitialized] = useState(false);

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
      const data = await getUserCoins();
      
      if (data && typeof data.coins === 'number') {
        updateUserCoins(data.coins);
      }
      
      // Add mock coin history for now
      setCoinHistory([
        { date: new Date(), amount: 10, type: 'Daily Reward' },
        { date: new Date(Date.now() - 24 * 60 * 60 * 1000), amount: 25, type: 'Ad Reward' },
        { date: new Date(Date.now() - 48 * 60 * 60 * 1000), amount: 10, type: 'Daily Reward' }
      ]);
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
        
        // Add to history
        setCoinHistory(prevHistory => [
          { date: new Date(), amount: result.coinsAdded, type: 'Daily Reward' },
          ...prevHistory
        ]);
      }
    } catch (err) {
      console.error('Error claiming daily coins:', err);
      setDailyClaimError(err.message || 'Failed to claim daily coins');
      
      // Set next claim time if available in error response
      if (err.response && err.response.data && err.response.data.nextReward) {
        setNextDailyClaimTime(new Date(err.response.data.nextReward));
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
        
        // Add to history
        setCoinHistory(prevHistory => [
          { date: new Date(), amount: result.coinsAdded, type: 'Ad Reward' },
          ...prevHistory
        ]);
      }
    } catch (err) {
      console.error('Error claiming ad reward:', err);
      setError(err.message || 'Failed to claim ad reward');
    } finally {
      setAdRewardLoading(false);
    }
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
          {nextDailyClaimTime && (
            <p className={styles.nextClaimTime}>
              Next claim available at: {nextDailyClaimTime.toLocaleTimeString()}
            </p>
          )}
          <button 
            className={styles.claimButton}
            onClick={handleClaimDailyCoins}
            disabled={dailyClaimLoading}
          >
            {dailyClaimLoading ? 'Claiming...' : 'Claim 10 Coins'}
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

      <div className={styles.historySection}>
        <h2 className={styles.historyTitle}>
          <FaHistory /> Coins History
        </h2>
        <div className={styles.historyList}>
          {coinHistory.length > 0 ? (
            coinHistory.map((entry, index) => (
              <div key={index} className={styles.historyItem}>
                <div className={styles.historyDate}>
                  {entry.date.toLocaleDateString()}
                </div>
                <div className={styles.historyType}>{entry.type}</div>
                <div className={styles.historyAmount}>+{entry.amount}</div>
              </div>
            ))
          ) : (
            <p className={styles.emptyHistory}>No coin history available.</p>
          )}
        </div>
      </div>
    </div>
  );
} 