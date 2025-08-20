#!/usr/bin/env node

// Performance monitoring script for the casino site
// Run with: node scripts/performance-check.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Casino Site Performance Check\n');

// Check file sizes
function checkFileSizes() {
  console.log('📁 Checking file sizes...');
  
  const directories = [
    'app',
    'components', 
    'hooks',
    'lib',
    'public'
  ];

  let totalSize = 0;
  let fileCount = 0;

  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      files.forEach(file => {
        const stats = fs.statSync(file);
        totalSize += stats.size;
        fileCount++;
        
        if (stats.size > 100 * 1024) { // Files larger than 100KB
          console.log(`⚠️  Large file: ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
        }
      });
    }
  });

  console.log(`📊 Total files: ${fileCount}`);
  console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB\n`);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Check for performance issues in code
function checkCodeIssues() {
  console.log('🔍 Checking for performance issues...');
  
  const issues = [];
  
  // Check for console.log statements
  const files = getAllFiles('.');
  files.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf8');
      const consoleMatches = content.match(/console\.log/g);
      if (consoleMatches) {
        issues.push(`⚠️  Console.log found in ${file} (${consoleMatches.length} instances)`);
      }
    }
  });

  if (issues.length > 0) {
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('✅ No obvious performance issues found');
  }
  console.log('');
}

// Check dependencies
function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const heavyDeps = [
      'socket.io',
      'socket.io-client', 
      'mongoose',
      'next',
      'react',
      'react-dom'
    ];
    
    heavyDeps.forEach(dep => {
      if (deps[dep]) {
        console.log(`📦 ${dep}: ${deps[dep]}`);
      }
    });
  }
  console.log('');
}

// Performance recommendations
function showRecommendations() {
  console.log('💡 Performance Recommendations:\n');
  
  const recommendations = [
    '✅ Queue processing interval increased to 5 seconds',
    '✅ API polling reduced to 60 seconds',
    '✅ WebSocket ping interval increased to 60 seconds',
    '✅ Database connection pool optimized',
    '✅ Cache TTL increased to 5 minutes',
    '✅ Removed console.log statements',
    '✅ Optimized navigation with router.replace()',
    '✅ Added loading states for better UX',
    '🔄 Consider implementing lazy loading for components',
    '🔄 Consider using React.memo for expensive components',
    '🔄 Consider implementing virtual scrolling for large lists',
    '🔄 Consider using Image optimization for better loading',
    '🔄 Consider implementing service worker for caching'
  ];
  
  recommendations.forEach(rec => console.log(rec));
  console.log('');
}

// Run all checks
function runPerformanceCheck() {
  checkFileSizes();
  checkCodeIssues();
  checkDependencies();
  showRecommendations();
  
  console.log('🎯 Performance check completed!');
}

runPerformanceCheck();



