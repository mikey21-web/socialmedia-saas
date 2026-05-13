---
name: algorithmic-art
description: Create generative/computational art using p5.js. Use when asked to create algorithmic art, generative visuals, particle systems, mathematical art, or interactive art artifacts with p5.js.
---

# Algorithmic Art with p5.js

Create sophisticated computational art as self-contained HTML artifacts using p5.js.

## Core Process

### Phase 1: Algorithmic Philosophy
Develop a "computational aesthetic movement" — 4-6 paragraphs describing how the art manifests through:
- Mathematical processes and noise functions
- Particle behaviors and emergent systems
- Conceptual themes woven invisibly into parameters

### Phase 2: p5.js Implementation
Translate the philosophy into a single self-contained HTML artifact.

## Critical Requirements

**Seeded Randomness**: Every artwork uses reproducible seeding — identical seeds always produce identical outputs. Include seed navigation controls.

**Template Structure**: Include a fixed layout with controls sidebar and main canvas area.

**Parameter Design**: Emerge parameters from "What qualities of this system can be adjusted?" — meaningful controls like particle counts, scales, probabilities, ratios, angles, thresholds — not arbitrary preset patterns.

## Standard HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  <style>
    body { margin: 0; display: flex; background: #0a0a0a; color: #fff; font-family: monospace; }
    #controls { width: 200px; padding: 20px; border-right: 1px solid #333; }
    #canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; }
    input[type=range] { width: 100%; }
    label { display: block; margin: 10px 0 4px; font-size: 12px; color: #aaa; }
    .seed-nav { display: flex; gap: 8px; margin-top: 16px; }
    button { background: #333; color: #fff; border: none; padding: 6px 12px; cursor: pointer; }
    button:hover { background: #555; }
  </style>
</head>
<body>
  <div id="controls">
    <h3 style="margin:0 0 16px">Controls</h3>
    <!-- Parameters here -->
    <label>Particle Count</label>
    <input type="range" id="count" min="10" max="500" value="200">
    <label>Scale</label>
    <input type="range" id="scale" min="1" max="100" value="30">
    <div class="seed-nav">
      <button onclick="prevSeed()">◀</button>
      <span id="seedDisplay">Seed: 1</span>
      <button onclick="nextSeed()">▶</button>
    </div>
  </div>
  <div id="canvas-container" id="sketch-holder"></div>
  <script>
    let seed = 1;
    function prevSeed() { seed = Math.max(1, seed - 1); redraw(); updateDisplay(); }
    function nextSeed() { seed++; redraw(); updateDisplay(); }
    function updateDisplay() { document.getElementById('seedDisplay').textContent = `Seed: ${seed}`; }

    new p5(function(p) {
      p.setup = function() {
        let canvas = p.createCanvas(600, 600);
        canvas.parent('canvas-container');
        p.noLoop();
      };

      p.draw = function() {
        p.randomSeed(seed);
        p.noiseSeed(seed);
        p.background(10);
        // --- Your algorithm here ---
        let count = document.getElementById('count').value;
        let scale = document.getElementById('scale').value;
        for (let i = 0; i < count; i++) {
          let x = p.random(p.width);
          let y = p.random(p.height);
          let n = p.noise(x / scale, y / scale);
          p.stroke(255 * n, 100, 255 * (1 - n), 150);
          p.point(x, y);
        }
      };
    });

    // Redraw on parameter change
    document.querySelectorAll('input').forEach(el => el.addEventListener('input', () => new p5(function(p){}).redraw()));
  </script>
</body>
</html>
```

## Key p5.js Patterns

### Noise-based flow field
```javascript
p.draw = function() {
  p.randomSeed(seed); p.noiseSeed(seed);
  for (let x = 0; x < p.width; x += step) {
    for (let y = 0; y < p.height; y += step) {
      let angle = p.noise(x * 0.005, y * 0.005) * p.TWO_PI * 2;
      let len = p.noise(x * 0.01, y * 0.01) * step;
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.line(0, 0, len, 0);
      p.pop();
    }
  }
};
```

### Particle system
```javascript
class Particle {
  constructor(p) {
    this.p = p;
    this.pos = p.createVector(p.random(p.width), p.random(p.height));
    this.vel = p.createVector(0, 0);
    this.life = 255;
  }
  update() {
    let angle = this.p.noise(this.pos.x * 0.003, this.pos.y * 0.003) * this.p.TWO_PI * 4;
    this.vel = p5.Vector.fromAngle(angle).mult(2);
    this.pos.add(this.vel);
    this.life -= 2;
  }
  draw() {
    this.p.stroke(255, this.life);
    this.p.point(this.pos.x, this.pos.y);
  }
  isDead() { return this.life <= 0; }
}
```

## Deliverables
1. Brief philosophy statement (what aesthetic/concept drives this piece)
2. Single self-contained HTML artifact with embedded p5.js, all controls, seed navigation
