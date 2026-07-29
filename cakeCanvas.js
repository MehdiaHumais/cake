/* ==========================================================================
   DUAL MODE CAKE ENGINE (AGENTIC & IMAGE-EXACT CLASSIC CAKE)
   ========================================================================== */

class CakeEngine {
  constructor(canvasId, onCutComplete, onSliceEaten) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.onCutComplete = onCutComplete;
    this.onSliceEaten = onSliceEaten;

    this.width = 900;
    this.height = 700;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Mode: 'CLASSIC' or 'AGENTIC'
    this.mode = 'CLASSIC';

    // Cake position
    this.cakeX = this.width / 2;
    this.cakeY = this.height / 2 + 25;
    this.cakeRadius = 150;

    this.state = 'IDLE';
    this.isKnifeActive = false;

    this.cutStart = null;
    this.cutEnd = null;
    this.isMouseDown = false;
    this.mousePos = { x: 0, y: 0 };

    this.slicePos = { x: this.cakeX, y: this.cakeY };
    this.isDraggingSlice = false;
    this.dragOffset = { x: 0, y: 0 };

    this.platePos = { x: this.width - 170, y: this.height - 180 };
    this.sliceOnPlate = false;

    this.forkAnimY = 0;
    this.isForkScooping = false;

    this.bites = 0;
    this.maxBites = 1;

    this.fireworks = [];
    this.confetti = [];
    this.crumbs = [];
    this.floatingTexts = [];

    this.flameFrame = 0;

    // Classic Mode candle blown-out state
    this.candlesBlown = false;
    this.candlePuffs = []; // smoke puff particles after blowing

    this.bindEvents();
    this.animate();
  }

  setMode(modeName) {
    this.mode = modeName;
    this.resetState();
  }

  resetState() {
    this.state = 'IDLE';
    this.isKnifeActive = false;
    this.cutStart = null;
    this.cutEnd = null;
    this.isMouseDown = false;
    this.slicePos = { x: this.cakeX, y: this.cakeY };
    this.isDraggingSlice = false;
    this.bites = 0;
    this.fireworks = [];
    this.confetti = [];
    this.crumbs = [];
    this.floatingTexts = [];
    this.candlesBlown = false;
    this.candlePuffs = [];
  }

  setKnifeActive(active) {
    this.isKnifeActive = active;
    if (active) this.state = 'READY_TO_CUT';
  }

  bindEvents() {
    const getPosFromEvent = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * (this.width / rect.width),
        y: (clientY - rect.top) * (this.height / rect.height)
      };
    };

    const handlePointerStart = (e) => {
      if (this.state === 'EATEN') return;
      const pos = getPosFromEvent(e);
      this.isMouseDown = true;
      this.mousePos = pos;

      // Classic Mode: check if user clicked a candle to blow it out
      if (this.mode === 'CLASSIC' && !this.candlesBlown && this.state !== 'EATEN') {
        const bY = this.cakeY + 50;
        const bH = 65;
        const tY = bY - bH - 5;
        const tH = 55;
        const candleBaseY = tY - tH;
        const candleOffsets = [-25, 0, 25];
        for (const offX of candleOffsets) {
          const cx = this.cakeX + offX;
          const cy = candleBaseY - 20; // flame center approx
          const dist = Math.hypot(pos.x - cx, pos.y - cy);
          if (dist < 35) {
            this.blowOutCandles();
            return;
          }
        }
      }

      if (this.state === 'READY_TO_CUT') {
        const dist = Math.hypot(pos.x - this.cakeX, pos.y - this.cakeY);
        if (dist <= this.cakeRadius + 80) {
          this.state = 'CUTTING';
          this.cutStart = { x: pos.x, y: pos.y };
          this.cutEnd = { x: pos.x, y: pos.y };
          if (window.audioEngine) window.audioEngine.playLaserKnifeSound();
        }
      } 
      else if (this.state === 'CUT_DONE' || this.state === 'SLICE_DRAGGABLE') {
        const sliceDist = Math.hypot(pos.x - (this.slicePos.x + 30), pos.y - (this.slicePos.y - 20));
        if (sliceDist < 140) {
          this.isDraggingSlice = true;
          this.dragOffset = { x: pos.x - this.slicePos.x, y: pos.y - this.slicePos.y };
        }
      } 
      else if (this.state === 'ON_PLATE') {
        const plateDist = Math.hypot(pos.x - this.platePos.x, pos.y - this.platePos.y);
        if (plateDist < 180 || pos.x > this.width / 2) {
          this.triggerForkScoopAndBite(pos);
        }
      }
    };

    const handlePointerMove = (e) => {
      const pos = getPosFromEvent(e);
      this.mousePos = pos;

      if (this.isMouseDown && this.state === 'CUTTING') {
        this.cutEnd = { x: pos.x, y: pos.y };
      } 
      else if (this.isMouseDown && this.isDraggingSlice) {
        this.slicePos = {
          x: pos.x - this.dragOffset.x,
          y: pos.y - this.dragOffset.y
        };
      }
    };

    const handlePointerEnd = () => {
      if (this.state === 'CUTTING') {
        if (this.cutStart && this.cutEnd) {
          const cutLen = Math.hypot(this.cutEnd.x - this.cutStart.x, this.cutEnd.y - this.cutStart.y);
          if (cutLen > 50) {
            this.completeCut();
          } else {
            this.state = 'READY_TO_CUT';
          }
        }
      } 
      else if (this.isDraggingSlice) {
        this.isDraggingSlice = false;
        const distToPlate = Math.hypot(this.slicePos.x - this.platePos.x, this.slicePos.y - this.platePos.y);
        if (distToPlate < 180 || this.slicePos.x > this.width * 0.6) {
          this.slicePos = { x: this.platePos.x, y: this.platePos.y };
          this.state = 'ON_PLATE';
          this.sliceOnPlate = true;
          if (window.audioEngine) window.audioEngine.playLaserKnifeSound();
          const forkEl = document.getElementById('sci-fi-fork');
          if (forkEl) forkEl.classList.remove('hidden');
        }
      }
      this.isMouseDown = false;
    };

    this.canvas.addEventListener('mousedown', handlePointerStart);
    this.canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerEnd);

    this.canvas.addEventListener('touchstart', handlePointerStart, { passive: true });
    this.canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerEnd);

    this.canvas.addEventListener('click', (e) => {
      if (this.state === 'ON_PLATE') {
        const pos = getPosFromEvent(e);
        this.triggerForkScoopAndBite(pos);
      }
    });
  }

  blowOutCandles() {
    this.candlesBlown = true;
    // Spawn smoke puff particles at each candle position
    const bY = this.cakeY + 50;
    const bH = 65;
    const tY = bY - bH - 5;
    const tH = 55;
    const candleBaseY = tY - tH;
    const candleOffsets = [-25, 0, 25];
    candleOffsets.forEach(offX => {
      const cx = this.cakeX + offX;
      const cy = candleBaseY - 45;
      for (let i = 0; i < 18; i++) {
        this.candlePuffs.push({
          x: cx + (Math.random() - 0.5) * 10,
          y: cy,
          vx: (Math.random() - 0.5) * 2.5,
          vy: -(Math.random() * 2.5 + 1),
          size: Math.random() * 8 + 4,
          alpha: 0.75
        });
      }
    });
    if (window.audioEngine) window.audioEngine.playBiteSound();
  }

  completeCut() {
    this.state = 'CUT_DONE';
    this.spawnFireworks();
    this.spawnConfetti();

    if (window.audioEngine) {
      window.audioEngine.playFireworksSound();
      window.audioEngine.playApplauseSound();
    }

    if (this.onCutComplete) this.onCutComplete();
  }

  triggerForkScoopAndBite(pos) {
    if (this.bites >= this.maxBites || this.isForkScooping) return;
    this.isForkScooping = true;

    let startTime = Date.now();
    const animInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 180) {
        this.forkAnimY = (elapsed / 180) * 40;
      } else if (elapsed < 360) {
        this.forkAnimY = 40 - ((elapsed - 180) / 180) * 40;
      } else {
        clearInterval(animInterval);
        this.forkAnimY = 0;
        this.isForkScooping = false;
        this.takeBite(pos);
      }
    }, 16);
  }

  takeBite(pos) {
    if (this.bites >= this.maxBites) return;
    this.bites++;

    this.floatingTexts.push({
      text: this.mode === 'CLASSIC' ? 'DELICIOUS! 🍓' : 'SERVED! ⚡',
      x: this.platePos.x,
      y: this.platePos.y - 30,
      alpha: 1.0,
      color: this.mode === 'CLASSIC' ? '#c59b27' : '#00f3ff'
    });

    const crumbColors = this.mode === 'CLASSIC' ? ['#ee5263', '#fceea7', '#ffffff'] : ['#00f3ff', '#ff007f', '#3d1d07'];

    for (let i = 0; i < 40; i++) {
      this.crumbs.push({
        x: this.platePos.x + (Math.random() - 0.5) * 40,
        y: this.platePos.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 3,
        size: Math.random() * 6 + 2,
        color: crumbColors[Math.floor(Math.random() * crumbColors.length)],
        life: 1.0
      });
    }

    if (window.audioEngine) window.audioEngine.playBiteSound();

    this.state = 'EATEN';
    const forkEl = document.getElementById('sci-fi-fork');
    if (forkEl) forkEl.classList.add('hidden');
    if (this.onSliceEaten) this.onSliceEaten();
  }

  spawnFireworks() {
    const colors = this.mode === 'CLASSIC' ? ['#ee5263', '#c59b27', '#ffffff'] : ['#00f3ff', '#ff007f'];
    for (let i = 0; i < 6; i++) {
      const centerX = Math.random() * (this.width - 200) + 100;
      const centerY = Math.random() * (this.height / 2) + 80;
      const color = colors[i % colors.length];

      for (let j = 0; j < 45; j++) {
        const angle = (Math.PI * 2 * j) / 45;
        const speed = Math.random() * 6 + 2;
        this.fireworks.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 2,
          color: color,
          alpha: 1.0
        });
      }
    }
  }

  spawnConfetti() {
    const colors = this.mode === 'CLASSIC' ? ['#ee5263', '#c59b27', '#ffffff', '#fceea7'] : ['#00f3ff', '#ff007f', '#9d4edd', '#ffb703', '#ffffff'];
    for (let i = 0; i < 110; i++) {
      this.confetti.push({
        x: Math.random() * this.width,
        y: -Math.random() * 200,
        vx: (Math.random() - 0.5) * 2.5,
        vy: Math.random() * 3.5 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rSpeed: (Math.random() - 0.5) * 0.12
      });
    }
  }

  updateParticles() {
    // Update candle smoke puffs
    for (let i = this.candlePuffs.length - 1; i >= 0; i--) {
      const p = this.candlePuffs[i];
      p.x += p.vx;
      p.y += p.vy;
      p.size += 0.3;
      p.alpha -= 0.022;
      if (p.alpha <= 0) this.candlePuffs.splice(i, 1);
    }

    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const p = this.fireworks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.016;
      if (p.alpha <= 0) this.fireworks.splice(i, 1);
    }

    for (let i = 0; i < this.confetti.length; i++) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rSpeed;
      if (c.y > this.height) {
        c.y = -20;
        c.x = Math.random() * this.width;
      }
    }

    for (let i = this.crumbs.length - 1; i >= 0; i--) {
      const cr = this.crumbs[i];
      cr.x += cr.vx;
      cr.y += cr.vy;
      cr.vy += 0.2;
      cr.life -= 0.025;
      if (cr.life <= 0) this.crumbs.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.5;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.flameFrame += 0.08;
    this.updateParticles();

    if (this.mode === 'CLASSIC') {
      this.drawExactClassicCake();
      this.drawCandlePuffs();
    } else {
      this.drawCakeBaseGlow();
      this.drawCakeLayers();
    }

    if (this.state === 'CUTTING' && this.cutStart && this.cutEnd) {
      this.drawLaserCutLine();
    }

    if (this.isKnifeActive && (this.state === 'READY_TO_CUT' || this.state === 'CUTTING')) {
      this.drawLaserKnifeCursor();
    }

    if (this.state === 'ON_PLATE' && this.bites < this.maxBites) {
      this.drawCanvasFork();
    }

    this.drawFireworks();
    this.drawConfetti();
    this.drawCrumbs();
    this.drawFloatingTexts();

    requestAnimationFrame(() => this.animate());
  }

  // ------------------------------------------------------------------------
  // IMAGE-EXACT CLASSIC 2-TIER CAKE RENDERING (IMAGE 3)
  // ------------------------------------------------------------------------
  drawExactClassicCake() {
    const ctx = this.ctx;
    ctx.save();

    // Plate Base (Simple Silver Plate)
    ctx.fillStyle = '#e2e2e2';
    ctx.beginPath();
    ctx.ellipse(this.cakeX, this.cakeY + 85, 230, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.ellipse(this.cakeX, this.cakeY + 85, 200, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Bottom Tier (Pastel Yellow Base Sponge)
    const bY = this.cakeY + 50;
    const bR = 150;
    const bH = 65;

    ctx.fillStyle = '#fceea7'; // Pastel Yellow
    ctx.beginPath();
    ctx.ellipse(this.cakeX, bY, bR, bR * 0.35, 0, 0, Math.PI);
    ctx.ellipse(this.cakeX, bY - bH, bR, bR * 0.35, 0, Math.PI, 0, true);
    ctx.fill();

    // Bottom Wavy Strawberry Red Glaze Topping
    ctx.fillStyle = '#ee5263';
    ctx.beginPath();
    ctx.ellipse(this.cakeX, bY - bH, bR, bR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wavy Drips on Bottom Tier
    ctx.beginPath();
    ctx.moveTo(this.cakeX - bR, bY - bH);
    for (let x = -bR; x <= bR; x += 15) {
      const waveY = bY - bH + 12 + Math.sin(x * 0.15) * 8;
      ctx.lineTo(this.cakeX + x, waveY);
    }
    ctx.lineTo(this.cakeX + bR, bY - bH);
    ctx.closePath();
    ctx.fill();

    // White Cream Cherries along Bottom Rim
    const cherryCoords = [-120, -70, -20, 30, 80, 120];
    cherryCoords.forEach(cx => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.cakeX + cx, bY - bH + 20 + Math.sin(cx * 0.05) * 4, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ee5263';
      ctx.beginPath();
      ctx.arc(this.cakeX + cx, bY - bH + 18 + Math.sin(cx * 0.05) * 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Top Tier (Pastel Yellow Base Sponge)
    const tY = bY - bH - 5;
    const tR = 105;
    const tH = 55;

    ctx.fillStyle = '#fceea7';
    ctx.beginPath();
    ctx.ellipse(this.cakeX, tY, tR, tR * 0.35, 0, 0, Math.PI);
    ctx.ellipse(this.cakeX, tY - tH, tR, tR * 0.35, 0, Math.PI, 0, true);
    ctx.fill();

    // Top Wavy Strawberry Red Glaze Topping
    ctx.fillStyle = '#ee5263';
    ctx.beginPath();
    ctx.ellipse(this.cakeX, tY - tH, tR, tR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wavy Drips on Top Tier
    ctx.beginPath();
    ctx.moveTo(this.cakeX - tR, tY - tH);
    for (let x = -tR; x <= tR; x += 12) {
      const waveY = tY - tH + 10 + Math.sin(x * 0.2) * 6;
      ctx.lineTo(this.cakeX + x, waveY);
    }
    ctx.lineTo(this.cakeX + tR, tY - tH);
    ctx.closePath();
    ctx.fill();

    if (this.state === 'CUT_DONE' || this.state === 'SLICE_DRAGGABLE' || this.state === 'ON_PLATE') {
      this.drawExactClassicSlice();
    }

    // 3 Striped Classic Birthday Candles on Top (Matching Image 3)
    if (this.state !== 'EATEN') {
      const candleOffsets = [-25, 0, 25];
      candleOffsets.forEach((offX, idx) => {
        const cx = this.cakeX + offX;
        const cy = tY - tH;

        // Candle Body
        ctx.fillStyle = '#fff5d6';
        ctx.fillRect(cx - 3, cy - 40, 6, 40);

        // Pink Stripes
        ctx.fillStyle = '#f497a9';
        ctx.fillRect(cx - 3, cy - 32, 6, 4);
        ctx.fillRect(cx - 3, cy - 20, 6, 4);
        ctx.fillRect(cx - 3, cy - 8, 6, 4);

        // Draw flame only if candles are NOT blown out
        if (!this.candlesBlown) {
          // Hover hint: show glow ring if mouse is near candle
          const mouseDist = Math.hypot(this.mousePos.x - cx, this.mousePos.y - (cy - 20));
          if (mouseDist < 40) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#ffb703';
            ctx.beginPath();
            ctx.arc(cx, cy - 48, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          const fOffX = Math.sin(this.flameFrame + idx) * 2;
          const fGrad = ctx.createRadialGradient(cx + fOffX, cy - 48, 2, cx, cy - 48, 14);
          fGrad.addColorStop(0, '#ffffff');
          fGrad.addColorStop(0.4, '#ffb703');
          fGrad.addColorStop(0.8, '#f77f00');
          fGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.ellipse(cx + fOffX, cy - 50, 8, 16, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw a small dark wick tip instead of flame
          ctx.fillStyle = '#555';
          ctx.beginPath();
          ctx.arc(cx, cy - 42, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    ctx.restore();
  }

  drawExactClassicSlice() {
    if (this.bites >= this.maxBites) return;

    const ctx = this.ctx;
    ctx.save();

    // Offset by -45, -25 so the slice center sits PERFECTLY on the plate center!
    const posX = this.slicePos.x + (this.state === 'CUT_DONE' ? 35 : 0) - (this.state === 'ON_PLATE' ? 45 : 0);
    const posY = this.slicePos.y - (this.state === 'CUT_DONE' ? 20 : 0) - (this.state === 'ON_PLATE' ? 25 : 0);

    const w = 95;
    const h = 60;

    ctx.translate(posX, posY);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 5, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Sponge Side
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 25);
    ctx.lineTo(w, 25 + h);
    ctx.lineTo(0, h);
    ctx.closePath();

    ctx.fillStyle = '#fceea7';
    ctx.fill();
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cream Fillings
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 18, w - 8, 5);
    ctx.fillRect(4, 36, w - 8, 5);

    // Red Glaze Top
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 25);
    ctx.lineTo(w - 20, -30);
    ctx.closePath();

    ctx.fillStyle = '#ee5263';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();
  }

  // ------------------------------------------------------------------------
  // AGENTIC MODE CAKE RENDERING
  // ------------------------------------------------------------------------
  drawCakeBaseGlow() {
    const ctx = this.ctx;
    ctx.save();
    const grad = ctx.createRadialGradient(this.cakeX, this.cakeY + 80, 20, this.cakeX, this.cakeY + 80, 220);
    grad.addColorStop(0, 'rgba(0, 243, 255, 0.45)');
    grad.addColorStop(0.6, 'rgba(255, 0, 127, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(this.cakeX, this.cakeY + 80, 230, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCakeLayers() {
    const ctx = this.ctx;
    ctx.save();

    const t1Y = this.cakeY + 40;
    const t1R = this.cakeRadius;
    const t1H = 55;

    const s1Grad = ctx.createLinearGradient(this.cakeX - t1R, 0, this.cakeX + t1R, 0);
    s1Grad.addColorStop(0, '#0a101f');
    s1Grad.addColorStop(0.2, '#182744');
    s1Grad.addColorStop(0.5, '#2c4370');
    s1Grad.addColorStop(0.8, '#182744');
    s1Grad.addColorStop(1, '#080c18');

    ctx.fillStyle = s1Grad;
    ctx.beginPath();
    ctx.ellipse(this.cakeX, t1Y, t1R, t1R * 0.38, 0, 0, Math.PI);
    ctx.ellipse(this.cakeX, t1Y - t1H, t1R, t1R * 0.38, 0, Math.PI, 0, true);
    ctx.fill();

    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.cakeX - t1R * 0.8, t1Y - 15);
    ctx.lineTo(this.cakeX - t1R * 0.3, t1Y - 15);
    ctx.lineTo(this.cakeX - t1R * 0.1, t1Y - 35);
    ctx.lineTo(this.cakeX + t1R * 0.4, t1Y - 35);
    ctx.lineTo(this.cakeX + t1R * 0.7, t1Y - 15);
    ctx.stroke();

    const top1Grad = ctx.createRadialGradient(this.cakeX, t1Y - t1H, 10, this.cakeX, t1Y - t1H, t1R);
    top1Grad.addColorStop(0, '#2e4573');
    top1Grad.addColorStop(0.7, '#1b2a47');
    top1Grad.addColorStop(1, '#0e172a');

    ctx.fillStyle = top1Grad;
    ctx.beginPath();
    ctx.ellipse(this.cakeX, t1Y - t1H, t1R, t1R * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const t2Y = t1Y - t1H - 8;
    const t2R = t1R * 0.72;
    const t2H = 50;

    const s2Grad = ctx.createLinearGradient(this.cakeX - t2R, 0, this.cakeX + t2R, 0);
    s2Grad.addColorStop(0, '#1c0827');
    s2Grad.addColorStop(0.3, '#3a1152');
    s2Grad.addColorStop(0.5, '#5c1b82');
    s2Grad.addColorStop(0.7, '#3a1152');
    s2Grad.addColorStop(1, '#15051e');

    ctx.fillStyle = s2Grad;
    ctx.beginPath();
    ctx.ellipse(this.cakeX, t2Y, t2R, t2R * 0.38, 0, 0, Math.PI);
    ctx.ellipse(this.cakeX, t2Y - t2H, t2R, t2R * 0.38, 0, Math.PI, 0, true);
    ctx.fill();

    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(this.cakeX, t2Y - 12, t2R * 0.95, t2R * 0.36, 0, 0, Math.PI);
    ctx.stroke();

    const top2Grad = ctx.createRadialGradient(this.cakeX, t2Y - t2H, 5, this.cakeX, t2Y - t2H, t2R);
    top2Grad.addColorStop(0, '#4a1769');
    top2Grad.addColorStop(0.8, '#2d0c42');
    top2Grad.addColorStop(1, '#1b0629');

    ctx.fillStyle = top2Grad;
    ctx.beginPath();
    ctx.ellipse(this.cakeX, t2Y - t2H, t2R, t2R * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff007f';
    ctx.stroke();

    const t3Y = t2Y - t2H - 6;
    const t3R = t2R * 0.65;
    const t3H = 40;

    ctx.fillStyle = '#0f243a';
    ctx.beginPath();
    ctx.ellipse(this.cakeX, t3Y, t3R, t3R * 0.38, 0, 0, Math.PI);
    ctx.ellipse(this.cakeX, t3Y - t3H, t3R, t3R * 0.38, 0, Math.PI, 0, true);
    ctx.fill();

    const top3Grad = ctx.createRadialGradient(this.cakeX, t3Y - t3H, 2, this.cakeX, t3Y - t3H, t3R);
    top3Grad.addColorStop(0, '#00f3ff');
    top3Grad.addColorStop(0.5, '#0066aa');
    top3Grad.addColorStop(1, '#05182e');

    ctx.fillStyle = top3Grad;
    ctx.beginPath();
    ctx.ellipse(this.cakeX, t3Y - t3H, t3R, t3R * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    const berryAngles = [0, Math.PI / 3, (Math.PI * 2) / 3, Math.PI, (Math.PI * 4) / 3, (Math.PI * 5) / 3];
    berryAngles.forEach(ang => {
      const bx = this.cakeX + Math.cos(ang) * (t3R * 0.65);
      const by = (t3Y - t3H) + Math.sin(ang) * (t3R * 0.25);
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.state === 'CUT_DONE' || this.state === 'SLICE_DRAGGABLE' || this.state === 'ON_PLATE') {
      this.drawDetailedCutSliceWedge();
    }

    if (this.state !== 'EATEN') {
      const candleX = this.cakeX;
      const candleY = t3Y - t3H;

      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(candleX - 4, candleY - 45, 8, 45);

      const fOffX = Math.sin(this.flameFrame) * 3;
      const fOffY = Math.cos(this.flameFrame * 1.4) * 4;

      const fGrad = ctx.createRadialGradient(candleX + fOffX, candleY - 55 + fOffY, 2, candleX, candleY - 55, 20);
      fGrad.addColorStop(0, '#ffffff');
      fGrad.addColorStop(0.3, '#00f3ff');
      fGrad.addColorStop(0.7, '#ff007f');
      fGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.ellipse(candleX + fOffX, candleY - 58 + fOffY, 14, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawDetailedCutSliceWedge() {
    if (this.bites >= this.maxBites) return;

    const ctx = this.ctx;
    ctx.save();

    // Offset by -45, -25 so the slice center sits PERFECTLY on the plate center!
    const posX = this.slicePos.x + (this.state === 'CUT_DONE' ? 35 : 0) - (this.state === 'ON_PLATE' ? 45 : 0);
    const posY = this.slicePos.y - (this.state === 'CUT_DONE' ? 20 : 0) - (this.state === 'ON_PLATE' ? 25 : 0);

    const wedgeWidth = 100;
    const wedgeHeight = 65;

    ctx.translate(posX, posY);

    ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(wedgeWidth / 2, wedgeHeight + 10, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wedgeWidth, 25);
    ctx.lineTo(wedgeWidth, 25 + wedgeHeight);
    ctx.lineTo(0, wedgeHeight);
    ctx.closePath();

    ctx.fillStyle = '#261408';
    ctx.fill();
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(5, 18, wedgeWidth - 10, 6);

    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;
    ctx.fillRect(5, 38, wedgeWidth - 10, 6);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wedgeWidth, 25);
    ctx.lineTo(wedgeWidth - 25, -35);
    ctx.closePath();

    const topFrostGrad = ctx.createLinearGradient(0, 0, wedgeWidth, 0);
    topFrostGrad.addColorStop(0, '#00f3ff');
    topFrostGrad.addColorStop(0.5, '#ff007f');
    topFrostGrad.addColorStop(1, '#9d4edd');

    ctx.fillStyle = topFrostGrad;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  drawLaserKnifeCursor() {
    const ctx = this.ctx;
    ctx.save();
    const { x, y } = this.mousePos;

    const strokeCol = this.mode === 'CLASSIC' ? '#c59b27' : '#00f3ff';

    ctx.shadowColor = strokeCol;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x - 28, y + 28);
    ctx.lineTo(x + 22, y - 22);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 28, y + 28);
    ctx.lineTo(x + 22, y - 22);
    ctx.stroke();

    ctx.restore();
  }

  drawLaserCutLine() {
    const ctx = this.ctx;
    ctx.save();
    const strokeCol = this.mode === 'CLASSIC' ? '#ee5263' : '#00f3ff';

    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 5;
    ctx.shadowColor = strokeCol;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(this.cutStart.x, this.cutStart.y);
    ctx.lineTo(this.cutEnd.x, this.cutEnd.y);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.cutStart.x, this.cutStart.y);
    ctx.lineTo(this.cutEnd.x, this.cutEnd.y);
    ctx.stroke();

    ctx.restore();
  }

  drawCanvasFork() {
    const ctx = this.ctx;
    ctx.save();
    const px = this.platePos.x;
    const py = this.platePos.y - 45 + this.forkAnimY;

    const color = this.mode === 'CLASSIC' ? '#c59b27' : '#00f3ff';

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(px - 10, py);
    ctx.lineTo(px - 10, py - 20);
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - 24);
    ctx.moveTo(px + 10, py);
    ctx.lineTo(px + 10, py - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px - 10, py);
    ctx.lineTo(px + 10, py);
    ctx.lineTo(px, py + 35);
    ctx.stroke();

    ctx.restore();
  }

  drawCandlePuffs() {
    const ctx = this.ctx;
    for (let i = 0; i < this.candlePuffs.length; i++) {
      const p = this.candlePuffs[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, 'rgba(200, 200, 200, 0.8)');
      grad.addColorStop(1, 'rgba(180, 180, 180, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawFireworks() {
    const ctx = this.ctx;
    for (let i = 0; i < this.fireworks.length; i++) {
      const p = this.fireworks[i];
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawConfetti() {
    const ctx = this.ctx;
    for (let i = 0; i < this.confetti.length; i++) {
      const c = this.confetti[i];
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 1.5);
      ctx.restore();
    }
  }

  drawCrumbs() {
    const ctx = this.ctx;
    for (let i = 0; i < this.crumbs.length; i++) {
      const cr = this.crumbs[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, cr.life);
      ctx.fillStyle = cr.color;
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, cr.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawFloatingTexts() {
    const ctx = this.ctx;
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = this.mode === 'CLASSIC' ? 'bold 22px Cinzel' : 'bold 22px Orbitron';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
