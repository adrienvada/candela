/**
 * CANDELA 2D - Game Engine
 * High-performance 2D Tactical Split-Screen Shooter
 * Pure HTML5 Canvas & Web Audio API (Vanilla JS)
 */

// ==========================================
// 1. AUDIO ENGINE (Web Audio API Synthesizer)
// ==========================================
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playShoot() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        // 1. Noise burst for gun powder bang
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1200, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.15);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        // 2. Punchy Sub-Bass Kick
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);

        oscGain.gain.setValueAtTime(0.9, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noise.start(t);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    playTorchClick(isOn) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isOn ? 1400 : 700, t);
        osc.frequency.exponentialRampToValueAtTime(isOn ? 2200 : 400, t + 0.04);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
    }

    playHit() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.12);

        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.12);
    }

    playKill() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(523.25, t); // C5
        osc1.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, t + 0.2); // G5

        osc2.frequency.setValueAtTime(130.81, t);
        osc2.frequency.linearRampToValueAtTime(40, t + 0.4);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.45);
        osc2.stop(t + 0.45);
    }

    playFootstep() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.03);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.03);
    }

    playCooldownReady() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1760, t + 0.05);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.1);
    }
}

// ==========================================
// 2. INPUT & GAMEPAD MANAGER
// ==========================================
class InputManager {
    constructor() {
        this.gamepads = [null, null];
        this.deadzone = 0.15;

        // Keyboard & Mouse State
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseButtons = { left: false, right: false };
        this.mouseActive = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
            this.mouseActive = true;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouseButtons.left = true;
            if (e.button === 2) this.mouseButtons.right = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseButtons.left = false;
            if (e.button === 2) this.mouseButtons.right = false;
        });

        window.addEventListener('contextmenu', e => e.preventDefault());

        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id, e.gamepad.index);
            this.update();
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad.id, e.gamepad.index);
            this.update();
        });
    }

    update() {
        const rawGps = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        let validGps = [];
        if (rawGps) {
            for (let i = 0; i < rawGps.length; i++) {
                const gp = rawGps[i];
                if (gp && gp.connected !== false) {
                    validGps.push(gp);
                }
            }
        }
        this.gamepads[0] = validGps[0] || null;
        this.gamepads[1] = validGps[1] || null;
    }

    applyDeadzone(x, y) {
        const mag = Math.hypot(x, y);
        if (mag < this.deadzone) return { x: 0, y: 0 };
        const norm = (mag - this.deadzone) / (1 - this.deadzone);
        return { x: (x / mag) * norm, y: (y / mag) * norm };
    }

    getPlayerInput(playerIndex, playerPos, cameraViewport) {
        this.update();
        const gp = this.gamepads[playerIndex];

        let moveX = 0;
        let moveY = 0;
        let aimAngle = null;
        let shoot = false;
        let light = false;

        // 1. GAMEPAD INPUT PROCESSING
        if (gp) {
            // Left Stick: Movement (axes 0, 1)
            const lStick = this.applyDeadzone(gp.axes[0] || 0, gp.axes[1] || 0);
            moveX = lStick.x;
            moveY = lStick.y;

            // Right Stick: 360° Aiming
            // Check standard axes [2, 3] and alternate non-standard mappings [3, 4] or [2, 5]
            let rx = 0, ry = 0;

            const rCandidate1 = this.applyDeadzone(gp.axes[2] || 0, gp.axes[3] || 0);
            if (Math.hypot(rCandidate1.x, rCandidate1.y) > 0.08) {
                rx = rCandidate1.x;
                ry = rCandidate1.y;
            } else if (gp.axes.length >= 5) {
                const rCandidate2 = this.applyDeadzone(gp.axes[3] || 0, gp.axes[4] || 0);
                if (Math.hypot(rCandidate2.x, rCandidate2.y) > 0.08) {
                    rx = rCandidate2.x;
                    ry = rCandidate2.y;
                } else if (gp.axes.length >= 6) {
                    const rCandidate3 = this.applyDeadzone(gp.axes[2] || 0, gp.axes[5] || 0);
                    if (Math.hypot(rCandidate3.x, rCandidate3.y) > 0.08) {
                        rx = rCandidate3.x;
                        ry = rCandidate3.y;
                    }
                }
            }

            if (Math.hypot(rx, ry) > 0.08) {
                aimAngle = Math.atan2(ry, rx);
                this.mouseActive = false; // Right stick overrides mouse
            }

            // Triggers: LT/L2 (Light), RT/R2 (Shoot)
            const ltVal = gp.buttons[6] ? (typeof gp.buttons[6] === 'object' ? gp.buttons[6].value : gp.buttons[6]) : 0;
            const rtVal = gp.buttons[7] ? (typeof gp.buttons[7] === 'object' ? gp.buttons[7].value : gp.buttons[7]) : 0;

            light = ltVal > 0.2 || (gp.buttons[4] && (gp.buttons[4].pressed || gp.buttons[4] === 1)); // LT or LB
            shoot = rtVal > 0.2 || (gp.buttons[5] && (gp.buttons[5].pressed || gp.buttons[5] === 1)); // RT or RB
        }

        // 2. KEYBOARD & MOUSE FALLBACK (ONLY IF NO GAMEPAD OR IF MOUSE ACTIVELY USED AND RIGHT STICK IDLE)
        if (playerIndex === 0) {
            // Keyboard Movement for P1 (if stick not used)
            if (moveX === 0 && moveY === 0) {
                if (this.keys['KeyW']) moveY -= 1;
                if (this.keys['KeyS']) moveY += 1;
                if (this.keys['KeyA']) moveX -= 1;
                if (this.keys['KeyD']) moveX += 1;

                if (moveX !== 0 && moveY !== 0) {
                    const norm = 1 / Math.sqrt(2);
                    moveX *= norm;
                    moveY *= norm;
                }
            }

            // Mouse Aiming for P1 Viewport (only if right stick is not actively aiming OR if no gamepad connected)
            if (aimAngle === null && (this.mouseActive || !gp) && cameraViewport) {
                const mouseWorldX = this.mousePos.x - cameraViewport.x + cameraViewport.camX - cameraViewport.width / 2;
                const mouseWorldY = this.mousePos.y - cameraViewport.y + cameraViewport.camY - cameraViewport.height / 2;
                aimAngle = Math.atan2(mouseWorldY - playerPos.y, mouseWorldX - playerPos.x);
            }

            if (!gp) {
                if (this.mouseButtons.left) shoot = true;
                if (this.mouseButtons.right || this.keys['Space']) light = true;
            }
        } else if (playerIndex === 1 && !gp) {
            // P2 Keyboard Controls (Arrows + IJKL Aim + O/P)
            if (this.keys['ArrowUp']) moveY -= 1;
            if (this.keys['ArrowDown']) moveY += 1;
            if (this.keys['ArrowLeft']) moveX -= 1;
            if (this.keys['ArrowRight']) moveX += 1;

            let aimX = 0, aimY = 0;
            if (this.keys['KeyI']) aimY -= 1;
            if (this.keys['KeyK']) aimY += 1;
            if (this.keys['KeyJ']) aimX -= 1;
            if (this.keys['KeyL']) aimX += 1;

            if (aimX !== 0 || aimY !== 0) {
                aimAngle = Math.atan2(aimY, aimX);
            }

            if (this.keys['KeyO'] || this.keys['Numpad0']) shoot = true;
            if (this.keys['KeyP'] || this.keys['NumpadControl']) light = true;
        }

        return { moveX, moveY, aimAngle, shoot, light, hasGamepad: !!gp };
    }

    isAnyButtonHeld(playerIndex) {
        this.update();
        const gp = this.gamepads[playerIndex];

        if (gp && gp.buttons) {
            for (let i = 0; i < gp.buttons.length; i++) {
                const btn = gp.buttons[i];
                const pressed = typeof btn === 'object' ? (btn.pressed || btn.value > 0.15) : (btn === 1);
                if (pressed) return true;
            }
        }

        // Keyboard fallbacks:
        if (playerIndex === 0) {
            if (this.keys['Space'] || this.keys['KeyW'] || this.keys['KeyA'] || this.keys['KeyS'] || this.keys['KeyD'] || this.keys['KeyE'] || this.keys['Enter']) return true;
        } else {
            if (this.keys['KeyO'] || this.keys['KeyP'] || this.keys['ArrowUp'] || this.keys['ArrowDown'] || this.keys['ArrowLeft'] || this.keys['ArrowRight'] || this.keys['Enter']) return true;
        }

        return false;
    }
}

// ==========================================
// 3. MAP & GEOMETRY (WALLS & RAYCASTING)
// ==========================================
class LineSegment {
    constructor(x1, y1, x2, y2) {
        this.p1 = { x: x1, y: y1 };
        this.p2 = { x: x2, y: y2 };
    }
}

class TacticalMap {
    constructor() {
        this.width = 1400;
        this.height = 1400;
        this.segments = [];
        this.obstacles = [];

        this.buildMap('SQUARE');
    }

    buildMap(mapType = 'SQUARE') {
        this.segments = [];
        this.obstacles = [];

        // Outer Boundary Square Arena Walls
        this.addWall(0, 0, this.width, 0);
        this.addWall(this.width, 0, this.width, this.height);
        this.addWall(this.width, this.height, 0, this.height);
        this.addWall(0, this.height, 0, 0);

        if (mapType === 'RANDOM') {
            this.generateProceduralCover();
        }
    }

    generateProceduralCover() {
        // Generates at most 1 obstacle element positioned with 100% rotational symmetry for P1 and P2!
        const cx = 700;
        const cy = 700;

        const mode = Math.floor(Math.random() * 3);

        if (mode === 0) {
            // Option 0: Single Central Square Obstacle / Pillar (Self-Symmetric)
            const size = 90 + Math.floor(Math.random() * 50);
            this.addRectObstacle(cx - size / 2, cy - size / 2, size, size);
        } else if (mode === 1) {
            // Option 1: Symmetric Pair of Crates (1 for P1 side, 1 for P2 side)
            const rx = 360 + Math.floor(Math.random() * 220); // x between 360 and 580
            const ry = 280 + Math.floor(Math.random() * 280); // y between 280 and 560
            const w = 90 + Math.floor(Math.random() * 40);
            const h = 90 + Math.floor(Math.random() * 40);

            // P1 side crate
            this.addRectObstacle(rx, ry, w, h);
            // P2 side symmetric twin crate
            this.addRectObstacle(this.width - rx - w, this.height - ry - h, w, h);
        } else {
            // Option 2: Symmetric Pair of L-Walls (Rotated 180° across center)
            const rx = 380 + Math.floor(Math.random() * 200);
            const ry = 300 + Math.floor(Math.random() * 250);
            const len = 130 + Math.floor(Math.random() * 40);

            // P1 L-Wall
            this.addWall(rx, ry, rx + len, ry);
            this.addWall(rx, ry, rx, ry + len);

            // P2 Symmetric L-Wall
            this.addWall(this.width - rx - len, this.height - ry, this.width - rx, this.height - ry);
            this.addWall(this.width - rx, this.height - ry - len, this.width - rx, this.height - ry);
        }
    }

    addWall(x1, y1, x2, y2) {
        const seg = new LineSegment(x1, y1, x2, y2);
        this.segments.push(seg);
    }

    addRectObstacle(x, y, w, h) {
        this.obstacles.push({ x, y, w, h });
        this.addWall(x, y, x + w, y);
        this.addWall(x + w, y, x + w, y + h);
        this.addWall(x + w, y + h, x, y + h);
        this.addWall(x, y + h, x, y);
    }
}

// 2D Raycasting Engine for Light & Shadows
class RaycastEngine {
    static getIntersection(ray, segment) {
        const r_px = ray.a.x;
        const r_py = ray.a.y;
        const r_dx = ray.b.x - ray.a.x;
        const r_dy = ray.b.y - ray.a.y;

        const s_px = segment.p1.x;
        const s_py = segment.p1.y;
        const s_dx = segment.p2.x - segment.p1.x;
        const s_dy = segment.p2.y - segment.p1.y;

        const r_mag = Math.hypot(r_dx, r_dy);
        const s_mag = Math.hypot(s_dx, s_dy);

        if (r_dx / r_mag === s_dx / s_mag && r_dy / r_mag === s_dy / s_mag) {
            return null; // Parallel
        }

        const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
        const T1 = (s_px + s_dx * T2 - r_px) / r_dx;

        if (T1 < 0) return null;
        if (T2 < 0 || T2 > 1) return null;

        return {
            x: r_px + r_dx * T1,
            y: r_py + r_dy * T1,
            param: T1
        };
    }

    static calculateVisibilityPolygon(sourceX, sourceY, maxRadius, segments, fovAngle = null, fovArc = null) {
        let points = [];
        for (let i = 0; i < segments.length; i++) {
            points.push(segments[i].p1);
            points.push(segments[i].p2);
        }

        let angles = [];
        for (let i = 0; i < points.length; i++) {
            const angle = Math.atan2(points[i].y - sourceY, points[i].x - sourceX);
            angles.push(angle - 0.0001, angle, angle + 0.0001);
        }

        // Add 30 fine-grained arc steps for a smooth spotlight curve
        if (fovAngle !== null && fovArc !== null) {
            const halfFov = fovArc / 2;
            const steps = 30;
            for (let i = 0; i <= steps; i++) {
                const rel = -halfFov + (i / steps) * fovArc;
                angles.push(fovAngle + rel);
            }
        }

        let rayResults = [];

        for (let i = 0; i < angles.length; i++) {
            const angle = angles[i];
            let relAngle = 0;

            if (fovAngle !== null && fovArc !== null) {
                let diff = angle - fovAngle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                if (Math.abs(diff) > fovArc / 2 + 0.02) continue;
                relAngle = diff;
            }

            const dx = Math.cos(angle) * maxRadius;
            const dy = Math.sin(angle) * maxRadius;
            const ray = { a: { x: sourceX, y: sourceY }, b: { x: sourceX + dx, y: sourceY + dy } };

            let minParam = 1;
            let closestIntersect = null;

            for (let j = 0; j < segments.length; j++) {
                const intersect = RaycastEngine.getIntersection(ray, segments[j]);
                if (intersect && intersect.param < minParam) {
                    minParam = intersect.param;
                    closestIntersect = intersect;
                }
            }

            if (!closestIntersect) {
                closestIntersect = {
                    x: sourceX + dx,
                    y: sourceY + dy,
                    param: 1
                };
            }

            rayResults.push({
                x: closestIntersect.x,
                y: closestIntersect.y,
                angle: angle,
                relAngle: relAngle
            });
        }

        // SORT RAYS STRICTLY BY RELATIVE ANGLE TO PREVENT WRAP-AROUND DISCONTINUITIES & SPIKES
        if (fovAngle !== null) {
            rayResults.sort((a, b) => a.relAngle - b.relAngle);
        } else {
            rayResults.sort((a, b) => a.angle - b.angle);
        }

        // Form polygon starting from source origin (apex of pie slice)
        let poly = [{ x: sourceX, y: sourceY }];
        for (let i = 0; i < rayResults.length; i++) {
            poly.push({ x: rayResults[i].x, y: rayResults[i].y });
        }

        return poly;
    }

    static isPointInPolygon(px, py, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
}

// ==========================================
// 4. ENTITIES (PLAYER, BULLET, PARTICLES)
// ==========================================
class Player {
    constructor(id, name, color, startX, startY, startAngle) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.x = startX;
        this.y = startY;
        this.vx = 0;
        this.vy = 0;
        this.radius = 18;
        this.angle = startAngle;
        this.hp = 100;
        this.score = 0;

        this.speed = 260; // px/sec
        this.flashlightOn = false;
        this.flashlightFov = Math.PI * 0.42; // ~75 degrees
        this.flashlightRange = 480;

        this.shootCooldown = 0; // Cooldown timer (1.0s max)
        this.maxCooldown = 1.0;
        this.lastMuzzleFlash = 0; // Duration of light burst after firing

        this.footstepTimer = 0;
        this.screenShake = 0;
    }

    resetPosition(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = angle;
        this.hp = 100;
        this.shootCooldown = 0;
        this.flashlightOn = false;
        this.lastMuzzleFlash = 0;
    }

    update(dt, input, mapSegments, audioEngine) {
        // Cooldown timer decrease
        if (this.shootCooldown > 0) {
            const prevCd = this.shootCooldown;
            this.shootCooldown -= dt;
            if (this.shootCooldown <= 0) {
                this.shootCooldown = 0;
                audioEngine.playCooldownReady();
            }
        }

        if (this.lastMuzzleFlash > 0) {
            this.lastMuzzleFlash -= dt;
        }

        if (this.screenShake > 0) {
            this.screenShake -= dt * 10;
            if (this.screenShake < 0) this.screenShake = 0;
        }

        // Movement
        this.vx = input.moveX * this.speed;
        this.vy = input.moveY * this.speed;

        // Apply movement physics with wall collision
        const nextX = this.x + this.vx * dt;
        const nextY = this.y + this.vy * dt;

        this.moveAndCollide(nextX, nextY, mapSegments);

        // Aim angle update
        if (input.aimAngle !== null) {
            this.angle = input.aimAngle;
        }

        // Flashlight toggle
        if (input.light !== this.flashlightOn) {
            this.flashlightOn = input.light;
            audioEngine.playTorchClick(this.flashlightOn);
        }

        // Footstep sound feedback
        if (Math.hypot(this.vx, this.vy) > 20) {
            this.footstepTimer += dt;
            if (this.footstepTimer > 0.32) {
                this.footstepTimer = 0;
                audioEngine.playFootstep();
            }
        } else {
            this.footstepTimer = 0;
        }
    }

    moveAndCollide(targetX, targetY, segments) {
        let finalX = targetX;
        let finalY = targetY;

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const closest = this.getClosestPointOnSegment(finalX, finalY, seg.p1, seg.p2);
            const dist = Math.hypot(finalX - closest.x, finalY - closest.y);

            if (dist < this.radius) {
                const overlap = this.radius - dist;
                const nx = dist > 0 ? (finalX - closest.x) / dist : 1;
                const ny = dist > 0 ? (finalY - closest.y) / dist : 0;

                finalX += nx * overlap;
                finalY += ny * overlap;
            }
        }

        this.x = finalX;
        this.y = finalY;
    }

    getClosestPointOnSegment(px, py, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) return { x: p1.x, y: p1.y };

        let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        return { x: p1.x + t * dx, y: p1.y + t * dy };
    }
}

class Bullet {
    constructor(x, y, angle, ownerId) {
        this.x = x;
        this.y = y;
        this.speed = 1800; // Ultra-fast tactical projectile
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.ownerId = ownerId;
        this.radius = 5;
        this.distanceTraveled = 0;
        this.maxDistance = 10000; // Infinite range across map
        this.alive = true;
    }

    getClosestPointOnSegment(px, py, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { x: p1.x, y: p1.y };
        let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return { x: p1.x + t * dx, y: p1.y + t * dy };
    }

    update(dt, segments, players, particles, audioEngine) {
        if (!this.alive) return;

        const nextX = this.x + this.vx * dt;
        const nextY = this.y + this.vy * dt;
        const travelStep = Math.hypot(nextX - this.x, nextY - this.y);

        this.distanceTraveled += travelStep;
        if (this.distanceTraveled >= this.maxDistance) {
            this.alive = false;
            return;
        }

        // 1. Continuous collision check with players FIRST (Thick & generous 43px Hitbox!)
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (p.id === this.ownerId || p.hp <= 0) continue;

            const closest = this.getClosestPointOnSegment(p.x, p.y, { x: this.x, y: this.y }, { x: nextX, y: nextY });
            const dist = Math.hypot(p.x - closest.x, p.y - closest.y);

            const thickHitboxRadius = p.radius + this.radius + 20; // ~43px generous hit zone
            if (dist <= thickHitboxRadius) {
                this.alive = false;
                p.hp -= 50; // 2 shots to kill
                p.screenShake = 1.0;
                audioEngine.playHit();

                // Find shooter & award points!
                const shooter = players.find(pl => pl.id === this.ownerId);
                if (shooter) {
                    shooter.score += 100;
                    particles.addFloatingText(closest.x, closest.y - 15, '+100 TOUCHÉ !', shooter.color);

                    if (p.hp <= 0) {
                        shooter.score += 500;
                        particles.addFloatingText(closest.x, closest.y - 35, '+500 ÉLIMINATION !', '#00ff88');
                    }
                }

                // Hit blood/energy spark particles
                for (let k = 0; k < 14; k++) {
                    particles.addBloodSpark(p.x, p.y, Math.atan2(this.vy, this.vx));
                }
                return;
            }
        }

        // 2. Ray collision check with wall segments SECOND!
        const ray = { a: { x: this.x, y: this.y }, b: { x: nextX, y: nextY } };
        let hitWall = false;

        for (let i = 0; i < segments.length; i++) {
            const intersect = RaycastEngine.getIntersection(ray, segments[i]);
            if (intersect) {
                this.x = intersect.x;
                this.y = intersect.y;
                this.alive = false;
                hitWall = true;

                // Spark particles on wall impact
                for (let k = 0; k < 8; k++) {
                    particles.addSpark(this.x, this.y, Math.atan2(-this.vy, -this.vx) + (Math.random() - 0.5));
                }
                break;
            }
        }

        if (hitWall) return;

        this.x = nextX;
        this.y = nextY;
        particles.addBulletTrail(this.x, this.y);
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addSpark(x, y, baseAngle) {
        const angle = baseAngle + (Math.random() - 0.5) * 1.2;
        const speed = 100 + Math.random() * 200;
        this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 3.5 + Math.random() * 2,
            size: 2 + Math.random() * 2,
            color: '#ffc800'
        });
    }

    addBloodSpark(x, y, baseAngle) {
        const angle = baseAngle + (Math.random() - 0.5) * 0.8;
        const speed = 80 + Math.random() * 150;
        this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 2.0 + Math.random() * 2,
            size: 3 + Math.random() * 2,
            color: '#ff0044'
        });
    }

    addBulletTrail(x, y) {
        this.particles.push({
            x, y,
            vx: 0, vy: 0,
            life: 1.0,
            decay: 10.0,
            size: 2,
            color: 'rgba(255, 230, 150, 0.4)'
        });
    }

    addLaserTracer(x1, y1, x2, y2, color) {
        this.particles.push({
            x1: x1, y1: y1,
            x2: x2, y2: y2,
            life: 1.0,
            decay: 5.0, // Fades over ~200ms
            color: color,
            isLaser: true
        });
    }

    addFloatingText(x, y, text, color) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: -50,
            life: 1.0,
            decay: 1.2,
            text: text,
            color: color,
            isText: true
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x = (p.x || 0) + (p.vx || 0) * dt;
            p.y = (p.y || 0) + (p.vy || 0) * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.globalAlpha = Math.max(0, p.life);

            if (p.isLaser) {
                ctx.save();
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 5;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 18;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x1, p.y1);
                ctx.lineTo(p.x2, p.y2);
                ctx.stroke();

                // Inner white laser core
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(p.x1, p.y1);
                ctx.lineTo(p.x2, p.y2);
                ctx.stroke();
                ctx.restore();
            } else if (p.isText) {
                ctx.save();
                ctx.font = 'bold 15px Orbitron, sans-serif';
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
                ctx.restore();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
    }
}

// ==========================================
// 5. MAIN GAME CLASS & SPLIT-SCREEN RENDERER
// ==========================================
class CandelaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.audioEngine = new AudioEngine();
        this.inputManager = new InputManager();
        this.map = new TacticalMap();
        this.particleSystem = new ParticleSystem();

        // Spawn Players
        this.players = [
            new Player(0, 'JOUEUR 1', '#00f0ff', 200, 200, Math.PI * 0.25),
            new Player(1, 'JOUEUR 2', '#ff0055', 1200, 1200, Math.PI * 1.25)
        ];

        this.bullets = [];
        this.roundTimer = 120; // 2 minutes
        this.currentRound = 1;
        this.gameState = 'START'; // START, PLAYING, VICTORY

        this.selectedMapType = 'SQUARE'; // Default map: open square room!
        this.p1Ready = false;
        this.p2Ready = false;
        this.p1HoldTimer = 0;
        this.p2HoldTimer = 0;
        this.requiredHoldTime = 0.5; // 0.5s hold duration!

        // Start Menu Hold Timers & States
        this.startP1Ready = false;
        this.startP2Ready = false;
        this.startP1HoldTimer = 0;
        this.startP2HoldTimer = 0;

        // Dual Virtual Cursors for Controller Menu Navigation
        this.p1Cursor = { x: window.innerWidth * 0.35, y: window.innerHeight * 0.5 };
        this.p2Cursor = { x: window.innerWidth * 0.65, y: window.innerHeight * 0.5 };
        this.cursorSpeed = 950; // px/sec
        this.p1ClickPrev = false;
        this.p2ClickPrev = false;

        this.lastTime = performance.now();

        this.setupUI();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Kick off Game Loop
        requestAnimationFrame((t) => this.loop(t));
    }

    setupUI() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.startGameFromStartMenu();
        });

        // Map choice button handlers
        const btnKeep = document.getElementById('btn-keep-map');
        const btnNew = document.getElementById('btn-new-map');

        if (btnKeep && btnNew) {
            btnKeep.addEventListener('click', () => {
                this.selectedMapType = 'SQUARE';
                btnKeep.classList.add('active');
                btnNew.classList.remove('active');
                this.audioEngine.playTorchClick(true);
            });

            btnNew.addEventListener('click', () => {
                this.selectedMapType = 'RANDOM';
                btnNew.classList.add('active');
                btnKeep.classList.remove('active');
                this.audioEngine.playTorchClick(true);
            });
        }

        document.getElementById('btn-next-round').addEventListener('click', () => {
            this.startNextRound();
        });
    }

    startGameFromStartMenu() {
        this.audioEngine.init();
        document.getElementById('start-overlay').classList.add('hidden');
        this.gameState = 'PLAYING';
        this.resetRound();
    }

    startNextRound() {
        document.getElementById('victory-modal').classList.add('hidden');
        this.currentRound++;
        this.map.buildMap(this.selectedMapType);
        this.resetRound();
        this.gameState = 'PLAYING';
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    resetRound() {
        this.players[0].resetPosition(200, 200, Math.PI * 0.25);
        this.players[1].resetPosition(1200, 1200, Math.PI * 1.25);
        this.bullets = [];
        this.roundTimer = 120;

        // Hide virtual cursors when round starts
        const elP1Cursor = document.getElementById('cursor-p1');
        const elP2Cursor = document.getElementById('cursor-p2');
        if (elP1Cursor) elP1Cursor.classList.add('hidden');
        if (elP2Cursor) elP2Cursor.classList.add('hidden');
    }

    shootGun(player) {
        if (player.shootCooldown > 0) return;

        player.shootCooldown = player.maxCooldown;
        player.lastMuzzleFlash = 0.5; // 0.5s gradual light bloom fade (2.0s / 4)!
        player.screenShake = 0.8;

        const barrelOffset = player.radius + 10;
        const startX = player.x + Math.cos(player.angle) * barrelOffset;
        const startY = player.y + Math.sin(player.angle) * barrelOffset;

        // Cast ray across entire map in direction player.angle (up to 3500px)
        const maxDist = 3500;
        const endX = startX + Math.cos(player.angle) * maxDist;
        const endY = startY + Math.sin(player.angle) * maxDist;
        const fullRay = { a: { x: startX, y: startY }, b: { x: endX, y: endY } };

        // 1. Find Wall Intersection Point
        let wallHitPoint = { x: endX, y: endY };
        let minWallParam = 1.0;

        for (let i = 0; i < this.map.segments.length; i++) {
            const intersect = RaycastEngine.getIntersection(fullRay, this.map.segments[i]);
            if (intersect && intersect.param < minWallParam) {
                minWallParam = intersect.param;
                wallHitPoint = { x: intersect.x, y: intersect.y };
            }
        }

        const shotSegment = { p1: { x: startX, y: startY }, p2: wallHitPoint };

        // 2. Check ALL opponent players against this full shotSegment with a generous 48px hitbox!
        let hitOpponent = null;
        let minOppDist = Infinity;
        let oppImpactPoint = null;

        for (let i = 0; i < this.players.length; i++) {
            const target = this.players[i];
            if (target.id === player.id || target.hp <= 0) continue;

            const closest = player.getClosestPointOnSegment(target.x, target.y, shotSegment.p1, shotSegment.p2);
            const dist = Math.hypot(target.x - closest.x, target.y - closest.y);

            const generousHitbox = target.radius + 30; // ~48px total thick hit zone!
            if (dist <= generousHitbox) {
                const distFromBarrel = Math.hypot(closest.x - startX, closest.y - startY);
                if (distFromBarrel < minOppDist) {
                    minOppDist = distFromBarrel;
                    hitOpponent = target;
                    oppImpactPoint = closest;
                }
            }
        }

        let finalImpactX = wallHitPoint.x;
        let finalImpactY = wallHitPoint.y;

        if (hitOpponent && oppImpactPoint) {
            finalImpactX = oppImpactPoint.x;
            finalImpactY = oppImpactPoint.y;

            // Apply Damage & Score!
            hitOpponent.hp -= 50; // 2 shots to kill
            hitOpponent.screenShake = 1.0;
            this.audioEngine.playHit();

            player.score += 100;
            this.particleSystem.addFloatingText(oppImpactPoint.x, oppImpactPoint.y - 15, '+100 TOUCHÉ !', player.color);

            if (hitOpponent.hp <= 0) {
                player.score += 500;
                this.particleSystem.addFloatingText(oppImpactPoint.x, oppImpactPoint.y - 35, '+500 ÉLIMINATION !', '#00ff88');
            }

            // Blood / Energy impact sparks
            for (let k = 0; k < 14; k++) {
                this.particleSystem.addBloodSpark(oppImpactPoint.x, oppImpactPoint.y, player.angle);
            }
        } else {
            // Wall impact sparks
            for (let k = 0; k < 8; k++) {
                this.particleSystem.addSpark(wallHitPoint.x, wallHitPoint.y, player.angle + Math.PI);
            }
        }

        // Add glowing laser tracer beam particle across full trajectory
        this.particleSystem.addLaserTracer(startX, startY, finalImpactX, finalImpactY, player.color);

        this.audioEngine.playShoot();
    }

    updateMenuCursors(dt) {
        const elP1Cursor = document.getElementById('cursor-p1');
        const elP2Cursor = document.getElementById('cursor-p2');

        if (this.gameState === 'PLAYING') {
            if (elP1Cursor) elP1Cursor.classList.add('hidden');
            if (elP2Cursor) elP2Cursor.classList.add('hidden');
            return;
        }

        if (elP1Cursor) elP1Cursor.classList.remove('hidden');
        if (elP2Cursor) elP2Cursor.classList.remove('hidden');

        const inP1 = this.inputManager.getPlayerInput(0, this.players[0], null);
        const inP2 = this.inputManager.getPlayerInput(1, this.players[1], null);

        // Update P1 Cursor position
        this.p1Cursor.x = Math.max(12, Math.min(window.innerWidth - 12, this.p1Cursor.x + inP1.moveX * this.cursorSpeed * dt));
        this.p1Cursor.y = Math.max(12, Math.min(window.innerHeight - 12, this.p1Cursor.y + inP1.moveY * this.cursorSpeed * dt));

        // Update P2 Cursor position
        this.p2Cursor.x = Math.max(12, Math.min(window.innerWidth - 12, this.p2Cursor.x + inP2.moveX * this.cursorSpeed * dt));
        this.p2Cursor.y = Math.max(12, Math.min(window.innerHeight - 12, this.p2Cursor.y + inP2.moveY * this.cursorSpeed * dt));

        if (elP1Cursor) {
            elP1Cursor.style.left = `${this.p1Cursor.x}px`;
            elP1Cursor.style.top = `${this.p1Cursor.y}px`;
        }
        if (elP2Cursor) {
            elP2Cursor.style.left = `${this.p2Cursor.x}px`;
            elP2Cursor.style.top = `${this.p2Cursor.y}px`;
        }

        // P1 Virtual Click on UI Buttons
        const p1Press = inP1.shoot || this.inputManager.isAnyButtonHeld(0);
        if (p1Press && !this.p1ClickPrev) {
            const targetP1 = document.elementFromPoint(this.p1Cursor.x, this.p1Cursor.y);
            if (targetP1) {
                const btn = targetP1.closest('button, .btn-primary, .btn-map');
                if (btn) {
                    btn.click();
                    this.audioEngine.playTorchClick(true);
                }
            }
        }
        this.p1ClickPrev = p1Press;

        // P2 Virtual Click on UI Buttons
        const p2Press = inP2.shoot || this.inputManager.isAnyButtonHeld(1);
        if (p2Press && !this.p2ClickPrev) {
            const targetP2 = document.elementFromPoint(this.p2Cursor.x, this.p2Cursor.y);
            if (targetP2) {
                const btn = targetP2.closest('button, .btn-primary, .btn-map');
                if (btn) {
                    btn.click();
                    this.audioEngine.playTorchClick(true);
                }
            }
        }
        this.p2ClickPrev = p2Press;
    }

    updateStartReadyLoop(dt) {
        // Player 1 Hold Detection
        if (this.inputManager.isAnyButtonHeld(0)) {
            this.startP1HoldTimer += dt;
        } else if (!this.startP1Ready) {
            this.startP1HoldTimer = Math.max(0, this.startP1HoldTimer - dt * 2.5);
        }

        const p1Prog = Math.min(1.0, this.startP1HoldTimer / this.requiredHoldTime);
        if (p1Prog >= 1.0 && !this.startP1Ready) {
            this.startP1Ready = true;
            this.audioEngine.playTorchClick(true);
        }
        this.updateStartReadyUI(0, this.startP1Ready, p1Prog);

        // Player 2 Hold Detection
        if (this.inputManager.isAnyButtonHeld(1)) {
            this.startP2HoldTimer += dt;
        } else if (!this.startP2Ready) {
            this.startP2HoldTimer = Math.max(0, this.startP2HoldTimer - dt * 2.5);
        }

        const p2Prog = Math.min(1.0, this.startP2HoldTimer / this.requiredHoldTime);
        if (p2Prog >= 1.0 && !this.startP2Ready) {
            this.startP2Ready = true;
            this.audioEngine.playTorchClick(true);
        }
        this.updateStartReadyUI(1, this.startP2Ready, p2Prog);

        if (this.startP1Ready && this.startP2Ready) {
            this.startGameFromStartMenu();
        }
    }

    updateStartReadyUI(playerIndex, isReady, progress = 0) {
        const badgeId = playerIndex === 0 ? 'start-p1-ready-badge' : 'start-p2-ready-badge';
        const barId = playerIndex === 0 ? 'start-p1-ready-bar' : 'start-p2-ready-bar';
        const badge = document.getElementById(badgeId);
        const bar = document.getElementById(barId);
        if (!badge) return;

        const pName = playerIndex === 0 ? 'P1' : 'P2';
        if (bar) {
            bar.style.width = `${Math.floor(progress * 100)}%`;
        }

        if (isReady) {
            badge.className = 'ready-badge ready';
            badge.querySelector('.rb-text').textContent = `${pName}: PRÊT ✓`;
        } else {
            badge.className = 'ready-badge waiting';
            if (progress > 0) {
                badge.querySelector('.rb-text').textContent = `${pName}: MAINTENEZ... ${Math.floor(progress * 100)}%`;
            } else {
                badge.querySelector('.rb-text').textContent = `${pName}: MAINTENEZ UN BOUTON 🎮`;
            }
        }
    }

    update(dt) {
        // ALWAYS poll gamepads and update controller status UI at top of frame!
        this.inputManager.update();
        const gp1 = !!this.inputManager.gamepads[0];
        const gp2 = !!this.inputManager.gamepads[1];
        this.updateGamepadStatusUI(gp1, gp2);

        if (this.gameState === 'START') {
            this.updateMenuCursors(dt);
            this.updateStartReadyLoop(dt);
            return;
        }

        if (this.gameState === 'VICTORY') {
            this.updateMenuCursors(dt);
            this.updateVictoryReadyLoop(dt);
            
            // Permet aux particules de sang/texte de continuer de s'animer
            this.particleSystem.update(dt);
            
            // Réduit le tremblement de l'écran (camera shake) pour qu'il ne reste pas figé
            if (this.players[0].screenShake > 0) {
                this.players[0].screenShake = Math.max(0, this.players[0].screenShake - dt * 10);
            }
            if (this.players[1].screenShake > 0) {
                this.players[1].screenShake = Math.max(0, this.players[1].screenShake - dt * 10);
            }
            return;
        }

        if (this.gameState !== 'PLAYING') return;

        // Round Timer
        this.roundTimer -= dt;
        if (this.roundTimer <= 0) {
            this.roundTimer = 0;
            this.triggerRoundEnd(null, "TEMPS ÉCOULÉ - ÉGALITÉ");
        }

        const viewWidth = this.canvas.width / 2;
        const viewHeight = this.canvas.height;

        const vP1 = { x: 0, y: 0, width: viewWidth, height: viewHeight, camX: this.players[0].x, camY: this.players[0].y };
        const vP2 = { x: viewWidth, y: 0, width: viewWidth, height: viewHeight, camX: this.players[1].x, camY: this.players[1].y };

        const inP1 = this.inputManager.getPlayerInput(0, this.players[0], vP1);
        const inP2 = this.inputManager.getPlayerInput(1, this.players[1], vP2);

        this.players[0].update(dt, inP1, this.map.segments, this.audioEngine);
        this.players[1].update(dt, inP2, this.map.segments, this.audioEngine);

        if (inP1.shoot) this.shootGun(this.players[0]);
        if (inP2.shoot) this.shootGun(this.players[1]);

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt, this.map.segments, this.players, this.particleSystem, this.audioEngine);
            if (!b.alive) {
                this.bullets.splice(i, 1);
            }
        }

        this.particleSystem.update(dt);

        if (this.players[0].hp <= 0) {
            this.players[1].score++;
            this.audioEngine.playKill();
            this.triggerRoundEnd(this.players[1], "ATTACK FROM SHADOWS");
        } else if (this.players[1].hp <= 0) {
            this.players[0].score++;
            this.audioEngine.playKill();
            this.triggerRoundEnd(this.players[0], "ATTACK FROM SHADOWS");
        }

        this.updateGamepadStatusUI(inP1.hasGamepad, inP2.hasGamepad);
    }

    updateVictoryReadyLoop(dt) {
        // Player 1 Hold Detection
        if (this.inputManager.isAnyButtonHeld(0)) {
            this.p1HoldTimer += dt;
        } else if (!this.p1Ready) {
            this.p1HoldTimer = Math.max(0, this.p1HoldTimer - dt * 2.5);
        }

        const p1Prog = Math.min(1.0, this.p1HoldTimer / this.requiredHoldTime);
        if (p1Prog >= 1.0 && !this.p1Ready) {
            this.p1Ready = true;
            this.audioEngine.playTorchClick(true);
        }
        this.updateReadyUI(0, this.p1Ready, p1Prog);

        // Player 2 Hold Detection
        if (this.inputManager.isAnyButtonHeld(1)) {
            this.p2HoldTimer += dt;
        } else if (!this.p2Ready) {
            this.p2HoldTimer = Math.max(0, this.p2HoldTimer - dt * 2.5);
        }

        const p2Prog = Math.min(1.0, this.p2HoldTimer / this.requiredHoldTime);
        if (p2Prog >= 1.0 && !this.p2Ready) {
            this.p2Ready = true;
            this.audioEngine.playTorchClick(true);
        }
        this.updateReadyUI(1, this.p2Ready, p2Prog);

        if (this.p1Ready && this.p2Ready) {
            this.startNextRound();
        }
    }

    updateReadyUI(playerIndex, isReady, progress = 0) {
        const badgeId = playerIndex === 0 ? 'p1-ready-badge' : 'p2-ready-badge';
        const barId = playerIndex === 0 ? 'p1-ready-bar' : 'p2-ready-bar';
        const badge = document.getElementById(badgeId);
        const bar = document.getElementById(barId);
        if (!badge) return;

        const pName = playerIndex === 0 ? 'P1' : 'P2';
        if (bar) {
            bar.style.width = `${Math.floor(progress * 100)}%`;
        }

        if (isReady) {
            badge.className = 'ready-badge ready';
            badge.querySelector('.rb-text').textContent = `${pName}: PRÊT ✓`;
        } else {
            badge.className = 'ready-badge waiting';
            if (progress > 0) {
                badge.querySelector('.rb-text').textContent = `${pName}: MAINTENEZ... ${Math.floor(progress * 100)}%`;
            } else {
                badge.querySelector('.rb-text').textContent = `${pName}: MAINTENEZ UN BOUTON 🎮`;
            }
        }
    }

    triggerRoundEnd(winner, desc) {
        this.gameState = 'VICTORY';
        this.p1Ready = false;
        this.p2Ready = false;
        this.p1HoldTimer = 0;
        this.p2HoldTimer = 0;

        this.updateReadyUI(0, false, 0);
        this.updateReadyUI(1, false, 0);

        const modal = document.getElementById('victory-modal');
        const title = document.getElementById('victory-title');
        const descEl = document.getElementById('victory-desc');

        if (winner) {
            title.textContent = `${winner.name} REMPORTE LA MANCHE !`;
            title.style.color = winner.color;
        } else {
            title.textContent = "ÉGALITÉ !";
            title.style.color = "#ffb700";
        }

        descEl.textContent = desc;
        document.getElementById('modal-p1-score').textContent = this.players[0].score;
        document.getElementById('modal-p2-score').textContent = this.players[1].score;

        modal.classList.remove('hidden');
    }

    updateGamepadStatusUI(gp1, gp2) {
        const el1 = document.getElementById('gp1-status');
        const el2 = document.getElementById('gp2-status');

        const raw1 = this.inputManager.gamepads[0];
        const raw2 = this.inputManager.gamepads[1];

        if (gp1 && raw1) {
            const name = raw1.id ? raw1.id.split('(')[0].trim().substring(0, 22) : 'CONNECTÉE';
            el1.className = 'gp-badge connected';
            el1.querySelector('.gp-name').textContent = `M1: ${name} ✓`;
        } else {
            el1.className = 'gp-badge disconnected';
            el1.querySelector('.gp-name').textContent = 'M1: APPUYEZ SUR UN BOUTON...';
        }

        if (gp2 && raw2) {
            const name = raw2.id ? raw2.id.split('(')[0].trim().substring(0, 22) : 'CONNECTÉE';
            el2.className = 'gp-badge connected';
            el2.querySelector('.gp-name').textContent = `M2: ${name} ✓`;
        } else {
            el2.className = 'gp-badge disconnected';
            el2.querySelector('.gp-name').textContent = 'M2: APPUYEZ SUR UN BOUTON...';
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const w = this.canvas.width / 2;
        const h = this.canvas.height;

        // Render P1 Viewport (Left half)
        this.renderViewport(0, 0, w, h, this.players[0], this.players[1]);

        // Render P2 Viewport (Right half)
        this.renderViewport(w, 0, w, h, this.players[1], this.players[0]);

        // Draw Split Screen Vertical Center Divider
        this.ctx.save();
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(w, 0);
        this.ctx.lineTo(w, h);
        this.ctx.stroke();
        this.ctx.restore();

        // Update HUD Gauges
        this.renderHUD();
    }

    getPlayerSegments(player) {
        if (!player || player.hp <= 0) return [];
        const segs = [];
        const r = player.radius;
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            const a1 = (i / sides) * Math.PI * 2;
            const a2 = ((i + 1) / sides) * Math.PI * 2;
            segs.push(new LineSegment(
                player.x + Math.cos(a1) * r,
                player.y + Math.sin(a1) * r,
                player.x + Math.cos(a2) * r,
                player.y + Math.sin(a2) * r
            ));
        }
        return segs;
    }

    renderViewport(vx, vy, vw, vh, viewer, opponent) {
        this.ctx.save();

        // Clip Viewport Bounds
        this.ctx.beginPath();
        this.ctx.rect(vx, vy, vw, vh);
        this.ctx.clip();

        // Camera Shake Translation
        let shakeX = 0, shakeY = 0;
        if (viewer.screenShake > 0) {
            shakeX = (Math.random() - 0.5) * viewer.screenShake * 12;
            shakeY = (Math.random() - 0.5) * viewer.screenShake * 12;
        }

        // Camera Offset
        const camX = viewer.x - vw / 2 + shakeX;
        const camY = viewer.y - vh / 2 + shakeY;

        this.ctx.translate(vx - camX, vy - camY);

        // 1. Draw Floor Grid
        this.drawFloorGrid(camX, camY, vw, vh);

        // 2. Compute Visibility Light Polygons (Including opponent obstacle segments for dynamic player shadows!)
        let viewerLightPoly = null;
        let opponentLightPoly = null;

        const segsForViewer = [...this.map.segments, ...this.getPlayerSegments(opponent)];
        const segsForOpponent = [...this.map.segments, ...this.getPlayerSegments(viewer)];

        if (viewer.flashlightOn) {
            viewerLightPoly = RaycastEngine.calculateVisibilityPolygon(
                viewer.x, viewer.y, viewer.flashlightRange, segsForViewer, viewer.angle, viewer.flashlightFov
            );
        }

        if (opponent.flashlightOn) {
            opponentLightPoly = RaycastEngine.calculateVisibilityPolygon(
                opponent.x, opponent.y, opponent.flashlightRange, segsForOpponent, opponent.angle, opponent.flashlightFov
            );
        }

        // 3. DARKNESS FOG LAYER (Canvas Composite Operation)
        const offCanvas = document.createElement('canvas');
        offCanvas.width = vw;
        offCanvas.height = vh;
        const offCtx = offCanvas.getContext('2d');

        // Fill pitch black
        offCtx.fillStyle = 'rgba(4, 7, 14, 0.88)';
        offCtx.fillRect(0, 0, vw, vh);

        offCtx.save();
        offCtx.translate(-camX, -camY);
        offCtx.globalCompositeOperation = 'destination-out';

        // Cut Viewer Flashlight Beam
        if (viewerLightPoly && viewerLightPoly.length > 0) {
            offCtx.beginPath();
            offCtx.moveTo(viewerLightPoly[0].x, viewerLightPoly[0].y);
            for (let i = 1; i < viewerLightPoly.length; i++) {
                offCtx.lineTo(viewerLightPoly[i].x, viewerLightPoly[i].y);
            }
            offCtx.closePath();
            offCtx.fill();
        }

        // Cut Opponent Flashlight Beam (if ON)
        if (opponentLightPoly && opponentLightPoly.length > 0) {
            offCtx.beginPath();
            offCtx.moveTo(opponentLightPoly[0].x, opponentLightPoly[0].y);
            for (let i = 1; i < opponentLightPoly.length; i++) {
                offCtx.lineTo(opponentLightPoly[i].x, opponentLightPoly[i].y);
            }
            offCtx.closePath();
            offCtx.fill();
        }

        // Cut Ambient Self Halo around Viewer (So player can see immediate feet)
        offCtx.beginPath();
        offCtx.arc(viewer.x, viewer.y, 50, 0, Math.PI * 2);
        offCtx.fill();

        // Cut Muzzle Flash Light Spheres (0.5s gradual fade)
        if (viewer.lastMuzzleFlash > 0) {
            const ratio = viewer.lastMuzzleFlash / 0.5;
            const flashRadius = 40 + ratio * 180;
            offCtx.save();
            offCtx.globalAlpha = Math.max(0, ratio);
            offCtx.beginPath();
            offCtx.arc(viewer.x, viewer.y, flashRadius, 0, Math.PI * 2);
            offCtx.fill();
            offCtx.restore();
        }

        if (opponent.lastMuzzleFlash > 0) {
            const ratio = opponent.lastMuzzleFlash / 0.5;
            const flashRadius = 40 + ratio * 180;
            offCtx.save();
            offCtx.globalAlpha = Math.max(0, ratio);
            offCtx.beginPath();
            offCtx.arc(opponent.x, opponent.y, flashRadius, 0, Math.PI * 2);
            offCtx.fill();
            offCtx.restore();
        }

        // Cut Bullet Spark Lights
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            offCtx.beginPath();
            offCtx.arc(b.x, b.y, 35, 0, Math.PI * 2);
            offCtx.fill();
        }

        offCtx.restore();

        // 4. Draw Map Obstacles
        this.drawMapObstacles();

        // 5. Overlay the Darkness Fog Buffer on Viewport (Under Avatars & Particles)
        this.ctx.drawImage(offCanvas, camX, camY);

        // 6. Draw Light Beams Aesthetics (Glow Gradients)
        this.drawFlashlightGlow(viewer, viewerLightPoly);
        if (opponent.flashlightOn) {
            this.drawFlashlightGlow(opponent, opponentLightPoly);
        }

        // 7. Draw Bullets & Particles
        for (let i = 0; i < this.bullets.length; i++) {
            this.drawBullet(this.bullets[i]);
        }
        this.particleSystem.draw(this.ctx);

        // 8. GOLD RULE CHECK: IS OPPONENT VISIBLE TO VIEWER?
        const isOpponentLit = this.checkIsOpponentLit(viewer, opponent, viewerLightPoly, opponentLightPoly);

        if (isOpponentLit && opponent.hp > 0) {
            this.drawPlayerAvatar(opponent, true);
        }

        // Always draw Viewer Avatar
        if (viewer.hp > 0) {
            this.drawPlayerAvatar(viewer, false);
        }

        this.ctx.restore();
    }

    checkIsOpponentLit(viewer, opponent, viewerLightPoly, opponentLightPoly) {
        if (!opponent || opponent.hp <= 0) return false;

        // 1. Is opponent inside Viewer's Flashlight Cone (with Line-of-Sight)?
        if (viewer.flashlightOn) {
            const dist = Math.hypot(opponent.x - viewer.x, opponent.y - viewer.y);
            if (dist <= viewer.flashlightRange) {
                const angleToOpp = Math.atan2(opponent.y - viewer.y, opponent.x - viewer.x);
                let diff = angleToOpp - viewer.angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                if (Math.abs(diff) <= viewer.flashlightFov / 2 + 0.15) {
                    // Check if map walls block line of sight between viewer and opponent
                    const losRay = { a: { x: viewer.x, y: viewer.y }, b: { x: opponent.x, y: opponent.y } };
                    let wallBlocked = false;
                    for (let i = 0; i < this.map.segments.length; i++) {
                        const intersect = RaycastEngine.getIntersection(losRay, this.map.segments[i]);
                        if (intersect && intersect.param > 0.02 && intersect.param < 0.98) {
                            wallBlocked = true;
                            break;
                        }
                    }
                    if (!wallBlocked) return true;
                }
            }
        }

        // 2. Is opponent's OWN Flashlight turned ON? (Self-betrayal!)
        if (opponent.flashlightOn) {
            return true;
        }

        // 3. Did opponent just fire a shot (Muzzle Flash)?
        if (opponent.lastMuzzleFlash > 0) {
            return true;
        }

        // 4. Is opponent within close proximity of viewer's feet halo?
        if (Math.hypot(viewer.x - opponent.x, viewer.y - opponent.y) < 65) {
            return true;
        }

        return false;
    }

    drawFloorGrid(camX, camY, vw, vh) {
        const tileSize = 60;
        const startX = Math.floor(camX / tileSize) * tileSize;
        const startY = Math.floor(camY / tileSize) * tileSize;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        for (let x = startX; x < camX + vw + tileSize; x += tileSize) {
            this.ctx.moveTo(x, camY);
            this.ctx.lineTo(x, camY + vh);
        }
        for (let y = startY; y < camY + vh + tileSize; y += tileSize) {
            this.ctx.moveTo(camX, y);
            this.ctx.lineTo(camX + vw, y);
        }
        this.ctx.stroke();

        // Soft tactical ambient glows in arena center and corners
        this.ctx.save();
        const centerGlow = this.ctx.createRadialGradient(700, 700, 20, 700, 700, 500);
        centerGlow.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
        centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = centerGlow;
        this.ctx.fillRect(200, 200, 1000, 1000);
        this.ctx.restore();
    }

    drawFlashlightGlow(player, lightPoly) {
        if (!player.flashlightOn || !lightPoly || lightPoly.length === 0) return;

        this.ctx.save();
        const grad = this.ctx.createRadialGradient(
            player.x, player.y, 10,
            player.x, player.y, player.flashlightRange
        );
        grad.addColorStop(0, 'rgba(255, 240, 200, 0.8)');
        grad.addColorStop(0.3, 'rgba(255, 220, 150, 0.4)');
        grad.addColorStop(1, 'rgba(255, 200, 100, 0.0)');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(lightPoly[0].x, lightPoly[0].y);
        for (let i = 1; i < lightPoly.length; i++) {
            this.ctx.lineTo(lightPoly[i].x, lightPoly[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawMapObstacles() {
        this.ctx.save();
        this.ctx.fillStyle = '#0f172a';
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < this.map.obstacles.length; i++) {
            const obs = this.map.obstacles[i];
            this.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            this.ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }

        // Draw Line Segments / Walls
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        for (let i = 0; i < this.map.segments.length; i++) {
            const s = this.map.segments[i];
            this.ctx.moveTo(s.p1.x, s.p1.y);
            this.ctx.lineTo(s.p2.x, s.p2.y);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawBullet(bullet) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffe600';
        this.ctx.shadowColor = '#ffe600';
        this.ctx.shadowBlur = 12;

        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPlayerAvatar(player, isOpponent = false) {
        this.ctx.save();

        const isRevealed = (player.id === 0) ? 
            this.checkIsOpponentLit(this.players[1], this.players[0], null, null) :
            this.checkIsOpponentLit(this.players[0], this.players[1], null, null);

        // When character is hidden in shadows, set avatar opacity to 20% (stealth ghost appearance)
        // When revealed (flashlight ON, illuminated, or shooting), opacity becomes 100% full vibrant neon!
        if (!isRevealed && !isOpponent) {
            this.ctx.globalAlpha = 0.20; // 20% opacity when hidden!
        } else {
            this.ctx.globalAlpha = 1.0;  // 100% full vibrant opacity when revealed!
        }

        // Shadow / Feet
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y + 4, player.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Player Body Circle
        this.ctx.fillStyle = isOpponent ? '#060810' : player.color;
        this.ctx.shadowColor = player.color;
        this.ctx.shadowBlur = isOpponent ? 18 : (isRevealed ? 18 : 2);
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner Tactical Ring
        this.ctx.strokeStyle = player.color;
        this.ctx.lineWidth = isOpponent ? 3 : 2;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius - 3, 0, Math.PI * 2);
        this.ctx.stroke();

        // Gun Barrel / Directional Aim Line
        const barrelLen = player.radius + 14;
        const bx = player.x + Math.cos(player.angle) * barrelLen;
        const by = player.y + Math.sin(player.angle) * barrelLen;

        this.ctx.strokeStyle = isOpponent ? player.color : '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(player.x, player.y);
        this.ctx.lineTo(bx, by);
        this.ctx.stroke();

        // Muzzle Flash Light Flare
        if (player.lastMuzzleFlash > 0) {
            const flashRatio = player.lastMuzzleFlash / 0.5;
            this.ctx.fillStyle = '#fff7b8';
            this.ctx.shadowColor = '#ffea00';
            this.ctx.shadowBlur = 24 * flashRatio;
            this.ctx.beginPath();
            this.ctx.arc(bx, by, 6 + 10 * flashRatio, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Reset globalAlpha to 1.0 for name tag and health bar so text stays clear
        this.ctx.globalAlpha = 1.0;

        // Player Name Tag & Health Bar Overlay
        this.ctx.shadowBlur = 0;
        this.ctx.font = 'bold 11px Orbitron, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, player.x, player.y - player.radius - 12);

        // Health bar above head
        const barW = 36;
        const barH = 4;
        const barX = player.x - barW / 2;
        const barY = player.y - player.radius - 8;

        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(barX, barY, barW, barH);
        this.ctx.fillStyle = player.hp > 50 ? '#00ff88' : '#ff0055';
        this.ctx.fillRect(barX, barY, (player.hp / 100) * barW, barH);

        this.ctx.restore();
    }

    renderHUD() {
        // P1 Stats
        document.getElementById('p1-hp').style.width = `${Math.max(0, this.players[0].hp)}%`;
        document.getElementById('p1-score').textContent = this.players[0].score;

        const p1CdRatio = 1 - (this.players[0].shootCooldown / this.players[0].maxCooldown);
        document.getElementById('p1-cd-path').setAttribute('stroke-dasharray', `${p1CdRatio * 100}, 100`);
        document.getElementById('p1-cd-text').textContent = p1CdRatio >= 1 ? 'PRÊT' : `${(this.players[0].shootCooldown).toFixed(1)}s`;

        const p1LightInd = document.getElementById('p1-light-indicator');
        p1LightInd.className = `indicator-box ${this.players[0].flashlightOn ? 'light-on' : 'light-off'}`;

        const isP1Revealed = this.checkIsOpponentLit(this.players[1], this.players[0], null, null);
        const p1StealthInd = document.getElementById('p1-stealth-indicator');
        if (p1StealthInd) {
            p1StealthInd.className = `indicator-box ${isP1Revealed ? 'stealth-revealed' : 'stealth-hidden'}`;
            p1StealthInd.querySelector('.indicator-icon').textContent = isP1Revealed ? '👁️' : '🥷';
            p1StealthInd.querySelector('.indicator-text').textContent = isP1Revealed ? 'DÉVOILÉ' : 'CACHÉ';
        }

        // P2 Stats
        document.getElementById('p2-hp').style.width = `${Math.max(0, this.players[1].hp)}%`;
        document.getElementById('p2-score').textContent = this.players[1].score;

        const p2CdRatio = 1 - (this.players[1].shootCooldown / this.players[1].maxCooldown);
        document.getElementById('p2-cd-path').setAttribute('stroke-dasharray', `${p2CdRatio * 100}, 100`);
        document.getElementById('p2-cd-text').textContent = p2CdRatio >= 1 ? 'PRÊT' : `${(this.players[1].shootCooldown).toFixed(1)}s`;

        const p2LightInd = document.getElementById('p2-light-indicator');
        p2LightInd.className = `indicator-box ${this.players[1].flashlightOn ? 'light-on' : 'light-off'}`;

        const isP2Revealed = this.checkIsOpponentLit(this.players[0], this.players[1], null, null);
        const p2StealthInd = document.getElementById('p2-stealth-indicator');
        if (p2StealthInd) {
            p2StealthInd.className = `indicator-box ${isP2Revealed ? 'stealth-revealed' : 'stealth-hidden'}`;
            p2StealthInd.querySelector('.indicator-icon').textContent = isP2Revealed ? '👁️' : '🥷';
            p2StealthInd.querySelector('.indicator-text').textContent = isP2Revealed ? 'DÉVOILÉ' : 'CACHÉ';
        }

        // Timer
        const mins = Math.floor(Math.max(0, this.roundTimer) / 60);
        const secs = Math.floor(Math.max(0, this.roundTimer) % 60);
        document.getElementById('round-timer').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('round-counter').textContent = `ROUND ${this.currentRound}`;
    }

    loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Launch Game on Window Load
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new CandelaGame();
});
