#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const SKILLS = {
  cocos: {
    src: 'cocos-team-agent/agent-team.md',
    dest: 'cocos-team-agent.md',
    label: 'Cocos Creator Team Agent'
  },
  unity: {
    src: 'unity-team-agent/agent-team.md',
    dest: 'unity-team-agent.md',
    label: 'Unity Team Agent'
  }
};

const TARGET_DIR = path.join(os.homedir(), '.claude', 'commands');
const PKG_ROOT = path.resolve(__dirname, '..');

function getSelectedSkills(flags) {
  const selected = [];
  if (flags.includes('--unity')) selected.push('unity');
  if (flags.includes('--cocos')) selected.push('cocos');
  if (selected.length === 0) return Object.keys(SKILLS);
  return selected;
}

function ensureTargetDir() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`Created: ${TARGET_DIR}`);
  }
}

function askOverwrite(filePath) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`  "${path.basename(filePath)}" already exists. Overwrite? [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function install(flags) {
  const keys = getSelectedSkills(flags);
  const force = flags.includes('--force');
  ensureTargetDir();

  let installed = 0;
  for (const key of keys) {
    const skill = SKILLS[key];
    const srcPath = path.join(PKG_ROOT, skill.src);
    const destPath = path.join(TARGET_DIR, skill.dest);

    if (!fs.existsSync(srcPath)) {
      console.log(`  [SKIP] ${skill.label} — source not found`);
      continue;
    }

    if (fs.existsSync(destPath) && !force) {
      const overwrite = await askOverwrite(destPath);
      if (!overwrite) {
        console.log(`  [SKIP] ${skill.label}`);
        continue;
      }
    }

    fs.copyFileSync(srcPath, destPath);
    console.log(`  [OK] ${skill.label} → ${skill.dest}`);
    installed++;
  }

  console.log(`\n${installed} skill(s) installed to ${TARGET_DIR}`);
}

function uninstall(flags) {
  const keys = getSelectedSkills(flags);
  let removed = 0;

  for (const key of keys) {
    const skill = SKILLS[key];
    const destPath = path.join(TARGET_DIR, skill.dest);

    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
      console.log(`  [REMOVED] ${skill.label} — ${skill.dest}`);
      removed++;
    } else {
      console.log(`  [SKIP] ${skill.label} — not installed`);
    }
  }

  console.log(`\n${removed} skill(s) removed.`);
}

function list() {
  console.log('Team Agent Skills:\n');
  for (const [key, skill] of Object.entries(SKILLS)) {
    const destPath = path.join(TARGET_DIR, skill.dest);
    const status = fs.existsSync(destPath) ? 'installed' : 'not installed';
    console.log(`  [${key}] ${skill.label} — ${status}`);
  }
  console.log(`\nTarget: ${TARGET_DIR}`);
}

function printUsage() {
  console.log(`
Usage: team-agent <command> [options]

Commands:
  install     Install skills to ~/.claude/commands/
  uninstall   Remove installed skills
  list        Show skill install status

Options:
  --unity     Unity skill only
  --cocos     Cocos Creator skill only
  --force     Overwrite without prompt

Examples:
  npx @jia-lio/team-agent install
  npx @jia-lio/team-agent install --unity
  npx @jia-lio/team-agent install --cocos --force
  npx @jia-lio/team-agent uninstall
  npx @jia-lio/team-agent list
`);
}

const command = process.argv[2];
const flags = process.argv.slice(3);

switch (command) {
  case 'install':
    install(flags);
    break;
  case 'uninstall':
    uninstall(flags);
    break;
  case 'list':
    list();
    break;
  default:
    printUsage();
    break;
}
