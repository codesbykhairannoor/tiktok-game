/**
 * confetti.js - Lightweight Canvas Confetti Particles
 */

function triggerConfettiCelebration() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width = canvas.parentElement.clientWidth || 1080;
    canvas.height = canvas.parentElement.clientHeight || 1920;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#f59e0b', '#10b981', '#0284c7', '#ef4444', '#8b5cf6', '#ec4899'];

    for (let i = 0; i < 120; i++) {
        particles.push({
            x: canvas.width / 2 + (Math.random() * 200 - 100),
            y: canvas.height * 0.45,
            vx: (Math.random() - 0.5) * 16,
            vy: -Math.random() * 18 - 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 12 + 6,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }

    let frame = 0;
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.55; // Gravity
            p.rotation += p.rotationSpeed;

            if (p.y < canvas.height + 50) {
                active = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }
        });

        frame++;
        if (active && frame < 180) {
            requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
    }

    render();
}

