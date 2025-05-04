/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Pre-deployment check script
 * Run this before deploying to Render or other Linux-based environments
 * to catch common deployment issues
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

console.log('🔍 Running pre-deployment checks...');

// 1. Check for case sensitivity issues in imports
console.log('\n📋 Checking for case sensitivity issues...');
require('./checkImports');

// 2. Check for proper model exports
console.log('\n📋 Checking model exports...');
const modelsDir = path.join(__dirname, '../models');
const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

const modelExports = [];
for (const file of modelFiles) {
  try {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the model is properly exported
    const directExport = content.includes('module.exports = mongoose.model(');
    const variableExport = content.includes('module.exports = ') && 
                          content.includes('mongoose.model(') && 
                          !directExport;
    
    modelExports.push({
      file,
      directExport,
      variableExport,
      proper: variableExport // We prefer variable export
    });
  } catch (error) {
    console.error(`Error reading model file ${file}:`, error);
  }
}

// Report model export issues
const improperExports = modelExports.filter(model => !model.proper);
if (improperExports.length > 0) {
  console.log('⚠️ Some models are not using the recommended export pattern:');
  improperExports.forEach(model => {
    console.log(`  - ${model.file}: Using direct export instead of variable export`);
  });
  console.log('\nRecommended pattern:');
  console.log('  const ModelName = mongoose.model(\'ModelName\', modelSchema);');
  console.log('  module.exports = ModelName;');
} else {
  console.log('✅ All models are using the proper export pattern');
}

// 3. Check for proper error handling in controllers
console.log('\n📋 Checking controller error handling...');
const controllersDir = path.join(__dirname, '../controllers');
const controllerFiles = fs.readdirSync(controllersDir).filter(file => file.endsWith('.js'));

const controllerChecks = [];
for (const file of controllerFiles) {
  try {
    const filePath = path.join(controllersDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const hasTryCatch = content.includes('try {') && content.includes('catch (');
    const hasErrorLogging = content.includes('console.error(');
    
    controllerChecks.push({
      file,
      hasTryCatch,
      hasErrorLogging,
      proper: hasTryCatch && hasErrorLogging
    });
  } catch (error) {
    console.error(`Error reading controller file ${file}:`, error);
  }
}

// Report controller error handling issues
const improperControllers = controllerChecks.filter(controller => !controller.proper);
if (improperControllers.length > 0) {
  console.log('⚠️ Some controllers may have improper error handling:');
  improperControllers.forEach(controller => {
    const issues = [];
    if (!controller.hasTryCatch) issues.push('Missing try-catch blocks');
    if (!controller.hasErrorLogging) issues.push('Missing error logging');
    
    console.log(`  - ${controller.file}: ${issues.join(', ')}`);
  });
} else {
  console.log('✅ All controllers have proper error handling');
}

// 4. Verify that required environment variables are set
console.log('\n📋 Checking environment variables...');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.log('⚠️ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  console.log('\nMake sure these are configured in your Render dashboard!');
} else {
  console.log('✅ All required environment variables are set');
}

console.log('\n🏁 Pre-deployment checks complete!'); 