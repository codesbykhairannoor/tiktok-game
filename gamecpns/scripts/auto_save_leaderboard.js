const { execSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'save_live_leaderboard.js');

console.log('[AUTO-SAVER] Memulai auto-save leaderboard tiap 20 detik...');

function trigger() {
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'ignore' });
  } catch (e) {
    // ignore
  }
}

// Jalankan sekali di awal
trigger();

// Ulangi tiap 20 detik
setInterval(trigger, 20000);

