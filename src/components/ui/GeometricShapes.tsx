"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GeometricShapesProps {
  className?: string;
}

export const GeometricShapes: React.FC<GeometricShapesProps> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Cercle orbital */}
      <motion.div
        className="absolute w-64 h-64 border border-axone-accent/20 rounded-full"
        style={{ top: '10%', right: '10%' }}
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />
      
      {/* Triangle flottant */}
      <motion.svg
        className="absolute w-32 h-32"
        style={{ bottom: '20%', left: '15%' }}
        viewBox="0 0 100 100"
        animate={{
          y: [-20, 20, -20],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M50 10 L90 80 L10 80 Z"
          fill="none"
          stroke="rgba(74, 140, 140, 0.3)"
          strokeWidth="1"
        />
      </motion.svg>
      
      {/* Hexagone tournant */}
      <motion.svg
        className="absolute w-48 h-48"
        style={{ top: '50%', right: '30%' }}
        viewBox="0 0 100 100"
        animate={{
          rotate: -360,
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <polygon
          points="50,5 90,25 90,75 50,95 10,75 10,25"
          fill="none"
          stroke="rgba(250, 176, 98, 0.2)"
          strokeWidth="1"
        />
      </motion.svg>
      
      {/* Carré pulsant */}
      <motion.div
        className="absolute w-24 h-24 border border-axone-flounce/30 rounded-lg"
        style={{ top: '70%', right: '20%' }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Lignes de connexion animées */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.line
          x1="20%"
          y1="30%"
          x2="80%"
          y2="70%"
          stroke="rgba(250, 176, 98, 0.1)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.line
          x1="80%"
          y1="20%"
          x2="30%"
          y2="80%"
          stroke="rgba(74, 140, 140, 0.1)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </svg>
    </div>
  );
};

export default GeometricShapes;