'use client';

import { useEffect, useRef } from 'react';

type GeometryShape = {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  type:
    | 'star'
    | 'circle'
    | 'square'
    | 'triangle'
    | 'hexagon'
    | 'diamond'
    | 'rings'
    | 'blob'
    | 'wave'
    | 'glyph';
};

const shapeSeeds: Array<Pick<GeometryShape, 'radius' | 'type'>> = [
  { radius: 42, type: 'star' },
  { radius: 27, type: 'triangle' },
  { radius: 34, type: 'circle' },
  { radius: 20, type: 'square' },
  { radius: 52, type: 'triangle' },
  { radius: 24, type: 'star' },
  { radius: 31, type: 'square' },
  { radius: 18, type: 'circle' },
  { radius: 38, type: 'star' },
  { radius: 23, type: 'triangle' },
  { radius: 29, type: 'hexagon' },
  { radius: 46, type: 'diamond' },
  { radius: 19, type: 'rings' },
  { radius: 35, type: 'triangle' },
  { radius: 25, type: 'hexagon' },
  { radius: 32, type: 'blob' },
  { radius: 28, type: 'wave' },
  { radius: 21, type: 'glyph' },
  { radius: 43, type: 'blob' },
  { radius: 24, type: 'glyph' },
];

function drawStar(context: CanvasRenderingContext2D, radius: number) {
  context.beginPath();
  for (let point = 0; point < 16; point += 1) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 8;
    const pointRadius = point % 2 === 0 ? radius : radius * 0.28;
    const x = Math.cos(angle) * pointRadius;
    const y = Math.sin(angle) * pointRadius;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function drawPenroseTriangle(context: CanvasRenderingContext2D, radius: number) {
  const size = radius * 1.45;
  const height = size * 0.86;
  context.beginPath();
  context.moveTo(0, -height * 0.62);
  context.lineTo(size * 0.72, height * 0.55);
  context.lineTo(size * 0.3, height * 0.55);
  context.lineTo(0, height * 0.02);
  context.lineTo(-size * 0.3, height * 0.55);
  context.lineTo(-size * 0.72, height * 0.55);
  context.closePath();
  context.moveTo(0, -height * 0.24);
  context.lineTo(size * 0.32, height * 0.35);
  context.lineTo(-size * 0.32, height * 0.35);
  context.closePath();
}

function drawPolygon(
  context: CanvasRenderingContext2D,
  radius: number,
  sides: number,
  offset = 0,
) {
  context.beginPath();
  for (let point = 0; point < sides; point += 1) {
    const angle = offset + (point * Math.PI * 2) / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function drawRings(context: CanvasRenderingContext2D, radius: number) {
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.moveTo(radius * 0.65, 0);
  context.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
  context.moveTo(radius * 0.3, 0);
  context.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
}

function drawBlob(context: CanvasRenderingContext2D, radius: number) {
  context.beginPath();
  context.moveTo(0, -radius);
  context.bezierCurveTo(radius * 0.8, -radius * 1.05, radius * 1.08, -radius * 0.4, radius, 0);
  context.bezierCurveTo(radius * 0.9, radius * 0.85, radius * 0.25, radius * 1.05, 0, radius);
  context.bezierCurveTo(-radius * 0.85, radius * 0.9, -radius * 1.05, radius * 0.3, -radius, 0);
  context.bezierCurveTo(-radius * 0.95, -radius * 0.8, -radius * 0.35, -radius * 1.08, 0, -radius);
  context.closePath();
}

function drawWave(context: CanvasRenderingContext2D, radius: number) {
  context.beginPath();
  for (let point = 0; point <= 24; point += 1) {
    const progress = point / 24;
    const x = (progress - 0.5) * radius * 2.4;
    const y = Math.sin(progress * Math.PI * 2.5) * radius * 0.34;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
}

function drawGlyph(context: CanvasRenderingContext2D, radius: number) {
  context.font = `${radius * 1.35}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  context.fillText('☻', 0, 0);
}

function drawShape(context: CanvasRenderingContext2D, shape: GeometryShape) {
  context.save();
  context.translate(shape.x, shape.y);
  context.rotate(shape.rotation);
  context.strokeStyle = '#ffffff';
  context.lineWidth = Math.max(1, shape.radius / 18);
  context.globalAlpha = Math.min(0.78, 0.28 + shape.radius / 90);
  context.shadowColor = '#ffffffcc';
  context.shadowBlur = shape.radius * 0.72;

  if (shape.type === 'circle') {
    context.beginPath();
    context.arc(0, 0, shape.radius, 0, Math.PI * 2);
  } else if (shape.type === 'square') {
    context.beginPath();
    context.rect(-shape.radius, -shape.radius, shape.radius * 2, shape.radius * 2);
  } else if (shape.type === 'triangle') {
    drawPenroseTriangle(context, shape.radius);
  } else if (shape.type === 'hexagon') {
    drawPolygon(context, shape.radius, 6, Math.PI / 6);
    drawPolygon(context, shape.radius * 0.56, 6, Math.PI / 6);
  } else if (shape.type === 'diamond') {
    drawPolygon(context, shape.radius, 4, Math.PI / 4);
    drawPolygon(context, shape.radius * 0.58, 4, Math.PI / 4);
  } else if (shape.type === 'rings') {
    drawRings(context, shape.radius);
  } else if (shape.type === 'blob') {
    drawBlob(context, shape.radius);
  } else if (shape.type === 'wave') {
    drawWave(context, shape.radius);
  } else if (shape.type === 'glyph') {
    drawGlyph(context, shape.radius);
  } else {
    drawStar(context, shape.radius);
  }

  if (shape.type !== 'glyph') context.stroke();
  context.restore();
}

export default function AboutGeometry() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;
    let shapes: GeometryShape[] = [];
    let width = 0;
    let height = 0;
    const random = (minimum: number, maximum: number) =>
      minimum + Math.random() * (maximum - minimum);

    const resize = () => {
      const rect = section.getBoundingClientRect();
      const pixelRatio = Math.min(devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (!shapes.length) {
        shapes = shapeSeeds.map((seed, index) => ({
          ...seed,
          x: random(seed.radius, Math.max(seed.radius, width - seed.radius)),
          y: random(seed.radius, Math.max(seed.radius, height - seed.radius)),
          velocityX: random(-0.18, 0.18) || 0.1,
          velocityY: random(-0.16, 0.16) || -0.1,
          rotation: (index * Math.PI) / 7,
          rotationSpeed: random(-0.0018, 0.0018),
        }));
      } else {
        shapes.forEach((shape) => {
          shape.x = Math.min(Math.max(shape.radius, shape.x), width - shape.radius);
          shape.y = Math.min(Math.max(shape.radius, shape.y), height - shape.radius);
        });
      }
    };

    const resolveCollisions = () => {
      for (let firstIndex = 0; firstIndex < shapes.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < shapes.length; secondIndex += 1) {
          const first = shapes[firstIndex];
          const second = shapes[secondIndex];
          const differenceX = second.x - first.x;
          const differenceY = second.y - first.y;
          const distance = Math.hypot(differenceX, differenceY) || 0.001;
          const minimumDistance = first.radius + second.radius;
          if (distance >= minimumDistance) continue;
          const normalX = differenceX / distance;
          const normalY = differenceY / distance;
          const overlap = (minimumDistance - distance) / 2;
          first.x -= normalX * overlap;
          first.y -= normalY * overlap;
          second.x += normalX * overlap;
          second.y += normalY * overlap;
          const relativeVelocity =
            (second.velocityX - first.velocityX) * normalX +
            (second.velocityY - first.velocityY) * normalY;
          if (relativeVelocity > 0) continue;
          first.velocityX += relativeVelocity * normalX;
          first.velocityY += relativeVelocity * normalY;
          second.velocityX -= relativeVelocity * normalX;
          second.velocityY -= relativeVelocity * normalY;
        }
      }
    };

    const render = () => {
      animationFrame = 0;
      context.clearRect(0, 0, width, height);
      if (reducedMotion.matches) {
        shapes.forEach((shape) => drawShape(context, shape));
        return;
      }
      shapes.forEach((shape) => {
        shape.x += shape.velocityX;
        shape.y += shape.velocityY;
        shape.rotation += shape.rotationSpeed;
        if (shape.x < shape.radius || shape.x > width - shape.radius) {
          shape.velocityX *= -1;
          shape.x = Math.min(Math.max(shape.radius, shape.x), width - shape.radius);
        }
        if (shape.y < shape.radius || shape.y > height - shape.radius) {
          shape.velocityY *= -1;
          shape.y = Math.min(Math.max(shape.radius, shape.y), height - shape.radius);
        }
      });
      resolveCollisions();
      shapes.forEach((shape) => drawShape(context, shape));
      animationFrame = requestAnimationFrame(render);
    };

    const schedule = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(render);
    };

    resize();
    schedule();
    const observer = new ResizeObserver(() => {
      resize();
      schedule();
    });
    observer.observe(section);
    window.addEventListener('resize', resize);
    reducedMotion.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      reducedMotion.removeEventListener('change', schedule);
    };
  }, []);

  return <canvas className="about-geometry" ref={canvasRef} aria-hidden="true" />;
}
