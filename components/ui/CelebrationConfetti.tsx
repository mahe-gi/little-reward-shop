"use client";

import React, { useEffect, useRef } from "react";

export interface CelebrationOptions {
  type?: "hearts" | "gold" | "all";
  count?: number;
}

export function triggerCelebration(options: CelebrationOptions = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("pairly:celebrate", { detail: options })
    );
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "circle" | "rect" | "heart";
  rotation: number;
  rotSpeed: number;
  alpha: number;
  life: number;
  maxLife: number;
}

const COLORS = [
  "#E06D75", // Rose
  "#F28B93", // Soft Rose
  "#BA3F4A", // Deep Wine Rose
  "#E5C07B", // Champagne Gold
  "#FCEBEE", // Blush White
  "#D97757", // Terracotta
];

export function CelebrationConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const spawnParticles = (options: CelebrationOptions) => {
      const count = options.count || 45;
      const originX = window.innerWidth / 2;
      const originY = window.innerHeight * 0.45;
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 9;
        const maxLife = 50 + Math.random() * 40;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const shapeType = Math.random() > 0.4 ? "heart" : Math.random() > 0.5 ? "rect" : "circle";

        newParticles.push({
          x: originX + (Math.random() - 0.5) * 80,
          y: originY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3.5, // gentle upwards push
          size: 7 + Math.random() * 8,
          color,
          shape: shapeType,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 8,
          alpha: 1,
          life: 0,
          maxLife,
        });
      }

      particlesRef.current.push(...newParticles);

      if (!animFrameRef.current) {
        loop();
      }
    };

    const drawHeart = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number
    ) => {
      context.beginPath();
      const topCurveHeight = size * 0.3;
      context.moveTo(x, y + topCurveHeight);
      context.bezierCurveTo(
        x,
        y,
        x - size / 2,
        y,
        x - size / 2,
        y + topCurveHeight
      );
      context.bezierCurveTo(
        x - size / 2,
        y + (size + topCurveHeight) / 2,
        x,
        y + (size + topCurveHeight) / 1.4,
        x,
        y + size
      );
      context.bezierCurveTo(
        x,
        y + (size + topCurveHeight) / 1.4,
        x + size / 2,
        y + (size + topCurveHeight) / 2,
        x + size / 2,
        y + topCurveHeight
      );
      context.bezierCurveTo(
        x + size / 2,
        y,
        x,
        y,
        x,
        y + topCurveHeight
      );
      context.closePath();
      context.fill();
    };

    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.vx *= 0.98; // air drag
        p.rotation += p.rotSpeed;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.alpha <= 0 || p.y > window.innerHeight + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === "heart") {
          drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (particles.length > 0) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        animFrameRef.current = null;
      }
    };

    const handleCelebrateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<CelebrationOptions>;
      spawnParticles(customEvent.detail || {});
    };

    window.addEventListener("pairly:celebrate", handleCelebrateEvent);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pairly:celebrate", handleCelebrateEvent);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-60"
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden="true"
    />
  );
}
