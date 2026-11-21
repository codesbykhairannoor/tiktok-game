const fs = require('fs');
const path = require('path');

const logPath = 'C:/Users/Axioo/.gemini/antigravity/brain/8bce5d7a-c8ae-460a-8742-2c615c1da299/.system_generated/tasks/task-2475.log';
const outJson = path.join(__dirname, '..', 'public', 'live_top_scorers.json');
const outTxt = path.join(__dirname, '..', 'public', 'live_top_scorers.txt');
const outHtml = path.join(__dirname, '..', 'public', 'leaderboard-card.html');

function parseLog() {
  if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath);
    return null;
  }

  const raw = fs.readFileSync(logPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const userStats = {};
  let currentKey = null;
  let currentRoundVotes = {};
  let currentQuestionNum = 0;
  let totalRoundsPlayed = 0;

  lines.forEach(l => {
    const startM = l.match(/\[GAME\]\s+🚀\s+Soal\s+#(\d+)\s+Dimulai.+Kunci:\s+\[\s*([A-E])\s*\]/);
    if (startM) {
      currentQuestionNum = parseInt(startM[1], 10);
      currentKey = startM[2];
      currentRoundVotes = {};
      return;
    }

    const voteM = l.match(/\[VOTE DETECTED\]\s+.*@(.+?)\s+menjawab pilihan\s+\[\s*([A-E])\s*\]/);
    if (voteM) {
      const user = voteM[1].trim();
      const opt = voteM[2].trim();
      currentRoundVotes[user] = opt;
      return;
    }

    const endM = l.match(/\[GAME\]\s+🏁\s+Ronde Selesai!\s+Kunci:\s+\[\s*([A-E])\s*\]/);
    if (endM) {
      totalRoundsPlayed++;
      const key = endM[1];
      Object.entries(currentRoundVotes).forEach(([user, opt]) => {
        if (!userStats[user]) {
          userStats[user] = { user, totalAnswered: 0, correct: 0, wrong: 0, points: 0 };
        }
        userStats[user].totalAnswered++;
        if (opt.toUpperCase() === key.toUpperCase()) {
          userStats[user].correct++;
        } else {
          userStats[user].wrong++;
        }
      });
      currentRoundVotes = {};
      return;
    }

    const lbM = l.match(/\[LEADERBOARD\]\s+(.+)$/);
    if (lbM) {
      const parts = lbM[1].split(' | ');
      parts.forEach(p => {
        const uMatch = p.match(/@(.+?):\s+(\d+)\s+pts/);
        if (uMatch) {
          const user = uMatch[1].trim();
          const pts = parseInt(uMatch[2], 10);
          if (!userStats[user]) {
            userStats[user] = { user, totalAnswered: 0, correct: 0, wrong: 0, points: 0 };
          }
          userStats[user].points = pts;
        }
      });
    }
  });

  const sorted = Object.values(userStats)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.correct - a.correct;
    })
    .map((item, idx) => ({
      rank: idx + 1,
      user: item.user,
      points: item.points,
      correct: item.correct,
      totalAnswered: item.totalAnswered,
      accuracy: item.totalAnswered > 0 ? Math.round((item.correct / item.totalAnswered) * 100) : 0
    }));

  return {
    timestamp: new Date().toISOString(),
    formattedTime: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    currentQuestionNum,
    totalRoundsPlayed,
    totalParticipants: sorted.length,
    leaderboard: sorted
  };
}

function generateTxt(data) {
  let txt = `==========================================================\n`;
  txt += `🏆 TOP SCORER LIVE TIKTOK - SIMULASI CAT SKD CPNS 2026\n`;
  txt += `👤 Akun Host : @spillsabi.id (maritumbuhbersama)\n`;
  txt += `📅 Waktu Snapshot : ${data.formattedTime} WIB\n`;
  txt += `🎯 Total Soal Berjalan : ${data.currentQuestionNum} Soal\n`;
  txt += `👥 Total Peserta Tercatat : ${data.totalParticipants} Orang\n`;
  txt += `==========================================================\n\n`;

  txt += `PODIUM JUARA UTAMA:\n`;
  if (data.leaderboard[0]) txt += `🥇 JUARA 1 : @${data.leaderboard[0].user} — ${data.leaderboard[0].points} Poin (Akurasi: ${data.leaderboard[0].accuracy}% | ${data.leaderboard[0].correct}/${data.leaderboard[0].totalAnswered} Benar)\n`;
  if (data.leaderboard[1]) txt += `🥈 JUARA 2 : @${data.leaderboard[1].user} — ${data.leaderboard[1].points} Poin (Akurasi: ${data.leaderboard[1].accuracy}% | ${data.leaderboard[1].correct}/${data.leaderboard[1].totalAnswered} Benar)\n`;
  if (data.leaderboard[2]) txt += `🥉 JUARA 3 : @${data.leaderboard[2].user} — ${data.leaderboard[2].points} Poin (Akurasi: ${data.leaderboard[2].accuracy}% | ${data.leaderboard[2].correct}/${data.leaderboard[2].totalAnswered} Benar)\n\n`;

  txt += `DAFTAR LENGKAP KLASEMEN (TOP PARTICIPANTS):\n`;
  data.leaderboard.forEach(u => {
    const medal = u.rank === 1 ? '🥇' : (u.rank === 2 ? '🥈' : (u.rank === 3 ? '🥉' : `#${u.rank}`));
    txt += `${medal.padEnd(4, ' ')} @${u.user.padEnd(20, ' ')} : ${u.points} pts | Benar: ${u.correct}/${u.totalAnswered} (${u.accuracy}%)\n`;
  });

  txt += `\n==========================================================\n`;
  txt += `🔥 Caption Siap Pakai Untuk Video TikTok / Reels:\n`;
  txt += `Selamat kepada para juara Simulasi CAT SKD CPNS malam ini! 🥳👏\n`;
  txt += `🥇 @${data.leaderboard[0]?.user || '-'} (${data.leaderboard[0]?.points || 0} pts)\n`;
  txt += `🥈 @${data.leaderboard[1]?.user || '-'} (${data.leaderboard[1]?.points || 0} pts)\n`;
  txt += `🥉 @${data.leaderboard[2]?.user || '-'} (${data.leaderboard[2]?.points || 0} pts)\n\n`;
  txt += `Kalian semua keren banget! Besok kita lanjut live latihan soal TIU lagi ya! Follow biar ga ketinggalan live selanjutnya! 🚀📚 #CPNS2026 #TIUCPNS #LolosCPNS #SpillSabi\n`;
  txt += `==========================================================\n`;

  return txt;
}

function generateHtml(data) {
  const top10 = data.leaderboard.slice(0, 10);
  const rows = top10.map(u => {
    const isTop3 = u.rank <= 3;
    const medal = u.rank === 1 ? '🥇' : (u.rank === 2 ? '🥈' : (u.rank === 3 ? '🥉' : `${u.rank}`));
    const bgClass = u.rank === 1 ? 'gold-row' : (u.rank === 2 ? 'silver-row' : (u.rank === 3 ? 'bronze-row' : 'normal-row'));
    return `
      <div class="user-row ${bgClass}">
        <div class="rank-badge">${medal}</div>
        <div class="user-info">
          <div class="username">@${escapeHtml(u.user)}</div>
          <div class="stats-sub">${u.correct} Benar dari ${u.totalAnswered} Soal (${u.accuracy}% Akurasi)</div>
        </div>
        <div class="score-badge">
          <span class="score-num">${u.points}</span>
          <span class="score-label">PTS</span>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Hall of Fame - Top Scorers CPNS 2026</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080d1a;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 30px;
    }
    .poster-canvas {
      width: 720px;
      background: radial-gradient(circle at 50% 10%, #1e1b4b 0%, #0f172a 60%, #080d1a 100%);
      border: 4px solid #38bdf8;
      border-radius: 28px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.85);
      padding: 35px 30px;
      color: #ffffff;
      position: relative;
    }
    .header-banner {
      text-align: center;
      margin-bottom: 25px;
    }
    .host-pill {
      display: inline-block;
      background: #f59e0b;
      color: #0f172a;
      font-weight: 900;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 32px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .sub-meta {
      font-size: 15px;
      color: #94a3b8;
      margin-top: 6px;
    }
    .list-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .user-row {
      display: flex;
      align-items: center;
      padding: 12px 18px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 2px solid rgba(255, 255, 255, 0.12);
      transition: transform 0.2s;
    }
    .user-row.gold-row {
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%);
      border-color: #f59e0b;
    }
    .user-row.silver-row {
      background: linear-gradient(90deg, rgba(148, 163, 184, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%);
      border-color: #cbd5e1;
    }
    .user-row.bronze-row {
      background: linear-gradient(90deg, rgba(217, 119, 6, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%);
      border-color: #d97706;
    }
    .rank-badge {
      font-size: 26px;
      font-weight: 900;
      width: 45px;
      text-align: center;
    }
    .user-info {
      flex: 1;
      margin-left: 10px;
    }
    .username {
      font-size: 19px;
      font-weight: 800;
      color: #f8fafc;
    }
    .stats-sub {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 600;
    }
    .score-badge {
      text-align: right;
    }
    .score-num {
      font-family: 'Poppins', sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: #f59e0b;
    }
    .score-label {
      font-size: 12px;
      font-weight: 800;
      color: #94a3b8;
      margin-left: 3px;
    }
    .footer-stamp {
      margin-top: 25px;
      text-align: center;
      padding-top: 15px;
      border-top: 2px dashed rgba(255, 255, 255, 0.15);
      font-size: 14px;
      color: #64748b;
      font-weight: 700;
    }
    .btn-download {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 900;
      text-decoration: none;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
      cursor: pointer;
      border: none;
    }
  </style>
</head>
<body>
  <button class="btn-download" onclick="window.print()">🖨️ Cetak / Simpan PDF / Screenshot</button>
  <div class="poster-canvas">
    <div class="header-banner">
      <div class="host-pill">🏆 OFFICIAL HALL OF FAME CPNS 2026</div>
      <h1>TOP SCORERS LIVE SHOW</h1>
      <div class="sub-meta">@spillsabi.id (maritumbuhbersama) • ${data.formattedTime} WIB • ${data.totalParticipants} Peserta</div>
    </div>
    <div class="list-container">
      ${rows}
    </div>
    <div class="footer-stamp">
      🎯 Simulasi Tryout Resmi CAT SKD CPNS 2026 • 100% Murni Prestasi & Akurasi
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function run() {
  const data = parseLog();
  if (!data) return;

  fs.writeFileSync(outJson, JSON.stringify(data, null, 2), 'utf8');
  fs.writeFileSync(outTxt, generateTxt(data), 'utf8');
  fs.writeFileSync(outHtml, generateHtml(data), 'utf8');

  console.log(`✅ Snapshot Sukses Disimpan!`);
  console.log(`📁 JSON: ${outJson}`);
  console.log(`📁 TXT : ${outTxt}`);
  console.log(`🌐 HTML Card: ${outHtml}`);
  console.log(`🏆 Top 3:`);
  data.leaderboard.slice(0, 3).forEach(u => {
    console.log(`   #${u.rank} @${u.user}: ${u.points} pts`);
  });
}

run();

