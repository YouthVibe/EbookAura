# EbookAura Static Build PowerShell Script
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "EbookAura Static Site Generator - PowerShell Edition" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Ensure we're in the right directory
Set-Location -Path $PSScriptRoot

# Step 1: Create critical book IDs file
Write-Host "Step 1: Creating critical IDs file for static generation..." -ForegroundColor Green
Write-Host ""

# Create directory if it doesn't exist
if (-not (Test-Path "src\app\utils")) {
    New-Item -Path "src\app\utils" -ItemType Directory -Force | Out-Null
    Write-Host "Created src\app\utils directory" -ForegroundColor Yellow
}

# Get current timestamp
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"

# Create the STATIC_BOOKS.js file with all critical IDs
$staticBooksContent = @"
/**
 * Static book IDs for EbookAura static generation
 * Generated on: $timestamp
 *
 * These IDs must be included in the static site generation
 */

const STATIC_BOOKS = [
  // Critical book IDs - ALWAYS include these
  '681859bd560ce1fd792c2745',  // Previously problematic ID - must be included
  '6807c9d24fb1873f72080fb1',  // Critical book ID
  '6807be6cf05cdd8f4bdf933c',  // Critical book ID
  '6803d0c8cd7950184b1e8cf3',  // Critical book ID
  '680735665ceba10744914991',  // Additional critical ID from logs
];

export default STATIC_BOOKS;
"@

Set-Content -Path "src\app\utils\STATIC_BOOKS.js" -Value $staticBooksContent

Write-Host "STATIC_BOOKS.js created successfully with the following critical IDs:" -ForegroundColor Green
Write-Host "- 681859bd560ce1fd792c2745 (previously problematic ID)" -ForegroundColor Yellow
Write-Host "- 6807c9d24fb1873f72080fb1" -ForegroundColor Yellow
Write-Host "- 6807be6cf05cdd8f4bdf933c" -ForegroundColor Yellow
Write-Host "- 6803d0c8cd7950184b1e8cf3" -ForegroundColor Yellow
Write-Host "- 680735665ceba10744914991" -ForegroundColor Yellow
Write-Host ""

# Step 2: Set up environment variables for static build
Write-Host "Step 2: Setting up environment variables for static export..." -ForegroundColor Green
Write-Host ""

# Create .env.local file with required variables
$envContent = @"
NEXT_PUBLIC_API_URL=https://ebookaura.onrender.com/api
STATIC_EXPORT=true
"@

Set-Content -Path ".env.local" -Value $envContent
Write-Host "Environment variables set up in .env.local" -ForegroundColor Green
Write-Host ""

# Step 3: Clean output directories to ensure a fresh build
Write-Host "Step 3: Cleaning previous build directories..." -ForegroundColor Green
Write-Host ""

if (Test-Path ".next") {
    Write-Host "Cleaning .next directory..."
    Remove-Item -Path ".next" -Recurse -Force
}

if (Test-Path "out") {
    Write-Host "Cleaning out directory..."
    Remove-Item -Path "out" -Recurse -Force
}

Write-Host "Build directories cleaned successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Run the build with correct environment variables
Write-Host "Step 4: Building static site..." -ForegroundColor Green
Write-Host ""

# Set environment variables for the PowerShell session
$env:STATIC_EXPORT = "true"
$env:NODE_ENV = "production"

# Run the build
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed! Check the error messages above." -ForegroundColor Red
    exit 1
}

# Step 5: Verify the output directory
Write-Host ""
Write-Host "Step 5: Verifying static build output..." -ForegroundColor Green
Write-Host ""

$criticalIds = @(
    "681859bd560ce1fd792c2745",
    "6807c9d24fb1873f72080fb1",
    "6807be6cf05cdd8f4bdf933c",
    "6803d0c8cd7950184b1e8cf3",
    "680735665ceba10744914991"
)

$allFound = $true

foreach ($id in $criticalIds) {
    if (Test-Path "out\books\$id") {
        Write-Host "✓ Found book directory for ID: $id" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing book directory for ID: $id" -ForegroundColor Red
        $allFound = $false
    }
}

if ($allFound) {
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "Static site generation completed successfully!" -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The static site has been generated in the 'out' directory."
    Write-Host "All critical book IDs are included in the build."
    Write-Host ""
    Write-Host "You can deploy these files to any static hosting service."
} else {
    Write-Host ""
    Write-Host "Warning: Some critical book directories were not created." -ForegroundColor Yellow
    Write-Host "This might be due to API errors during the build process." -ForegroundColor Yellow
    Write-Host "The static site is still usable but may be missing some book pages." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 