// Theme toggle with system preference + persistence
const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
const savedTheme = localStorage.getItem('theme');
const root = document.documentElement;
const applyTheme = (t) => {
    if (t === 'light') {
        root.setAttribute('data-theme', 'light');
        toggle.textContent = '🌙';   /* sun icon for light mode */
    } else {
        root.removeAttribute('data-theme');
        toggle.textContent = '☀️';   /* moon icon for dark mode */
    }
    localStorage.setItem('theme', t);
};
const toggle = document.getElementById('themeToggle');
applyTheme(savedTheme || (prefersLight ? 'light' : 'dark'));
toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
});
// Hero slider
const slides = Array.from(document.querySelectorAll('.hero .slide'));
const dots = Array.from(document.querySelectorAll('.slider-dots .dot'));
let slideIndex = 0; let autoAdvance = true;
let sliderPaused = false;
function goSlide(i) {
    slides[slideIndex].classList.remove('active');
    dots[slideIndex].classList.remove('active');
    slideIndex = (i + slides.length) % slides.length;
    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active');
}
let sliderTimer = null;
function startAuto() {
    if (sliderPaused) return;
    sliderTimer = setInterval(() => goSlide(slideIndex + 1), 6000);
}
dots.forEach((d, i) => d.addEventListener('click', () => {
    clearInterval(sliderTimer);
    sliderTimer = null;
    dots.forEach(dot => dot.classList.remove('paused'));

    if (i === 2) { // Rocket game slide knob
        sliderPaused = true;
        if (dots[2]) dots[2].classList.add('paused');
    } else {
        sliderPaused = false;
        setTimeout(startAuto, 6000);
    }

    goSlide(i);
}));
startAuto();

(function () {
    const canvas = document.getElementById('rocketGame');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    canvas.style.touchAction = 'none';
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        width = rect.width;
        height = rect.height;
        dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    let lastTime = performance.now();
    const baseDuration = 7000; // ms per full traverse
    let tilt = 0;
    const decay = 0.92;
    const tiltStep = 0.22;

    // Rocket state: position along guide line [0..1] and perpendicular offset (as fraction of min dimension)
    let rocketPos = 0.35;
    let rocketOffset = 0.10;
    const maxRocketOffset = 0.16;
    const rocketOffsetStep = 0.03;
    // Screen-space rocket position updated during draw
    let rocketScreenX = 0;
    let rocketScreenY = 0;

    // Obstacles gliding along the guide line, inspired by Astrovert's cosmic debris
    const obstacles = [];
    let obstacleTimer = 0;
    const obstacleSpawnInterval = 1400; // ms between spawns
    const obstacleSpeed = 0.22;        // fraction of line per second

    // Flash feedback when the rocket grazes or hits obstacles
    let flashTimer = 0;
    let flashMax = 0;
    let flashType = null; // "hit" or "near"
    // Dino-style scoring + game state
    let score = 0;
    let highScore = Number(localStorage.getItem('rocketHighScore') || '0');
    let gameOver = false;

    function pauseSliderOnGame() {
        if (typeof sliderTimer !== 'undefined' && sliderTimer) {
            clearInterval(sliderTimer);
            sliderTimer = null;
        }
        sliderPaused = true;
        if (dots[2]) dots[2].classList.add('paused');
    }

    function nudge(direction) {
        switch (direction) {
            case 'left':
                // small horizontal tilt option if ever needed
                tilt -= tiltStep * 0.5;
                break;
            case 'right':
                tilt += tiltStep * 0.5;
                break;
            case 'up':
                // tilt and move the rocket slightly "up" from the guide line
                tilt -= tiltStep * 1.4;
                rocketOffset = Math.min(maxRocketOffset, rocketOffset + rocketOffsetStep);
                break;
            case 'down':
                // tilt and move the rocket slightly "down" toward the guide line (but not below)
                tilt += tiltStep * 1.4;
                rocketOffset = Math.max(0, rocketOffset - rocketOffsetStep);
                break;
        }
    }

    // On-screen controls
    const buttons = document.querySelectorAll('.hero-game-controls .game-key');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.getAttribute('data-dir');
            nudge(dir);
            pauseSliderOnGame();
        });
    });

    // Keyboard controls (ArrowUp / ArrowDown + restart keys)
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        let handled = false;

        if (gameOver && (key === ' ' || key === 'Spacebar' || key === 'Enter')) {
            resetGame();
            handled = true;
        } else if (key === 'ArrowUp') {
            nudge('up');
            handled = true;
        } else if (key === 'ArrowDown') {
            nudge('down');
            handled = true;
        }

        if (handled) {
            // Prevent keys from scrolling the page while steering / restarting the rocket
            e.preventDefault();
            if (slides[slideIndex] && slides[slideIndex].classList.contains('game-slide')) {
                pauseSliderOnGame();
            }
        }
    });

    let gridOffset = 0;
    const gridSpeed = 80; // pixels per second, Dino-like scroll

    function drawGrid() {
        const spacing = 28;
        ctx.save();
        ctx.globalAlpha = 0.8;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        ctx.strokeStyle = isLight ? 'rgba(20,33,43,0.16)' : 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1;
        const offset = gridOffset % spacing;
        // Vertical lines scroll to the left
        for (let x = -offset; x <= width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        // Horizontal lines stay anchored to give a "ground"
        for (let y = 0; y <= height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawWatermark() {
        if (!width || !height) return;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const pad = Math.max(16, Math.min(width, height) * 0.06);

        ctx.save();
        ctx.globalAlpha = isLight ? 0.30 : 0.22;
        ctx.fillStyle = isLight ? 'rgba(20,33,43,0.65)' : 'rgba(255,255,255,0.55)';
        ctx.font = `600 ${Math.max(11, Math.min(width, height) * 0.035)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('MATHRICKS STUDIO', width - pad, height - pad);
        ctx.restore();
    }

    function drawLineAndRocket(progress) {
        if (!width || !height) return;

        // Guiding line from near bottom-left to near top-right corners
        const margin = Math.min(width, height) * 0.08;
        const x0 = margin;
        const y0 = height - margin;
        const x1 = width - margin;
        const y1 = margin;

        ctx.save();
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';

        // Thinner guide line + subtle moving dash for motion hint
        ctx.lineWidth = 1;
        ctx.strokeStyle = isLight ? 'rgba(196,167,117,0.95)' : 'rgba(214,193,158,0.9)';
        const pathLength = Math.hypot(x1 - x0, y1 - y0);
        const dash = 8;
        const gap = 4;
        ctx.setLineDash([dash, gap]);
        ctx.lineDashOffset = progress * pathLength * 0.6;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // Reset dash so it does not affect other drawing calls
        ctx.setLineDash([]);

        // Rocket at adjustable position slightly above/below the line
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy) || 1;
        // Perpendicular unit vector pointing visually "up" from the line
        const nx = dy / len;
        const ny = -dx / len;
        const offsetDist = Math.min(width, height) * rocketOffset; // distance away from the line
        const px = x0 + dx * rocketPos + nx * offsetDist;
        const py = y0 + dy * rocketPos + ny * offsetDist;

        // Store screen-space rocket position for collision and flash effects
        rocketScreenX = px;
        rocketScreenY = py;

        // Base angle along the diagonal plus tilt for user control
        const baseAngle = Math.atan2(y1 - y0, x1 - x0);
        const angle = baseAngle + tilt * 0.5;

        ctx.translate(px, py);
        ctx.rotate(angle);

        // Flame
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-26, -4);
        ctx.lineTo(-24, 0);
        ctx.lineTo(-26, 4);
        ctx.closePath();
        ctx.fillStyle = isLight ? 'rgba(196,167,117,0.9)' : 'rgba(214,193,158,0.8)';
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fillStyle = isLight ? '#14212B' : '#FFFFFF';
        ctx.fill();

        // Window
        ctx.beginPath();
        ctx.arc(-4, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#EEF3F8' : '#14212B';
        ctx.fill();

        ctx.restore();
    }

    // Spawn a single obstacle along the guide line, a bit ahead of the rocket
    function spawnObstacle() {
        if (!width || !height) return;

        const margin = Math.min(width, height) * 0.08;
        const x0 = margin;
        const y0 = height - margin;
        const x1 = width - margin;
        const y1 = margin;

        // Spawn ahead of the rocket, but not too close to the edge
        const minPos = Math.min(rocketPos + 0.18, 0.95);
        const maxPos = 1.1;
        const pos = minPos + Math.random() * (maxPos - minPos);

        // Offset slightly above the guide line (Astrovert-style arc / debris in the flight corridor)
        const baseOffset = 0.03;
        const extraOffset = Math.random() * 0.09;
        const offset = baseOffset + extraOffset;

        const size = Math.min(width, height) * (0.018 + Math.random() * 0.022);
        const r = Math.random();
        let type;
        if (r < 0.4) {
            type = 'rock';
        } else if (r < 0.75) {
            type = 'ring';
        } else {
            type = 'spike';
        }

        obstacles.push({ pos, offset, size, type });
    }

    function updateObstacles(dtSeconds) {
        if (!width || !height || gameOver) return;

        obstacleTimer += dtSeconds * 1000;
        if (obstacleTimer >= obstacleSpawnInterval) {
            obstacleTimer = 0;
            spawnObstacle();
        }

        const deltaPos = obstacleSpeed * dtSeconds;
        for (const o of obstacles) {
            // Obstacles move "toward" the rocket, so decrease pos along the line
            o.pos -= deltaPos;
        }

        // Cull obstacles that have passed far behind the rocket
        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (obstacles[i].pos < -0.2) {
                obstacles.splice(i, 1);
            }
        }
    }

    function drawObstacles() {
        if (!width || !height || !obstacles.length) return;

        const margin = Math.min(width, height) * 0.08;
        const x0 = margin;
        const y0 = height - margin;
        const x1 = width - margin;
        const y1 = margin;

        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy) || 1;

        // Perpendicular "up" from the guide line
        const nx = dy / len;
        const ny = -dx / len;
        const minDim = Math.min(width, height);
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';

        ctx.save();
        ctx.lineWidth = 1;

        for (const o of obstacles) {
            const baseX = x0 + dx * o.pos;
            const baseY = y0 + dy * o.pos;
            const offsetDist = minDim * o.offset;
            const x = baseX + nx * offsetDist;
            const y = baseY + ny * offsetDist;
            const r = o.size;

            if (o.type === 'rock') {
                // Solid Astrovert-style asteroid chunk
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = isLight ? '#C4A775' : '#D6C19E';
                ctx.fill();
                ctx.strokeStyle = isLight ? 'rgba(20,33,43,0.6)' : 'rgba(0,0,0,0.55)';
                ctx.stroke();

                // Add a little highlight notch
                ctx.beginPath();
                ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.5, -0.6, 1.0 * Math.PI, false);
                ctx.strokeStyle = isLight ? 'rgba(238,243,248,0.7)' : 'rgba(255,255,255,0.6)';
                ctx.stroke();
            } else if (o.type === 'ring') {
                // Thin gravitational ring, echoing Astrovert's orbital arcs
                ctx.beginPath();
                ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
                ctx.strokeStyle = isLight ? 'rgba(196,167,117,0.9)' : 'rgba(214,193,158,0.9)';
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
                ctx.strokeStyle = isLight ? 'rgba(20,33,43,0.5)' : 'rgba(0,0,0,0.55)';
                ctx.stroke();
            } else if (o.type === 'spike') {
                // Astrovert-style spiky asterisk with a soft glow
                const glowR = r * 0.7;
                ctx.beginPath();
                ctx.arc(x, y, glowR, 0, Math.PI * 2);
                ctx.fillStyle = isLight
                    ? 'rgba(255,120,80,0.26)'
                    : 'rgba(255,80,40,0.32)';
                ctx.fill();

                ctx.save();
                ctx.translate(x, y);
                ctx.strokeStyle = isLight ? '#14212B' : '#000000';
                ctx.lineCap = 'round';
                ctx.lineWidth = Math.max(2, r * 0.32);

                const inner = r * 0.15;
                const outer = r * 0.95;
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 4; // 0, 45, 90, 135 degrees; each line gives two arms
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    ctx.beginPath();
                    ctx.moveTo(-inner * cos, -inner * sin);
                    ctx.lineTo(-outer * cos, -outer * sin);
                    ctx.moveTo(inner * cos, inner * sin);
                    ctx.lineTo(outer * cos, outer * sin);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        ctx.restore();
    }

    function checkCollisions() {
        if (!width || !height || !obstacles.length) return;

        const margin = Math.min(width, height) * 0.08;
        const x0 = margin;
        const y0 = height - margin;
        const x1 = width - margin;
        const y1 = margin;

        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy) || 1;

        // Perpendicular "up" from the guide line
        const nx = dy / len;
        const ny = -dx / len;
        const minDim = Math.min(width, height);

        const rx = rocketScreenX;
        const ry = rocketScreenY;
        if (!Number.isFinite(rx) || !Number.isFinite(ry)) return;

        const baseHitRadius = minDim * 0.028;   // rocket hit radius
        const baseNearRadius = baseHitRadius * 1.8;

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            const baseX = x0 + dx * o.pos;
            const baseY = y0 + dy * o.pos;
            const offsetDist = minDim * o.offset;
            const ox = baseX + nx * offsetDist;
            const oy = baseY + ny * offsetDist;
            const r = o.size;

            const dist = Math.hypot(ox - rx, oy - ry);
            const hitRadius = r + baseHitRadius;
            const nearRadius = r + baseNearRadius;

            if (dist < hitRadius) {
                // Direct hit, trigger game over, stronger flash, remove obstacle
                flashType = 'hit';
                flashMax = 260;
                flashTimer = flashMax;
                obstacles.splice(i, 1);

                gameOver = true;
                const finalScore = Math.floor(score);
                if (finalScore > highScore) {
                    highScore = finalScore;
                    try {
                        localStorage.setItem('rocketHighScore', String(highScore));
                    } catch (_) { }
                }
            } else if (dist < nearRadius && flashTimer <= 0) {

                // Graze or near miss, softer flash, do not remove obstacle
                flashType = 'near';
                flashMax = 120;
                flashTimer = flashMax;
            }
        }
    }

    function drawFlash() {
        if (!width || !height || flashTimer <= 0 || !flashType) return;

        const t = flashTimer / (flashMax || 1);
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';

        ctx.save();
        // Ease out so the flash fades smoothly
        const eased = t * t;
        let alpha;
        if (flashType === 'hit') {
            alpha = 0.26 * eased;
            ctx.fillStyle = isLight
                ? `rgba(255,255,255,${alpha})`
                : `rgba(255,255,255,${alpha})`;
        } else {
            alpha = 0.22 * eased;
            ctx.fillStyle = isLight
                ? `rgba(196,167,117,${alpha})`
                : `rgba(214,193,158,${alpha})`;
        }
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    function drawHUD() {
        if (!width || !height) return;

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const pad = Math.max(18, Math.min(width, height) * 0.05);
        const scoreNow = Math.floor(score);
        const hi = Math.floor(highScore);
        const scoreStr = scoreNow.toString().padStart(5, '0');
        const hiStr = hi.toString().padStart(5, '0');

        // Score line in the top-right, like Dino: "HI 00081 00045"
        ctx.save();
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.font = `600 ${Math.max(12, Math.min(width, height) * 0.032)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif`;
        ctx.fillStyle = isLight ? 'rgba(20,33,43,0.7)' : 'rgba(255,255,255,0.82)';
        ctx.globalAlpha = 0.9;
        ctx.fillText(`HI ${hiStr}  ${scoreStr}`, width - pad, pad);

        if (gameOver) {
            // Game over banner in the center
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `600 ${Math.max(20, Math.min(width, height) * 0.06)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif`;
            ctx.globalAlpha = isLight ? 0.85 : 0.9;
            ctx.fillText('GAME OVER', width / 2, height / 2 - 24);

            ctx.font = `500 ${Math.max(11, Math.min(width, height) * 0.03)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif`;
            ctx.globalAlpha = isLight ? 0.75 : 0.8;
            ctx.fillText('Press Space or Tap to restart', width / 2, height / 2 + 16);
        }
        ctx.restore();
    }

    function resetGame() {
        // Reset core state and clear obstacles, but keep high score
        score = 0;
        gameOver = false;
        flashTimer = 0;
        flashMax = 0;
        flashType = null;
        obstacles.length = 0;
        gridOffset = 0;
        t = 0;
        tilt = 0;
        rocketOffset = 0.10;
    }

    // Pointer / touch drag controls for rocket altitude only (Dino-style up/down)
    function updateRocketFromPointer(clientX, clientY) {
        if (!width || !height) return;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const minDim = Math.min(width, height);

        // Same guide line geometry as in drawLineAndRocket
        const margin = minDim * 0.08;
        const x0 = margin;
        const y0 = height - margin;
        const x1 = width - margin;
        const y1 = margin;

        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy) || 1;

        // Perpendicular unit vector pointing visually "up" from the line
        const nx = dy / len;
        const ny = -dx / len;

        // On first contact, just store the pointer position so we have a baseline
        if (lastPointerX === null || lastPointerY === null) {
            lastPointerX = x;
            lastPointerY = y;
            return;
        }

        // Use drag delta projected onto the perpendicular to move the rocket up/down
        const vx = x - lastPointerX;
        const vy = y - lastPointerY;
        const deltaPerp = vx * nx + vy * ny;

        let offsetPixels = rocketOffset * minDim + deltaPerp;
        const maxOffsetPixels = minDim * maxRocketOffset;
        if (offsetPixels < 0) offsetPixels = 0;                 // do not allow rocket below the guide line
        if (offsetPixels > maxOffsetPixels) offsetPixels = maxOffsetPixels;

        rocketOffset = offsetPixels / minDim;

        // Update baseline for next move event
        lastPointerX = x;
        lastPointerY = y;
    }

    let lastPointerX = null;
    let lastPointerY = null;
    let dragging = false;

    canvas.addEventListener('pointerdown', (e) => {
        if (gameOver) {
            resetGame();
            return;
        }
        dragging = true;
        lastPointerX = null;
        lastPointerY = null;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
        // Initialize baseline without moving the rocket immediately
        updateRocketFromPointer(e.clientX, e.clientY);
        pauseSliderOnGame();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        updateRocketFromPointer(e.clientX, e.clientY);
    });

    canvas.addEventListener('pointerup', (e) => {
        dragging = false;
        lastPointerX = null;
        lastPointerY = null;
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }
    });

    canvas.addEventListener('pointercancel', (e) => {
        dragging = false;
        lastPointerX = null;
        lastPointerY = null;
    });

    const gameSlide = document.querySelector('.slide.game-slide');
    if (gameSlide) {
        gameSlide.addEventListener('pointerdown', () => {
            if (sliderTimer) {
                clearInterval(sliderTimer);
                sliderTimer = null;
            }
            sliderPaused = true;
            if (dots[2]) dots[2].classList.add('paused');
        }, { passive: true });
    }

    function loop(now) {
        const dt = now - lastTime;
        lastTime = now;
        const dtSeconds = dt / 1000;

        const active = !gameSlide || gameSlide.classList.contains('active');

        if (active && !gameOver) {
            gridOffset += (gridSpeed * dt) / 1000;
            updateObstacles(dtSeconds);
            score += dtSeconds * 18; // scoring pace
            t += dt / baseDuration;
            if (t > 1) t -= 1;
            // decay tilt toward zero while running
            tilt *= decay;
        }

        if (flashTimer > 0) {
            flashTimer -= dt;
            if (flashTimer <= 0) {
                flashTimer = 0;
                flashType = null;
                flashMax = 0;
            }
        }

        if (width && height) {
            ctx.clearRect(0, 0, width, height);
            drawGrid();
            drawWatermark();

            const progress = active ? t : 0.35;

            // Draw line, then obstacles in the corridor, then rocket on top
            drawLineAndRocket(progress);
            drawObstacles();

            // After drawing, check for collisions and near misses and overlay flash + HUD
            if (!gameOver) {
                checkCollisions();
            }
            drawFlash();
            drawHUD();
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
})();
const obs = new IntersectionObserver(entries => {
    for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    }
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));