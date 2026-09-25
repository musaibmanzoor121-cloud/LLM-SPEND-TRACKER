/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt degrees (e.g. 7)
  glare?: boolean;
  scale?: number;
  depth?: number;
  style?: React.CSSProperties;
  id?: string;
  [key: `data-${string}`]: any;
}

export default function Card3D({
  children,
  className = '',
  maxTilt = 7,
  glare = true,
  scale = 1.015,
  depth = 30,
  style = {},
  ...props
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePos, setGlarePos] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate cursor pos relative to card center (-1 to 1)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const percentX = (mouseX / width) * 2 - 1; // -1 (left) to 1 (right)
    const percentY = (mouseY / height) * 2 - 1; // -1 (top) to 1 (bottom)

    // Calculate 3D rotations:
    // Moving mouse to top makes card tilt forward (positive rotateX)
    // Moving mouse to right makes card tilt right (positive rotateY)
    const rotateX = -percentY * maxTilt;
    const rotateY = percentX * maxTilt;

    setTransform(`perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`);

    // Glare position follows light source
    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.16 });
  }, [maxTilt, scale, prefersReducedMotion]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative preserve-3d transition-transform ${
        isHovered ? 'duration-100 ease-out z-10' : 'duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0'
      } ${className}`}
      style={{
        transform: transform,
        transformStyle: 'preserve-3d',
        ...style
      }}
      {...props}
    >
      {/* Dynamic Specular Glare Layer */}
      {glare && !prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden transition-opacity duration-300 z-30"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 40%, transparent 70%)`
          }}
        />
      )}

      {/* Card Content with 3D Depth capability */}
      <div className="w-full h-full preserve-3d">
        {children}
      </div>
    </div>
  );
}
