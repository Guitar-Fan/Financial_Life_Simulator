<!--
  Ambient Flour Particle Background
  Canvas-based floating particles creating a warm bakery atmosphere.
  Lightweight — uses requestAnimationFrame with throttled rendering.
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
let animationId = 0;
let particles: Particle[] = [];

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
  phase: number;
}

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: h + Math.random() * 50,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 0.4 + 0.15,
    opacity: Math.random() * 0.25 + 0.05,
    drift: (Math.random() - 0.5) * 0.3,
    phase: Math.random() * Math.PI * 2,
  };
}

function animate() {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  const w = c.width;
  const h = c.height;

  ctx.clearRect(0, 0, w, h);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y -= p.speed;
    p.x += Math.sin(p.phase + p.y * 0.01) * p.drift;
    p.phase += 0.005;

    if (p.y < -10) {
      particles[i] = createParticle(w, h);
      continue;
    }

    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    gradient.addColorStop(0, `rgba(255, 240, 200, ${p.opacity})`);
    gradient.addColorStop(1, `rgba(255, 240, 200, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  animationId = requestAnimationFrame(animate);
}

function handleResize() {
  const c = canvas.value;
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}

onMounted(() => {
  handleResize();
  const w = canvas.value?.width || 1200;
  const h = canvas.value?.height || 800;
  const count = Math.floor((w * h) / 25000); // Density based on screen size
  particles = Array.from({ length: Math.min(count, 60) }, () => {
    const p = createParticle(w, h);
    p.y = Math.random() * h; // Spread initially
    return p;
  });
  window.addEventListener('resize', handleResize);
  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <canvas
    ref="canvas"
    class="fixed inset-0 pointer-events-none z-0"
    aria-hidden="true"
  />
</template>
