/**
 * Utility to check and fix model file case sensitivity issues
 * This script ensures that all model files exist with the correct casing
 * to prevent "module not found" errors on case-sensitive file systems like Linux
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

// Essential model definitions to create if they don't exist
const MODEL_DEFINITIONS = {
  'Book.js': `const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  pdfUrl: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
  },
  coverPublicId: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  language: {
    type: String,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
});

// Create text index for search functionality
BookSchema.index({ title: 'text', author: 'text', description: 'text', tags: 'text' });

const Book = mongoose.model('Book', BookSchema);

module.exports = Book;`,

  'User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: '',
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, username: this.username },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '30d' }
  );
};

const User = mongoose.model('User', UserSchema);

module.exports = User;`
};

// Critical model files to check for
const CRITICAL_MODEL_FILES = [
  'Book.js',  // Case-sensitive - must be Book.js not book.js
  'User.js',
];

async function ensureDirectoryExists(dir) {
  try {
    const dirStat = await stat(dir).catch(() => null);
    if (!dirStat) {
      await mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

async function prepareModels() {
  try {
    console.log('Checking for model directory and files...');
    
    // Determine backend directory
    const backendDir = process.cwd().includes('backend') 
      ? process.cwd() 
      : path.join(process.cwd(), 'backend');
    
    const modelsDir = path.join(backendDir, 'models');
    
    // Ensure models directory exists
    await ensureDirectoryExists(modelsDir);
    
    // Get list of existing model files
    let existingFiles = [];
    try {
      existingFiles = await readdir(modelsDir);
    } catch (error) {
      console.log(`Could not read models directory: ${error.message}`);
    }
    
    // Check for case issues and create missing files
    for (const modelFile of CRITICAL_MODEL_FILES) {
      const lowerCaseFile = modelFile.toLowerCase();
      
      // Check if the file exists with the correct case
      const fileExists = existingFiles.includes(modelFile);
      const fileExistsWrongCase = !fileExists && existingFiles.some(f => f.toLowerCase() === lowerCaseFile);
      
      if (fileExistsWrongCase) {
        console.log(`Warning: Found model file with incorrect case: '${existingFiles.find(f => f.toLowerCase() === lowerCaseFile)}'.`);
        console.log(`Creating file with correct case: '${modelFile}'...`);
      }
      
      if (!fileExists || fileExistsWrongCase) {
        // If the file doesn't exist with correct case, create it
        try {
          if (MODEL_DEFINITIONS[modelFile]) {
            await writeFile(path.join(modelsDir, modelFile), MODEL_DEFINITIONS[modelFile]);
            console.log(`Created model file: ${modelFile}`);
          } else {
            console.log(`No definition available for ${modelFile}, skipping...`);
          }
        } catch (error) {
          console.error(`Error creating model file ${modelFile}:`, error);
        }
      } else {
        console.log(`✓ ${modelFile} exists with correct case.`);
      }
    }
    
    console.log('Model files preparation complete.');
    return true;
  } catch (error) {
    console.error('Error preparing models:', error);
    return false;
  }
}

// If this file is run directly
if (require.main === module) {
  prepareModels()
    .then(success => {
      if (success) {
        console.log('Model preparation completed successfully.');
      } else {
        console.error('Model preparation failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error during model preparation:', error);
      process.exit(1);
    });
}

module.exports = { prepareModels }; 