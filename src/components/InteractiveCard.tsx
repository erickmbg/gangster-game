import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function InteractiveCard({ children, className = "", id, ...props }: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values to keep track of normal relative coordinates [0, 1]
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // map normalized 0 -> 1 to subtle -5 to +5 degrees tilt for professional organic responsiveness
  const rotateX = useSpring(useTransform(y, [0, 1], [5, -5]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-5, 5]), { stiffness: 120, damping: 18 });

  // Subtle radial gradient center shifts
  const glareX = useTransform(x, [0, 1], ["-10%", "30px"]);
  const glareY = useTransform(y, [0, 1], ["-10%", "30px"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / rect.width);
    y.set(mouseY / rect.height);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d",
        perspective: 900,
      }}
      animate={{
        scale: isHovered ? 1.015 : 1,
        y: isHovered ? -4 : 0,
        borderColor: isHovered ? "rgba(220, 38, 38, 0.4)" : "rgba(39, 39, 42, 1)",
        boxShadow: isHovered 
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(220, 38, 38, 0.15), inset 0 0 12px rgba(220, 38, 38, 0.05)" 
          : "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5), inset 0 0 0px rgba(0,0,0,0)"
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className={`relative industrial-panel transition-all duration-300 overflow-hidden cursor-default group ${className}`}
      id={id}
      {...props}
    >
      {/* Premium Cybernetic Outer Grid Texture */}
      <div className="absolute inset-0 bg-board-grid opacity-[0.25] pointer-events-none group-hover:opacity-[0.4] transition-opacity duration-300 z-0" />

      {/* Cyberpunk corner bracket system */}
      <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t-2 border-l-2 border-zinc-800 pointer-events-none group-hover:border-red-500/60 transition-colors duration-300 z-20" />
      <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t-2 border-r-2 border-zinc-800 pointer-events-none group-hover:border-red-500/60 transition-colors duration-300 z-20" />
      <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b-2 border-l-2 border-zinc-800 pointer-events-none group-hover:border-red-500/60 transition-colors duration-300 z-20" />
      <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b-2 border-r-2 border-zinc-800 pointer-events-none group-hover:border-red-500/60 transition-colors duration-300 z-20" />

      {/* Tech line crosshair accessories */}
      <div className="absolute top-3.5 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-zinc-900/10 to-transparent pointer-events-none group-hover:via-zinc-800/40 transition-colors duration-300 z-20" />
      <div className="absolute bottom-3.5 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-zinc-900/10 to-transparent pointer-events-none group-hover:via-zinc-800/40 transition-colors duration-300 z-20" />

      {/* Dynamic light refraction reflection card flare */}
      <motion.div
        style={{
          left: glareX,
          top: glareY,
          opacity: isHovered ? 0.12 : 0,
        }}
        className="absolute w-[120%] h-[120%] pointer-events-none rounded-full bg-radial from-red-500 via-transparent to-transparent blur-2xl z-0 transition-opacity duration-300"
      />

      {/* 3D content container to preserve children layered stack */}
      <div 
        style={{ 
          transform: "translateZ(8px)",
          transformStyle: "preserve-3d" 
        }} 
        className="w-full h-full relative z-10"
      >
        {children}
      </div>
    </motion.div>
  );
}
