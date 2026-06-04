#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '..');
const HOME = process.env.HOME || process.env.USERPROFILE;
const SKILLS_DIR = path.join(HOME, '.agents', 'skills');
const TARGET_DIR = path.join(SKILLS_DIR, 'stagehand-browser-automation');

const FILES_TO_COPY = [
  'SKILL.md',
  'README.md',
  'LICENSE',
  '.gitignore',
];

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

function main() {
  console.log('📦 Installing stagehand-browser-automation skill...\n');

  // Ensure ~/.agents/skills exists
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log(`Creating skills directory: ${SKILLS_DIR}`);
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }

  // Create or clear target directory
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // Copy files
  for (const file of FILES_TO_COPY) {
    const src = path.join(SOURCE_DIR, file);
    const dest = path.join(TARGET_DIR, file);
    if (fs.existsSync(src)) {
      copyFile(src, dest);
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} not found, skipping`);
    }
  }

  console.log(`\n✅ Skill installed to: ${TARGET_DIR}`);
  console.log('\nRestart your AI agent session to load the skill.');
}

main();
