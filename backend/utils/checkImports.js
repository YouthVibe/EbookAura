/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
/**
 * Script to check for case-sensitivity issues in imports
 * Run this script before deploying to catch potential issues on case-sensitive file systems
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '..');

// Get list of actual model files
const getModelFiles = () => {
  return fs.readdirSync(path.join(BASE_DIR, 'models'));
};

// Windows-compatible method to find imports without grep
const findImportsWithoutGrep = async () => {
  const imports = [];
  const regex = /require\(['"]\.\.\/models\/([^'"]+)['"]\)/g;
  
  // Function to recursively search directories
  const searchDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules') {
        // Recursively search subdirectories
        searchDirectory(filePath);
      } else if (stat.isFile() && file.endsWith('.js')) {
        // Read JS files and search for imports
        const content = fs.readFileSync(filePath, 'utf8');
        let match;
        
        // Reset regex to search from beginning
        regex.lastIndex = 0;
        
        while ((match = regex.exec(content)) !== null) {
          imports.push({
            model: match[1],
            file: path.relative(BASE_DIR, filePath),
            line: content.substring(0, match.index).split('\n').length // Approximate line number
          });
        }
      }
    }
  };
  
  searchDirectory(BASE_DIR);
  return imports;
};

// Extract model imports from code using grep if available
const findModelImports = () => {
  return new Promise((resolve, reject) => {
    // Use grep to find all require statements for models
    exec('grep -r "require(\'\\.\\.\\/models\\/[^\']*\')" --include="*.js" .', 
      { cwd: BASE_DIR }, 
      (error, stdout, stderr) => {
        // If grep fails (like on Windows), fall back to JS-based search
        if (error) {
          console.log('Grep not available, falling back to JS-based search...');
          return findImportsWithoutGrep().then(resolve).catch(reject);
        }
        
        // Extract model names from import statements
        const regex = /require\(['"]\.\.\/models\/([^'"]+)['"]\)/g;
        const imports = [];
        let match;
        
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (!line) continue;
          
          // Reset regex to search from beginning
          regex.lastIndex = 0;
          
          while ((match = regex.exec(line)) !== null) {
            const [fullPath, file] = line.split(':');
            imports.push({
              model: match[1],
              file: path.relative(BASE_DIR, fullPath),
              line: file
            });
          }
        }
        
        resolve(imports);
      }
    );
  });
};

const checkModelImports = async () => {
  try {
    console.log('Checking for case-sensitivity issues in model imports...');
    
    // Get actual model files
    const modelFiles = getModelFiles();
    const modelFileMap = modelFiles.reduce((map, filename) => {
      // Store filename without extension for comparison
      map[path.basename(filename, '.js')] = filename;
      return map;
    }, {});
    
    // Find all model imports
    const imports = await findModelImports();
    
    // Check for case-sensitivity issues
    const issues = [];
    
    for (const imp of imports) {
      const modelName = imp.model;
      const modelFilename = modelFileMap[modelName];
      
      // No exact match found
      if (!modelFilename) {
        // Check for case-insensitive match
        const caseInsensitiveMatch = Object.keys(modelFileMap).find(
          key => key.toLowerCase() === modelName.toLowerCase()
        );
        
        if (caseInsensitiveMatch) {
          issues.push({
            import: modelName,
            actual: caseInsensitiveMatch,
            file: imp.file,
            line: imp.line
          });
        } else {
          issues.push({
            import: modelName,
            actual: 'Not found',
            file: imp.file,
            line: imp.line
          });
        }
      }
    }
    
    // Report results
    if (issues.length === 0) {
      console.log('✅ No case-sensitivity issues found in model imports.');
    } else {
      console.log('❌ Found case-sensitivity issues in model imports:');
      console.log('----------------------------------------------------');
      
      issues.forEach(issue => {
        console.log(`File: ${issue.file}:${issue.line}`);
        console.log(`Imports: '../models/${issue.import}'`);
        console.log(`Actual file: ${issue.actual === 'Not found' ? 'Not found' : issue.actual}`);
        console.log('----------------------------------------------------');
      });
      
      console.log(`Total issues: ${issues.length}`);
    }
  } catch (error) {
    console.error('Error checking imports:', error);
  }
};

// Run the check
checkModelImports(); 