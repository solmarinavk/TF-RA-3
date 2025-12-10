import React from 'react';
import { motion } from 'framer-motion';
import { SystemState } from '@/types';

interface StateIndicatorProps {
  state: SystemState;
}

const STATE_CONFIG = {
  IDLE: {
    emoji: '🤚',
    text: 'Levanta brazo izquierdo en L para iniciar',
    mobileText: 'Brazo L para iniciar',
    color: 'bg-blue-500',
    pulse: true
  },
  RECORDING: {
    emoji: '🔴',
    text: 'GRABANDO - Selecciona con tu dedo índice',
    mobileText: 'Grabando',
    color: 'bg-red-500',
    pulse: true
  },
  PROCESSING: {
    emoji: '⚙️',
    text: 'Analizando grafo...',
    mobileText: 'Procesando...',
    color: 'bg-yellow-500',
    pulse: true
  },
  DISPLAYING: {
    emoji: '✅',
    text: 'Mensaje completo - Brazo izquierdo en L para nuevo mensaje',
    mobileText: 'Completado',
    color: 'bg-green-500',
    pulse: false
  }
};

export const StateIndicator: React.FC<StateIndicatorProps> = ({ state }) => {
  const config = STATE_CONFIG[state];

  return (
    <>
      {/* Desktop version - centered at top */}
      <motion.div
        className="hidden lg:block fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div
          className={`${config.color} text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4`}
        >
          {/* Emoji */}
          <motion.span
            className="text-3xl"
            animate={config.pulse ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: config.pulse ? Infinity : 0
            }}
          >
            {config.emoji}
          </motion.span>

          {/* Texto */}
          <span className="font-bold text-lg">
            {config.text}
          </span>

          {/* Dot pulsante para estados activos */}
          {config.pulse && (
            <motion.div
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            />
          )}
        </div>
      </motion.div>

      {/* Mobile version - minimal indicator at top-right corner */}
      <motion.div
        className="lg:hidden fixed top-1 right-1 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        <div
          className={`${config.color} text-white px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 opacity-80`}
        >
          {/* Emoji pequeño */}
          <span className="text-[10px]">{config.emoji}</span>

          {/* Dot pulsante */}
          {config.pulse && (
            <motion.div
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            />
          )}
        </div>
      </motion.div>
    </>
  );
};
