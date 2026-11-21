/**
 * game-client.js - Master Frontend Orchestrator Kuis CPNS 2026
 * Menghubungkan Socket.IO, Render UI, Animasi Danmu, dan Safe Zone Visual
 */

const socket = io();

// Auto Fit Portrait Canvas (1080x1920) secara proporsional ke resolusi monitor/OBS
function fitPortraitCanvas() {
    const canvas = document.getElementById('portrait-canvas');
    if (!canvas) return;
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const scale = Math.min(windowW / 1080, windowH / 1920);
    canvas.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', fitPortraitCanvas);
window.addEventListener('DOMContentLoaded', fitPortraitCanvas);
setTimeout(fitPortraitCanvas, 50);

// ================= STATE & TAB ROTATION =================
let currentLbTab = 'academic';
let lastQuestionState = null;

function switchLbTab(tab) {
    currentLbTab = tab;
    const btnAcad = document.getElementById('tab-btn-academic');
    const btnSultan = document.getElementById('tab-btn-sultan');
    const acadBox = document.getElementById('leaderboard-container');
    const sultanBox = document.getElementById('sultan-leaderboard-container');
    const badge = document.getElementById('lb-badge-label');

    if (tab === 'academic') {
        if (btnAcad) btnAcad.className = 'tab-lb-btn active';
        if (btnSultan) btnSultan.className = 'tab-lb-btn';
        if (acadBox) acadBox.style.display = 'flex';
        if (sultanBox) sultanBox.style.display = 'none';
        if (badge) badge.innerText = 'PRESTASI SKD';
    } else {
        if (btnAcad) btnAcad.className = 'tab-lb-btn';
        if (btnSultan) btnSultan.className = 'tab-lb-btn active';
        if (acadBox) acadBox.style.display = 'none';
        if (sultanBox) sultanBox.style.display = 'flex';
        if (badge) badge.innerText = 'TOP DONATUR';
    }
}

// Rotasi otomatis papan peringkat setiap 7 detik
setInterval(() => {
    switchLbTab(currentLbTab === 'academic' ? 'sultan' : 'academic');
}, 7000);

// ================= UI RENDERING HELPERS =================

function renderQuestion(q) {
    if (!q) return;
    lastQuestionState = q;

    // Reset solution box
    const solBox = document.getElementById('solution-box');
    if (solBox) solBox.style.display = 'none';

    const roundEl = document.getElementById('round-number');
    if (roundEl) roundEl.innerText = `SOAL #${q.index}`;

    const catEl = document.getElementById('cat-label');
    if (catEl) catEl.innerText = q.kategori || 'TIU';

    const badgeEl = document.getElementById('badge-soal-type');
    if (badgeEl) badgeEl.innerText = `TIU • ${q.kategori || 'MATEMATIKA'}`;

    const qTextEl = document.getElementById('question-text');
    if (qTextEl) qTextEl.innerText = q.soal;

    const voteCountEl = document.getElementById('vote-count-label');
    if (voteCountEl) voteCountEl.innerText = `0 Komen Menjawab`;

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    for (const [key, val] of Object.entries(q.opsi)) {
        container.innerHTML += `
            <div class="math-opt-item" id="opt-row-${key}">
                <div class="opt-vote-fill" id="fill-bar-${key}"></div>
                <div class="opt-left">
                    <div class="opt-letter">${key}</div>
                    <div class="opt-text">${val}</div>
                </div>
                <div class="opt-badge-pill" id="vote-pill-${key}">0% (0)</div>
            </div>
        `;
    }
}

function updateVoteProgress(stats) {
    if (!stats || !stats.distribution) return;
    document.getElementById('vote-count-label').innerText = `${stats.totalVotes} Komen Menjawab`;

    let maxCount = -1;
    let leadingKey = null;
    if (stats.totalVotes > 0) {
        for (const [key, count] of Object.entries(stats.distribution)) {
            if (count > maxCount && count > 0) {
                maxCount = count;
                leadingKey = key;
            }
        }
    }

    for (const [key, count] of Object.entries(stats.distribution)) {
        const pct = stats.percentages[key] || 0;
        const fill = document.getElementById(`fill-bar-${key}`);
        const pill = document.getElementById(`vote-pill-${key}`);
        const item = document.getElementById(`opt-row-${key}`);

        if (fill) fill.style.width = `${pct}%`;

        if (pill) {
            if (key === leadingKey && stats.totalVotes >= 2) {
                pill.className = 'opt-badge-pill leading-badge';
                pill.innerHTML = `🔥 MEMIMPIN ${pct}% (${count})`;
                if (item) item.classList.add('leading');
            } else {
                pill.className = 'opt-badge-pill';
                pill.innerText = `${pct}% (${count})`;
                if (item) item.classList.remove('leading');
            }
        }
    }
}

function updateTimer(time) {
    const textEl = document.getElementById('timer-text');
    const boxEl = document.getElementById('timer-box');
    const barEl = document.getElementById('timer-progress-fill');
    if (!textEl) return;

    textEl.innerText = `${time}s`;

    // Durasi standar 45 detik (waktu ideal untuk berhitung & interaksi live)
    const maxTime = 45;
    const pct = Math.max(0, Math.min(100, (time / maxTime) * 100));

    if (barEl) {
        barEl.style.width = `${pct}%`;
        if (time <= 8) {
            barEl.className = 'timer-progress-fill alert';
        } else if (time <= 15) {
            barEl.className = 'timer-progress-fill warning';
        } else {
            barEl.className = 'timer-progress-fill';
        }
    }

    if (boxEl) {
        if (time <= 8) {
            boxEl.classList.add('alert');
            bgmEngine.setUrgent(true);
        } else {
            boxEl.classList.remove('alert');
            bgmEngine.setUrgent(false);
        }
    }
}

function applyElimination(letters) {
    if (!letters) return;
    letters.forEach(l => {
        const row = document.getElementById(`opt-row-${l}`);
        if (row) row.classList.add('eliminated');
    });
}

function renderLeaderboard(list) {
    if (Array.isArray(list) && list.length > 0) {
        window.currentLeaderboardData = list;
    }
    const container = document.getElementById('leaderboard-container');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="lb-empty-placeholder">
                <div style="font-size: 19px; font-weight: 900; color: var(--bkn-navy); margin-bottom: 4px;">🏆 PAPAN PEROLEHAN POIN SKD</div>
                <div style="font-size: 15px; color: var(--text-muted); line-height: 1.4;">
                    Ketik <strong>A, B, C, D, atau E</strong> di komentar live TikTok.<br>
                    ⚡ Jawaban Benar: <strong>+10 Poin</strong> • ⚡ Kilat (&lt;3s): <strong>+25 Poin Bonus</strong>
                </div>
            </div>
        `;
        return;
    }
    container.innerHTML = list.slice(0, 5).map((entry, idx) => `
        <div class="lb-row ${idx === 0 ? 'first' : ''}">
            <div>
                <strong>${idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '✨'))} #${entry.rank}</strong> @${entry.user} ${entry.streak >= 3 ? '🔥' : ''}
            </div>
            <span class="lb-points">${entry.score} Pts</span>
        </div>
    `).join('');
}

function renderSultanLeaderboard(list) {
    const container = document.getElementById('sultan-leaderboard-container');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="lb-empty-placeholder">
                <div style="font-size: 19px; font-weight: 900; color: #d97706; margin-bottom: 4px;">👑 TOP SULTAN DONATUR LIVE</div>
                <div style="font-size: 15px; color: var(--text-muted); line-height: 1.4;">
                    🌹 <strong>Mawar:</strong> 50:50 Coret Opsi • ☕ <strong>Kopi:</strong> +15s Waktu • 🍩 <strong>Donat:</strong> Double 2X Poin
                </div>
            </div>
        `;
        return;
    }
    container.innerHTML = list.slice(0, 5).map((entry, idx) => `
        <div class="lb-row sultan ${idx === 0 ? 'first' : ''}">
            <div>
                <strong>${idx === 0 ? '👑' : (idx === 1 ? '💎' : '✨')} #${entry.rank}</strong> @${entry.user}
            </div>
            <span class="lb-coins">🪙 ${entry.coins} Koin</span>
        </div>
    `).join('');
}

function updateCommunityGoal(goal) {
    if (!goal) return;
    const currEl = document.getElementById('goal-curr-num');
    const targetEl = document.getElementById('goal-target-num');
    const fillEl = document.getElementById('goal-progress-fill');
    if (currEl) currEl.innerText = goal.current || 0;
    if (targetEl) targetEl.innerText = goal.target || 50;
    if (fillEl) {
        const pct = Math.min(100, Math.round(((goal.current || 0) / (goal.target || 50)) * 100));
        fillEl.style.width = `${pct}%`;
    }
}

function quickConnectTikTok() {
    const defaultUser = 'spillsabi.id';
    const user = prompt('Masukkan Username TikTok Live Anda (tanpa tanda @):', defaultUser);
    if (user && user.trim()) {
        socket.emit('CMD_CONNECT_TIKTOK', user.trim());
        const label = document.getElementById('label-tiktok-status');
        if (label) label.innerText = `Menghubungkan @${user.trim()}...`;
        showToast(`📡 Menghubungkan ke live @${user.trim()}...`, '#0284c7');
    }
}

function showSolution(rev) {
    const solBox = document.getElementById('solution-box');
    if (!solBox) return;

    // Highlight correct option (perbaiki bug undefined)
    const correctAns = rev.correctAnswer || rev.jawaban || '';
    if (correctAns) {
        const correctRow = document.getElementById(`opt-row-${correctAns}`);
        if (correctRow) correctRow.classList.add('correct');
    }

    document.getElementById('sol-correct-title').innerText = `🎉 Kunci Jawaban Resmi: [ ${correctAns} ]`;
    document.getElementById('sol-ratio-tag').innerText = `✅ ${rev.correctCount || 0} Benar • ❌ ${rev.wrongCount || 0} Salah`;

    const mvpBadge = document.getElementById('mvp-winner-badge');
    const fastestList = rev.fastestAnswerers || rev.fastestUsers || [];
    if (fastestList.length > 0) {
        const mvp = fastestList[0];
        const sec = mvp.speedSeconds !== undefined ? mvp.speedSeconds : (mvp.speedRemaining !== undefined ? Math.max(1, 45 - mvp.speedRemaining) : 1);
        const pts = mvp.earned !== undefined ? mvp.earned : (mvp.scoreEarned || 10);
        mvpBadge.style.display = 'flex';
        mvpBadge.innerHTML = `👑 JUARA KILAT: <strong>@${mvp.user || mvp.username}</strong> (${sec}s • +${pts} Poin)`;
    } else {
        mvpBadge.style.display = 'none';
    }

    const podiumGrid = document.getElementById('speed-podium-grid');
    if (fastestList.length > 0) {
        podiumGrid.style.display = 'flex';
        podiumGrid.innerHTML = fastestList.map((u, i) => {
            const sec = u.speedSeconds !== undefined ? u.speedSeconds : (u.speedRemaining !== undefined ? Math.max(1, 45 - u.speedRemaining) : 1);
            const pts = u.earned !== undefined ? u.earned : (u.scoreEarned || 10);
            return `
                <div class="speed-pill">
                    ${i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉')} @${u.user || u.username} (${sec}s • +${pts} Pts)
                </div>
            `;
        }).join('');
    } else {
        podiumGrid.innerHTML = '';
        podiumGrid.style.display = 'none';
    }

    document.getElementById('solution-desc').innerHTML = rev.pembahasan || 'Jawaban dihitung berdasarkan rumus kecepatan berhitung resmi CAT SKD BKN.';
    solBox.style.display = 'block';

    if (rev.correctCount > 0) {
        playStudioFX('applause');
        triggerConfettiCelebration();
    } else {
        playStudioFX('buzzer');
    }
}

// ================= ANIMASI INTERAKTIF LIVE =================

function spawnDanmuBullet(username, letter) {
    const layer = document.getElementById('danmu-layer');
    const targetCard = document.getElementById(`opt-row-${letter}`);
    if (!layer || !targetCard) return;

    const bullet = document.createElement('div');
    bullet.className = 'danmu-bullet';
    bullet.innerHTML = `<span>🎯 @${username}</span> <strong>[ ${letter} ]</strong>`;

    const startX = 120 + Math.random() * 500;
    const startY = 1450 + Math.random() * 60;
    bullet.style.left = `${startX}px`;
    bullet.style.top = `${startY}px`;
    layer.appendChild(bullet);

    requestAnimationFrame(() => {
        bullet.style.opacity = '1';
        bullet.style.transform = 'scale(1)';

        const canvasRect = document.getElementById('portrait-canvas').getBoundingClientRect();
        const targetRect = targetCard.getBoundingClientRect();
        const scale = canvasRect.width / 1080;

        const destX = (targetRect.left - canvasRect.left) / scale + 50 + Math.random() * 300;
        const destY = (targetRect.top - canvasRect.top) / scale + 15;

        setTimeout(() => {
            bullet.style.left = `${destX}px`;
            bullet.style.top = `${destY}px`;
            bullet.style.transform = 'scale(0.85)';
            bullet.style.opacity = '0.9';

            setTimeout(() => {
                bullet.style.opacity = '0';
                targetCard.style.transform = 'scale(1.02)';
                setTimeout(() => { targetCard.style.transform = 'scale(1)'; }, 150);
                setTimeout(() => bullet.remove(), 400);
            }, 550);
        }, 50);
    });
}

function spawnFloatingHeart() {
    const layer = document.getElementById('hearts-layer');
    if (!layer) return;

    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    const hearts = ['❤️', '💖', '💘', '🔥', '✨'];
    heart.innerText = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = `${Math.random() * 80}px`;

    layer.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
}

function showVipBanner(sender, giftName, diamonds, action) {
    const banner = document.getElementById('vip-banner-overlay');
    if (!banner) return;

    document.getElementById('vip-banner-title').innerText = `@${sender} mengirim ${giftName}!`;
    document.getElementById('vip-banner-action').innerText = action || '🎁 Bantuan Sultan Aktif!';
    banner.style.display = 'flex';

    playStudioFX('ding');

    setTimeout(() => {
        banner.style.display = 'none';
    }, 4500);
}

function showToast(msg, bg = '#0f3b68') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-pill';
    toast.style.background = bg;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function addTickerMessage(msg) {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;
    const span = document.createElement('span');
    span.innerText = msg;
    ticker.appendChild(span);
}

// ================= SOCKET.IO LISTENERS =================

function updateLiveStatusUI(status, username, profile) {
    const pill = document.getElementById('live-connect-pill');
    const lblSub = document.getElementById('label-tiktok-status');
    const lblUser = document.getElementById('label-tiktok-user');
    const avatarImg = document.getElementById('tiktok-avatar-img');

    if (profile && profile.avatar && avatarImg) {
        avatarImg.src = profile.avatar;
    }
    if (lblUser) {
        const u = (profile && profile.username) || username || 'spillsabi.id';
        lblUser.innerText = `@${u}`;
    }

    if (status === 'CONNECTED') {
        if (pill) {
            pill.style.background = '#dcfce7';
            pill.style.borderColor = '#22c55e';
            pill.style.color = '#15803d';
        }
        if (lblSub) lblSub.innerText = '🔴 SEDANG SIARAN';
    } else if (status === 'CONNECTING') {
        if (pill) {
            pill.style.background = '#e0f2fe';
            pill.style.borderColor = '#38bdf8';
            pill.style.color = '#0369a1';
        }
        if (lblSub) lblSub.innerText = 'MEMERIKSA SIARAN...';
    } else if (status === 'WAITING_LIVE') {
        if (pill) {
            pill.style.background = '#fef3c7';
            pill.style.borderColor = '#f59e0b';
            pill.style.color = '#b45309';
        }
        if (lblSub) lblSub.innerText = 'STANDBY (SIAP LIVE)';
    } else if (status) {
        if (pill) {
            pill.style.background = '#fee2e2';
            pill.style.borderColor = '#f87171';
            pill.style.color = '#b91c1c';
        }
        if (lblSub) lblSub.innerText = 'OFFLINE';
    }
}

socket.on('INIT_STATE', data => {
    if (typeof ensureAudioRunning === 'function') ensureAudioRunning();
    if (data.currentQuestion) renderQuestion(data.currentQuestion);
    if (data.timer !== undefined) updateTimer(data.timer);
    if (data.voteStats) updateVoteProgress(data.voteStats);
    if (data.leaderboard) renderLeaderboard(data.leaderboard);
    if (data.sultanLeaderboard) renderSultanLeaderboard(data.sultanLeaderboard);
    if (data.communityGoal) updateCommunityGoal(data.communityGoal);
    if (data.tiktokProfile) {
        updateLiveStatusUI(data.tiktokStatus, data.tiktokUser, data.tiktokProfile);
    } else if (data.tiktokStatus) {
        updateLiveStatusUI(data.tiktokStatus, data.tiktokUser || 'spillsabi.id');
    }
});

socket.on('QUESTION_START', q => {
    if (typeof ensureAudioRunning === 'function') ensureAudioRunning();
    const lbl = document.getElementById('timer-label-text');
    if (lbl) lbl.innerText = '⏱️ SISA WAKTU:';
    const bar = document.getElementById('timer-progress-fill');
    if (bar) bar.className = 'timer-progress-fill';
    renderQuestion(q);
    if (q.leaderboard) renderLeaderboard(q.leaderboard);
    if (q.sultanLeaderboard) renderSultanLeaderboard(q.sultanLeaderboard);
    playStudioFX('ding');
});

socket.on('REVEAL_TIMER_TICK', data => {
    const textEl = document.getElementById('timer-text');
    const lbl = document.getElementById('timer-label-text');
    const bar = document.getElementById('timer-progress-fill');

    if (textEl) textEl.innerText = `${data.remaining}s`;
    if (lbl) lbl.innerText = '📖 PEMBAHASAN SOAL:';
    if (bar && data.total) {
        const pct = Math.max(0, Math.min(100, (data.remaining / data.total) * 100));
        bar.style.width = `${pct}%`;
        bar.className = 'timer-progress-fill success';
    }
});

socket.on('TIMER_TICK', t => {
    updateTimer(t.timer);
});

socket.on('VOTE_UPDATE', stats => {
    updateVoteProgress(stats);
    if (stats.lastVoter && stats.lastVoter.user) {
        spawnDanmuBullet(stats.lastVoter.user, stats.lastVoter.letter);
        showToast(`⚡ @${stats.lastVoter.user} memilih [ ${stats.lastVoter.letter} ]`, '#0284c7');
    }
});

socket.on('OPTIONS_ELIMINATED', elim => {
    applyElimination(elim.eliminated);
    showToast(`🌹 50:50 Aktif! Pilihan salah [ ${elim.eliminated.join(', ')} ] digugurkan!`, '#e11d48');
});

socket.on('QUESTION_REVEAL', rev => {
    if (typeof ensureAudioRunning === 'function') ensureAudioRunning();
    showSolution(rev);
    if (rev.leaderboard) renderLeaderboard(rev.leaderboard);
    if (rev.sultanLeaderboard) renderSultanLeaderboard(rev.sultanLeaderboard);
});

socket.on('REWARD_GIFT_EVENT', r => {
    showVipBanner(r.sender, r.giftName, r.diamonds, r.action);
    addTickerMessage(`🎁 @${r.sender} mengirim ${r.giftName} -> ${r.action}`);
});

socket.on('SULTAN_UPDATE', data => {
    if (data.sultanLeaderboard) renderSultanLeaderboard(data.sultanLeaderboard);
    if (data.communityGoal) updateCommunityGoal(data.communityGoal);
});

socket.on('LIKE_EVENT', () => {
    spawnFloatingHeart();
});

socket.on('CHAT_MESSAGE', data => {
    if (data.validVote) {
        spawnDanmuBullet(data.user, data.validVote);
    }
});

socket.on('TIKTOK_STATUS', st => {
    updateLiveStatusUI(st.status, st.username, st.profile);
});

socket.on('TIKTOK_PROFILE', prof => {
    updateLiveStatusUI(null, prof.username, prof);
});

socket.on('LEADERBOARD_RESET', () => {
    renderLeaderboard([]);
    renderSultanLeaderboard([]);
    showToast('🔄 Papan Peringkat Berhasil Direset!', '#0284c7');
});

socket.on('PLAY_SOUNDPAD_EFFECT', data => {
    if (data && data.effect) {
        if (data.effect === 'CLOSING_FINAL_3') {
            triggerClosingFinal3();
            return;
        }
        if (data.effect === 'CLOSING_5MIN') {
            triggerClosing5Min();
            return;
        }
        if (data.effect === 'CLOSING_PODIUM') {
            triggerClosingPodium();
            return;
        }
        if (data.effect === 'CLOSING_HIDE') {
            closeClosingOverlays();
            return;
        }
        playStudioFX(data.effect);
    }
});

// ================= MODUL PENUTUPAN & GRAND FINALE =================
function triggerClosingFinal3() {
    const banner = document.getElementById('closing-banner-overlay');
    const text = document.getElementById('closing-banner-text');
    if (banner && text) {
        text.innerHTML = '🔥 BABAK PENUTUPAN: 3 SOAL TERAKHIR MENUJU AKHIR LIVE HARI INI!';
        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
        playStudioFX('ding');
        showToast('🚨 Pengumuman 3 Soal Terakhir Diaktifkan!', '#ef4444');
    }
}

function triggerClosing5Min() {
    const banner = document.getElementById('closing-banner-overlay');
    const text = document.getElementById('closing-banner-text');
    if (banner && text) {
        let timeLeft = 300; // 5 menit
        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        text.innerHTML = `⏱️ 5 MENIT MENUJU PENUTUPAN LIVE SHOW!`;

        if (window._closingTimer) clearInterval(window._closingTimer);
        window._closingTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(window._closingTimer);
                text.innerHTML = `🏁 WAKTU PENUTUPAN TIBA! TERIMA KASIH SEMUANYA!`;
            } else {
                const m = Math.floor(timeLeft / 60);
                const s = String(timeLeft % 60).padStart(2, '0');
                text.innerHTML = `⏱️ SISA WAKTU ${m}:${s} MENUJU PENUTUPAN LIVE SHOW!`;
            }
        }, 1000);

        playStudioFX('ding');
        showToast('⏱️ Countdown 5 Menit Penutupan Aktif!', '#f59e0b');
    }
}

function triggerClosingPodium() {
    const finale = document.getElementById('grand-finale-overlay');
    const listEl = document.getElementById('finale-podium-list');
    if (!finale || !listEl) return;

    // Ambil top 3 juara dari leaderboard aktif
    const topList = (window.currentLeaderboardData && window.currentLeaderboardData.length > 0)
        ? window.currentLeaderboardData.slice(0, 3)
        : [
            { user: 'eRGie', score: 1460, rank: 1 },
            { user: 'Parbada', score: 1066, rank: 2 },
            { user: 'catfish sashimi', score: 1058, rank: 3 }
        ];

    listEl.innerHTML = topList.map((u, i) => {
        const cls = i === 0 ? 'first' : (i === 1 ? 'second' : 'third');
        const medal = i === 0 ? '🥇 JUARA 1' : (i === 1 ? '🥈 JUARA 2' : '🥉 JUARA 3');
        return `
            <div class="finale-winner-row ${cls}">
                <span>${medal} : @${u.user || u.username}</span>
                <span>${u.score || u.points || 0} PTS</span>
            </div>
        `;
    }).join('');

    finale.style.display = 'flex';
    playStudioFX('applause');
    triggerConfettiCelebration();

    // Hujan confetti meriah berulang selama 15 detik
    if (window._confettiInterval) clearInterval(window._confettiInterval);
    window._confettiInterval = setInterval(triggerConfettiCelebration, 1500);
    setTimeout(() => {
        if (window._confettiInterval) clearInterval(window._confettiInterval);
    }, 15000);
}

function closeClosingOverlays() {
    const banner = document.getElementById('closing-banner-overlay');
    const finale = document.getElementById('grand-finale-overlay');
    if (banner) banner.style.display = 'none';
    if (finale) finale.style.display = 'none';
    if (window._closingTimer) clearInterval(window._closingTimer);
    if (window._confettiInterval) clearInterval(window._confettiInterval);
    showToast('Overlay penutupan disembunyikan.', '#475569');
}

socket.on('SET_BGM_VOLUME', data => {
    if (bgmEngine && typeof data.volume === 'number') {
        bgmEngine.setVolume(data.volume);
    }
});

socket.on('TOGGLE_BGM', () => {
    toggleBGM();
});

