/**
 * にゃんこ・ディフェンス・プロ
 * Game Engine
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.catContainer = document.getElementById('cat-container');
        this.hitZones = {
            left: document.getElementById('hit-left'),
            right: document.getElementById('hit-right')
        };
        this.hud = {
            combo: document.getElementById('combo-count'),
            comboContainer: document.getElementById('combo-container'),
            score: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            health: document.getElementById('health-bar'),
            feedback: document.getElementById('hit-feedback')
        };

        // Game Constants
        this.LANE_LEFT = 0;
        this.LANE_RIGHT = 1;
        this.LANE_BOTH = 2;
        
        this.JUDGMENT = {
            PERFECT: { dist: 30, score: 1000, text: 'PERFECT!!', color: 'perfect' },
            GOOD: { dist: 70, score: 500, text: 'GOOD!', color: 'good' },
            MISS: { dist: 150, score: 0, text: 'MISS...', color: 'miss' }
        };

        this.TYPES = {
            NORMAL: 'normal',
            SIMULTANEOUS: 'simultaneous',
            HOLD: 'hold',
            BOSS: 'boss'
        };

        // Game State
        this.state = 'TITLE';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('nyanko-highscore')) || 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.health = 5;
        this.maxHealth = 5;
        this.targets = [];
        this.particles = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 1200; // Faster initial spawn
        this.gameSpeed = 6;
        this.startTime = 0;
        
        // Boss related
        this.bossMode = false;
        this.bossHealth = 0;
        this.bossMaxHealth = 50;
        this.nextBossScore = 5000;
        this.ranking = JSON.parse(localStorage.getItem('nyanko-ranking')) || [];
        
        // Input State
        this.keys = {
            left: false,
            right: false
        };

        // Feedback & Safety
        this.damageFlash = 0;
        this.invincibility = 0;
        
        // Hidden Command
        this.joiMode = false;
        this.keyBuffer = '';

        // Initialization
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupEventListeners();
        this.initCat();
        this.preloadAssets();
        this.updateHUD();
        this.displayRanking(); // Initial ranking for title screen

        // Start Loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    preloadAssets() {
        this.images = {};
        const assetKeys = ['toyYarn', 'toyMouse', 'toyRibbon', 'bossRobotDog', 'toyFish', 'joiPenguin'];
        assetKeys.forEach(key => {
            const svgData = Assets.getAsset(key);
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.src = url;
            this.images[key] = img;
        });
    }

    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') {
                if (e.key === 'Escape' && this.state === 'PAUSED') this.resume();
                return;
            }
            
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.handleInput('left');
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.handleInput('right');
            if (e.key === 'Escape') this.pause();

            // Hidden Command Logic
            this.keyBuffer += e.key.toLowerCase();
            this.keyBuffer = this.keyBuffer.slice(-10);
            if (this.keyBuffer.endsWith('joi')) {
                this.toggleJoiMode();
                this.keyBuffer = '';
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.keys.right = false;
        });

        // Mouse
        window.addEventListener('mousedown', (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.button === 0) this.handleInput(e.clientX < window.innerWidth / 2 ? 'left' : 'right');
            if (e.button === 2) this.handleInput('right');
        });

        // Buttons
        document.getElementById('btn-start').addEventListener('click', () => this.start());
        document.getElementById('btn-resume').addEventListener('click', () => this.resume());
        document.getElementById('btn-restart').addEventListener('click', () => this.start());
        document.getElementById('btn-ranking').addEventListener('click', () => {
            this.displayRanking();
            document.getElementById('overlay-title-ranking').classList.add('active');
        });
        document.getElementById('btn-close-ranking').addEventListener('click', () => {
            document.getElementById('overlay-title-ranking').classList.remove('active');
        });
        
        // Prevent context menu
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    initCat() {
        this.catContainer.innerHTML = this.joiMode ? Assets.joiPenguin : Assets.playerCat;
        this.catSVG = this.catContainer.querySelector('svg');
        this.catLeftPaw = this.catContainer.querySelector('#paw-left');
        this.catRightPaw = this.catContainer.querySelector('#paw-right');
    }

    toggleJoiMode() {
        this.joiMode = !this.joiMode;
        
        const overlay = document.getElementById('overlay-joimode');
        overlay.innerText = this.joiMode ? 'JOIMODE' : 'DEFAULT MODE';
        overlay.classList.remove('active');
        void overlay.offsetWidth;
        overlay.classList.add('active');
        
        const container = document.getElementById('game-container');
        if (this.joiMode) container.classList.add('joi-bg');
        else container.classList.remove('joi-bg');

        // Restart with countdown in the new mode
        setTimeout(() => {
            this.initCat();
            this.start();
        }, 500);
    }

    start() {
        document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));
        this.state = 'COUNTDOWN';
        
        const countdownEl = document.getElementById('overlay-countdown');
        const numberEl = document.getElementById('countdown-number');
        countdownEl.classList.add('active');
        
        let count = 3;
        numberEl.innerText = count;
        
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                numberEl.innerText = count;
            } else if (count === 0) {
                numberEl.innerText = 'GO!';
            } else {
                clearInterval(timer);
                countdownEl.classList.remove('active');
                this.beginGame();
            }
        }, 1000);
    }

    beginGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.health = this.maxHealth;
        this.targets = [];
        this.particles = [];
        this.spawnInterval = 1200;
        this.gameSpeed = 6;
        this.startTime = performance.now();
        this.lastSpawnTime = performance.now();
        
        this.updateHUD();
        this.showFeedback('START!', 'perfect');
    }

    pause() {
        this.state = 'PAUSED';
        document.getElementById('overlay-pause').classList.add('active');
    }

    resume() {
        this.state = 'PLAYING';
        document.getElementById('overlay-pause').classList.remove('active');
    }

    gameOver() {
        this.state = 'GAMEOVER';
        
        // Save and Rank
        this.saveScore(this.score);
        this.displayRanking(this.score);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('nyanko-highscore', this.highScore);
        }
        
        document.getElementById('final-score').innerText = this.score;
        document.getElementById('max-combo').innerText = this.maxCombo;
        document.getElementById('overlay-gameover').classList.add('active');
    }

    saveScore(score) {
        this.ranking.push({ score: score, date: new Date().toLocaleDateString() });
        this.ranking.sort((a, b) => b.score - a.score);
        this.ranking = this.ranking.slice(0, 5); // Keep top 5
        localStorage.setItem('nyanko-ranking', JSON.stringify(this.ranking));
        return this.ranking[0].score === score;
    }

    displayRanking(currentScore = null) {
        const gameOverList = document.getElementById('ranking-list');
        const startList = document.getElementById('start-ranking-list');
        
        const updateList = (list) => {
            if (!list) return;
            list.innerHTML = '';
            this.ranking.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'ranking-item' + (currentScore && item.score === currentScore ? ' new-record' : '');
                li.innerHTML = `
                    <span>${index + 1}. ${item.date}</span>
                    <span>${item.score.toLocaleString()} PTS</span>
                `;
                list.appendChild(li);
            });
            if (this.ranking.length === 0) {
                list.innerHTML = '<li class="ranking-item">No records yet!</li>';
            }
        };

        updateList(gameOverList);
        updateList(startList);
    }

    handleInput(lane) {
        this.keys[lane] = true;
        
        // Visual feedback for cat
        this.animatePunch(lane);

        // Zone highlight
        this.hitZones[lane].classList.add('active');
        // We don't remove 'active' immediately for hold visuals, but for punch we do
        if (this.state !== 'BOSS') {
            setTimeout(() => {
                if (!this.keys[lane]) this.hitZones[lane].classList.remove('active');
            }, 100);
        }

        if (this.state === 'BOSS') {
            this.handleBossHit(lane);
        } else {
            this.checkHit(lane);
        }
    }

    animatePunch(lane) {
        const paw = lane === 'left' ? this.catLeftPaw : this.catRightPaw;
        const targetX = lane === 'left' ? -20 : 120;
        
        paw.style.transition = 'none';
        paw.setAttribute('cx', targetX);
        setTimeout(() => {
            paw.style.transition = 'cx 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            paw.setAttribute('cx', lane === 'left' ? 20 : 80);
        }, 50);
    }

    checkHit(lane) {
        const laneVal = lane === 'left' ? this.LANE_LEFT : this.LANE_RIGHT;
        const centerX = this.canvas.width / 2;
        const hitAreaX = lane === 'left' ? centerX - 150 : centerX + 150;

        // Find closest target in this lane
        let closest = null;
        let minDist = Infinity;

        for (const t of this.targets) {
            if (t.lane === laneVal && !t.hit) {
                const dist = Math.abs(t.x - hitAreaX);
                if (dist < minDist && dist < this.JUDGMENT.MISS.dist) {
                    minDist = dist;
                    closest = t;
                }
            }
        }

        if (closest) {
            this.processHit(closest, minDist);
        }
    }

    processHit(target, dist) {
        let judgment = this.JUDGMENT.MISS;
        if (dist < this.JUDGMENT.PERFECT.dist) judgment = this.JUDGMENT.PERFECT;
        else if (dist < this.JUDGMENT.GOOD.dist) judgment = this.JUDGMENT.GOOD;

        if (judgment !== this.JUDGMENT.MISS) {
            target.hit = true;
            // Set diagonal flight direction
            target.vx = target.lane === this.LANE_LEFT ? -10 : 10;
            target.vy = -15; 
            
            this.score += judgment.score + (this.combo * 10);
            this.combo++;
            this.maxCombo = Math.max(this.combo, this.maxCombo);
            
            // Health recovery every 50 combo
            if (this.combo > 0 && this.combo % 50 === 0 && this.health < this.maxHealth) {
                this.health++;
                this.showFeedback('LIFE UP!', 'perfect');
            }

            this.createHitEffect(target.x, target.y, judgment.color);
            this.showFeedback(judgment.text, judgment.color);
            this.bumpCombo();
        } else {
            // Usually we wait for it to pass the center to count as MISS
            // But if they punch early and it's too far, we don't count it yet to avoid frustration
        }
        this.updateHUD();
    }

    showFeedback(text, colorClass) {
        this.hud.feedback.innerHTML = `<div class="feedback-text ${colorClass}">${text}</div>`;
    }

    bumpCombo() {
        this.hud.comboContainer.classList.remove('bump');
        void this.hud.comboContainer.offsetWidth; // Trigger reflow
        this.hud.comboContainer.classList.add('bump');
    }

    updateHUD() {
        this.hud.combo.innerText = this.combo;
        this.hud.score.innerText = this.score.toString().padStart(6, '0');
        this.hud.highScore.innerText = this.highScore.toString().padStart(6, '0');
        
        // Health
        this.hud.health.innerHTML = '';
        for (let i = 0; i < this.maxHealth; i++) {
            const fish = document.createElement('div');
            fish.innerHTML = Assets.fishIcon;
            if (i >= this.health) fish.querySelector('.fish-icon').classList.add('lost');
            this.hud.health.appendChild(fish);
        }
    }

    spawnTarget() {
        const now = performance.now();
        if (now - this.lastSpawnTime > this.spawnInterval) {
            const burstCount = Math.random() > 0.85 ? (Math.random() > 0.7 ? 3 : 2) : 1;
            const burstDelay = 250; // ms between burst targets

            for (let i = 0; i < burstCount; i++) {
                setTimeout(() => {
                    if (this.state !== 'PLAYING') return;
                    
                    const side = Math.random() > 0.5 ? this.LANE_LEFT : this.LANE_RIGHT;
                    let type = this.TYPES.NORMAL;
                    
                    const rand = Math.random();
                    if (rand > 0.92) type = this.TYPES.SIMULTANEOUS;
                    else if (rand > 0.82) type = this.TYPES.HOLD;

                    if (type === this.TYPES.SIMULTANEOUS) {
                        this.targets.push(new Target(this.LANE_LEFT, this.canvas, this.gameSpeed, this.TYPES.NORMAL, this.images));
                        this.targets.push(new Target(this.LANE_RIGHT, this.canvas, this.gameSpeed, this.TYPES.NORMAL, this.images));
                    } else {
                        const target = new Target(side, this.canvas, this.gameSpeed, type, this.images);
                        // 15% chance to be a 'stop-and-go' target
                        if (Math.random() > 0.85) target.stopDuration = 30 + Math.random() * 30;
                        this.targets.push(target);
                    }
                }, i * burstDelay);
            }
            
            this.lastSpawnTime = now;
            
            // Increase difficulty aggressively
            this.spawnInterval = Math.max(250, 1200 - (this.score / 100));
            this.gameSpeed = Math.min(22, 6 + (this.score / 3000));
        }
    }

    triggerBoss() {
        this.bossMode = true;
        this.bossHealth = this.bossMaxHealth;
        this.showFeedback('BOSS APPEARED!', 'perfect');
        
        // Clear existing targets (fly away)
        this.targets.forEach(t => {
            if (!t.hit) {
                t.hit = true;
                t.vx = (Math.random() - 0.5) * 20;
                t.vy = -20;
            }
        });
        
        setTimeout(() => {
            const boss = new Target(this.LANE_BOTH, this.canvas, 0, this.TYPES.BOSS, this.images);
            // Position boss above the cat but centered
            boss.y = 150; 
            boss.x = this.canvas.width / 2;
            this.targets.push(boss);
            this.state = 'BOSS';
        }, 1000);
    }

    handleBossHit(lane) {
        const boss = this.targets.find(t => t.type === this.TYPES.BOSS);
        if (boss) {
            this.bossHealth--;
            this.score += 100;
            this.createHitEffect(boss.x + (Math.random()-0.5)*100, boss.y + (Math.random()-0.5)*100, 'perfect');
            
            if (this.bossHealth <= 0) {
                boss.hit = true;
                this.bossMode = false;
                this.state = 'PLAYING';
                this.nextBossScore += 10000;
                this.score += 5000;
                this.showFeedback('BOSS DEFEATED!!', 'perfect');
                this.updateHUD();
            }
        }
    }

    createHitEffect(x, y, color) {
        const colors = {
            perfect: '#ffe38f',
            good: '#8fd3ff',
            miss: '#cccccc'
        };
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, colors[color]));
        }
    }

    loop(time) {
        if (this.state === 'PLAYING') {
            this.update();
            this.draw();
        }
        requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        if (this.state === 'PLAYING' || this.state === 'BOSS') {
            this.spawnTarget();
        }
        
        if (this.invincibility > 0) this.invincibility--;
        if (this.damageFlash > 0) this.damageFlash--;

        // Update targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            t.update();

            // Hold Logic
            if (t.type === this.TYPES.HOLD && !t.hit && !t.missed) {
                const centerX = this.canvas.width / 2;
                const hitAreaX = t.lane === this.LANE_LEFT ? centerX - 150 : centerX + 150;
                const dist = Math.abs(t.x - hitAreaX);

                if (dist < this.JUDGMENT.GOOD.dist) {
                    const laneKey = t.lane === this.LANE_LEFT ? 'left' : 'right';
                    if (this.keys[laneKey]) {
                        this.score += 20; // Hold score
                        if (Math.random() > 0.95) {
                            this.createHitEffect(t.x, t.y, 'perfect');
                            this.bumpCombo(); 
                        }
                    } else if (this.invincibility <= 0) {
                        // If they let go during the hold area
                        this.takeDamage();
                        t.missed = true; // Mark as missed to stop further damage from this target
                    }
                }
            }

            // Check for miss (passed center)
            const centerX = this.canvas.width / 2;
            if (!t.hit && !t.missed && t.type !== this.TYPES.BOSS) {
                const passedLeft = (t.lane === this.LANE_LEFT && t.x > centerX - 50);
                const passedRight = (t.lane === this.LANE_RIGHT && t.x < centerX + 50);
                
                if (passedLeft || passedRight) {
                    t.missed = true;
                    if (this.invincibility <= 0) {
                        this.takeDamage();
                        this.showFeedback('MISS...', 'miss');
                    }
                }
            }

            // Remove off-screen
            if (t.x < -200 || t.x > this.canvas.width + 200 || (t.hit && t.opacity <= 0)) {
                this.targets.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }

    takeDamage() {
        this.health--;
        this.combo = 0;
        this.damageFlash = 10;
        this.invincibility = 30; // ~0.5s of invincibility
        this.updateHUD();
        if (this.health <= 0) this.gameOver();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Damage Flash
        if (this.damageFlash > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageFlash / 20})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Boss Health Bar
        if (this.state === 'BOSS' && this.bossMode) {
            const boss = this.targets.find(t => t.type === this.TYPES.BOSS);
            if (boss && !boss.hit) {
                const barWidth = 300;
                const healthWidth = (this.bossHealth / this.bossMaxHealth) * barWidth;
                this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                this.ctx.fillRect(this.canvas.width/2 - barWidth/2, 50, barWidth, 20);
                this.ctx.fillStyle = 'var(--accent-pink)';
                this.ctx.fillRect(this.canvas.width/2 - barWidth/2, 50, healthWidth, 20);
                this.ctx.strokeStyle = '#fff';
                this.ctx.strokeRect(this.canvas.width/2 - barWidth/2, 50, barWidth, 20);
            }
        }
        for (const t of this.targets) {
            t.draw(this.ctx);
        }

        // Draw particles
        for (const p of this.particles) {
            p.draw(this.ctx);
        }
    }
}

class Target {
    constructor(lane, canvas, speed, type = 'normal', imageRepo) {
        this.lane = lane;
        this.speed = speed;
        this.canvas = canvas;
        this.type = type;
        this.y = canvas.height - 250; // Higher slide position
        this.hit = false;
        this.missed = false;
        this.opacity = 1;
        this.rotation = 0;
        
        if (lane === 0) { // Left
            this.x = -100;
            this.vx = speed;
        } else if (lane === 1) { // Right
            this.x = canvas.width + 100;
            this.vx = -speed;
        } else { // Center (Boss)
            this.x = canvas.width / 2;
            this.vx = 0;
        }
        this.vy = 0;
        this.stopDuration = 0;
        this.stopped = false;
        
        // Randomize speed slightly for irregularity
        this.vx *= (0.9 + Math.random() * 0.3);

        // Asset mapping
        let assetKey = 'toyYarn';
        if (type === 'hold') assetKey = 'toyRibbon';
        else if (type === 'boss') assetKey = 'bossRobotDog';
        else {
            if (window.game && window.game.joiMode) {
                assetKey = 'toyFish';
            } else {
                assetKey = Math.random() > 0.5 ? 'toyYarn' : 'toyMouse';
            }
        }

        this.img = imageRepo[assetKey];
    }

    update() {
        if (!this.hit) {
            // Stop-and-Go logic
            if (this.stopDuration > 0) {
                const centerX = this.canvas.width / 2;
                const distToCenter = Math.abs(this.x - centerX);
                if (distToCenter < 300 && distToCenter > 200 && !this.stopped) {
                    this.stopped = true;
                }
            }

            if (this.stopped && this.stopDuration > 0) {
                this.stopDuration--;
                return; // Don't move while stopped
            }

            this.x += this.vx;
            if (this.type !== 'boss') this.rotation += this.vx * 0.05;
            else this.rotation = Math.sin(performance.now() / 100) * 0.1; // Boss wobble
        } else {
            this.opacity -= 0.03;
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.5; // Gravity
            this.rotation += 0.2;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        let size = 60;
        if (this.type === 'boss') size = 150;
        else if (this.type === 'hold') size = 80;

        if (this.img.complete) {
            ctx.drawImage(this.img, -size/2, -size/2, size, size);
        }
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.size = Math.random() * 5 + 2;
        this.life = 1.0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Start Game
window.onload = () => {
    window.game = new Game();
};
