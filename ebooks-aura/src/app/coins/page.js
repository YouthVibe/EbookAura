'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCoins, FaArrowLeft, FaGift, FaClock, FaCalendar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './coins.module.css';
import { 
  getUserCoins, 
  claimDailyCoins, 
  checkDailyCoinsStatus, 
  getSessionStatus, 
  updateSessionTime,
  claimActivityRewardCoins
} from '../api/coins';

export default function CoinsPage() {
  const { user, updateUserCoins } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dailyClaimLoading, setDailyClaimLoading] = useState(false);
  const [activityRewardLoading, setActivityRewardLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dailyClaimError, setDailyClaimError] = useState('');
  const [activityClaimError, setActivityClaimError] = useState('');
  const [nextDailyClaimTime, setNextDailyClaimTime] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [dailyCoinsClaimed, setDailyCoinsClaimed] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({
    sessionTimeToday: 0,
    requiredTime: 60,
    hasClaimedReward: false,
    progress: 0,
    canClaimReward: false,
    nextRewardTime: null,
    minutesAccumulated: 0,
    coinsAvailable: 0
  });
  const [sessionUpdateInterval, setSessionUpdateInterval] = useState(null);

  useEffect(() => {
    // Only run once after component mounts and user is available
    if (!hasInitialized && user) {
      // Fetch initial coins data
      fetchCoinsData();
      setHasInitialized(true);
      
      // Set up session tracking
      setupSessionTracking();
    } else if (!user) {
      // Redirect if not logged in
      router.push('/login');
    }
    
    // Clean up interval on unmount
    return () => {
      if (sessionUpdateInterval) {
        clearInterval(sessionUpdateInterval);
      }
    };
  }, [user, router, hasInitialized]);

  // Set up session tracking to update server every 30 seconds
  const setupSessionTracking = () => {
    // Initial fetch of session status
    fetchSessionStatus();
    
    // Set up interval to update session time (every 30 seconds)
    const intervalId = setInterval(() => {
      // Send an update with 30 seconds (the interval time)
      updateSessionTime(30)
        .then(data => {
          setSessionInfo(prevInfo => ({
            ...prevInfo,
            sessionTimeToday: data.sessionTimeToday,
            canClaimReward: data.canClaimReward,
            progress: Math.floor((data.sessionTimeToday % 60) / 60 * 100),
            minutesAccumulated: data.minutesAccumulated || 0,
            coinsAvailable: data.minutesAccumulated || 0
          }));
        })
        .catch(err => console.error('Error updating session time:', err));
    }, 30000); // 30 seconds
    
    setSessionUpdateInterval(intervalId);
  };

  const fetchSessionStatus = async () => {
    try {
      const sessionData = await getSessionStatus();
      
      if (sessionData) {
        setSessionInfo({
          sessionTimeToday: sessionData.sessionTimeToday || 0,
          requiredTime: sessionData.requiredTime || 60,
          hasClaimedReward: false, // Always allow claiming
          progress: sessionData.progress || 0,
          canClaimReward: sessionData.canClaimReward || false,
          nextRewardTime: null,
          minutesAccumulated: sessionData.minutesAccumulated || 0,
          coinsAvailable: sessionData.coinsAvailable || 0
        });
      }
    } catch (err) {
      console.error('Error fetching session status:', err);
    }
  };

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
      
      // Also fetch session status
      await fetchSessionStatus();
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

  const handleClaimActivityReward = async () => {
    setActivityRewardLoading(true);
    setActivityClaimError('');
    setSuccess('');

    try {
      const result = await claimActivityRewardCoins();
      
      if (result && typeof result.coins === 'number') {
        updateUserCoins(result.coins);
        setSuccess(`Successfully claimed ${result.coinsAdded} coins for ${result.minutesSpent} minute(s) of site activity!`);
        
        // Update session info to reflect claimed reward but don't disable claiming
        setSessionInfo(prevInfo => ({
          ...prevInfo,
          hasClaimedReward: false, // Still allow claiming
          sessionTimeToday: 0,
          progress: 0,
          canClaimReward: false,
          minutesAccumulated: 0,
          coinsAvailable: 0
        }));
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      }
    } catch (err) {
      console.error('Error claiming activity reward:', err);
      setActivityClaimError(err.message || 'Failed to claim activity reward');
      
      // Refresh session status in case of error
      fetchSessionStatus();
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setActivityClaimError('');
      }, 5000);
    } finally {
      setActivityRewardLoading(false);
    }
  };

  // Format the time nicely
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format seconds to minutes:seconds
  const formatTimeSpent = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
            <FaClock className={styles.rewardIcon} />
            <h2 className={styles.rewardTitle}>Time Rewards</h2>
          </div>
          <p className={styles.rewardDescription}>
            Get 1 coin for each minute you spend on our site. Claim anytime!
          </p>
          {activityClaimError && <p className={styles.errorMessage}>{activityClaimError}</p>}
          
          <div className={styles.progressContainer}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${sessionInfo.progress}%` }}
            ></div>
            <span className={styles.progressText}>
              {formatTimeSpent(sessionInfo.sessionTimeToday % 60)} / {formatTimeSpent(60)} to next coin
            </span>
          </div>
          
          <p className={styles.coinsAvailable}>
            <FaCoins className={styles.smallCoinIcon} />
            <span>{sessionInfo.coinsAvailable} coins available to claim</span>
          </p>
          
          <button 
            className={`${styles.activityButton} ${!sessionInfo.canClaimReward ? styles.disabledButton : ''}`}
            onClick={handleClaimActivityReward}
            disabled={activityRewardLoading || !sessionInfo.canClaimReward}
          >
            {activityRewardLoading ? 'Claiming...' : 
             !sessionInfo.canClaimReward ? 'Keep browsing for coins' : 
             `Claim ${sessionInfo.coinsAvailable} Coin${sessionInfo.coinsAvailable !== 1 ? 's' : ''}`}
            <FaClock className={styles.buttonIcon} />
          </button>
        </div>
      </div>
    </div>
  );
} 