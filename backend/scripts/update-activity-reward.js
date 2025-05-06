/**
 * Script to update activity reward from 1 coin to 5 coins per minute
 * Run with: node scripts/update-activity-reward.js
 */
const fs = require('fs');
const path = require('path');

console.log('Updating activity reward from 1 to 5 coins per minute...');

// Path to the coin controller
const controllerPath = path.join(__dirname, '..', 'controllers', 'coinController.js');

try {
  // Check if the file exists
  if (!fs.existsSync(controllerPath)) {
    console.error(`Error: Could not find file at ${controllerPath}`);
    process.exit(1);
  }

  // Read the current file
  let content = fs.readFileSync(controllerPath, 'utf8');
  
  // Create a backup of the original file
  const backupPath = `${controllerPath}.backup-${new Date().toISOString().replace(/:/g, '-')}`;
  fs.writeFileSync(backupPath, content);
  console.log(`Created backup at ${backupPath}`);

  // Update awardActivityCoins function - change comment about coins per minute
  content = content.replace(
    /\/\/ @desc\s+Award coins for time spent on site \(1 coin per minute\)/,
    '// @desc    Award coins for time spent on site (5 coins per minute)'
  );

  // Update the calculation of coins in awardActivityCoins
  content = content.replace(
    /\/\/ Calculate coins to award: 1 coin per minute \(60 seconds\)/,
    '// Calculate coins to award: 5 coins per minute (60 seconds)'
  );
  
  // Update the actual coins calculation
  content = content.replace(
    /const coinsToAward = minutesSpent;/,
    'const coinsToAward = minutesSpent * 5;'
  );

  // Update getSessionStatus function to reflect the change
  content = content.replace(
    /coinsAvailable: minutesAccumulated/,
    'coinsAvailable: minutesAccumulated * 5'
  );

  // Update any response messages that mention the reward amount
  content = content.replace(
    /Activity reward: (\$\{coinsToAward\}) coins awarded for (\$\{minutesSpent\}) minute\(s\) of activity!/,
    'Activity reward: ${coinsToAward} coins awarded for ${minutesSpent} minute(s) of activity!'
  );

  // Write the updated content back to the file
  fs.writeFileSync(controllerPath, content);
  console.log(`Successfully updated ${controllerPath}`);
  console.log('Activity rewards are now set to 5 coins per minute!');

} catch (error) {
  console.error('Error updating activity reward:', error);
  process.exit(1);
} 