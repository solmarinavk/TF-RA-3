import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './styles/globals.css';
import { useAppStore } from './store/useAppStore';
import { UCI_KEYS } from './utils/constants';
import { VirtualKeyboard } from './components/Keyboard/VirtualKeyboard';
import { StateIndicator } from './components/UI/StateIndicator';
import { GestureProgressBar } from './components/UI/GestureProgressBar';
import { MetricsPanel } from './components/UI/MetricsPanel';
import { CameraFeed } from './components/Camera/CameraFeed';
import { LandmarksOverlay } from './components/Camera/LandmarksOverlay';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useGestureDetection } from './hooks/useGestureDetection';
import { useHandTracking } from './hooks/useHandTracking';

function App() {
  const {
    systemState,
    hoveredKey,
    hoverProgress,
    currentMessage,
    selectedKeys,
    metrics,
    graph,
    gestureProgress,
    gestureType,
    resetSession
  } = useAppStore();

  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar si es mobile/tablet en portrait - valor inicial calculado
  const [isPortraitMobile, setIsPortraitMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isMobileOrTablet = window.innerWidth < 1024;
    const isPortrait = window.innerHeight > window.innerWidth;
    return isMobileOrTablet && isPortrait;
  });

  // Actualizar detección de orientación
  useEffect(() => {
    const checkOrientation = () => {
      const isMobileOrTablet = window.innerWidth < 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobileOrTablet && isPortrait);
    };

    // Verificar inmediatamente
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      // Delay para permitir que el navegador actualice las dimensiones
      setTimeout(checkOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Inicializar MediaPipe
  const { poseLandmarker, handLandmarker, isLoading, error, isReady } = useMediaPipe();

  // Hooks de detección
  useGestureDetection(poseLandmarker, handLandmarker, videoElement);
  const { fingerPosition } = useHandTracking(handLandmarker, videoElement, canvasSize);

  // Actualizar tamaño de canvas en resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controles de teclado para FSM (fallback)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          resetSession();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetSession]);

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center px-4">
          <div className="text-6xl mb-6 animate-pulse">🏥</div>
          <div className="text-white text-2xl sm:text-3xl font-bold mb-3">DOCommunication</div>
          <div className="text-slate-400 text-sm sm:text-base">Inicializando sistema de gestos...</div>
          <div className="mt-6 w-48 h-1 bg-slate-700 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-6">⚠️</div>
          <div className="text-white text-2xl font-bold mb-3">Error de Inicialización</div>
          <div className="text-slate-400 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de "rotar dispositivo" para portrait en mobile/tablet
  if (isPortraitMobile) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8">
        <div className="text-center">
          <motion.div
            className="text-7xl mb-6"
            animate={{ rotate: [0, -90, -90, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            📱
          </motion.div>
          <h2 className="text-white text-2xl font-bold mb-3">Gira tu dispositivo</h2>
          <p className="text-slate-400 text-sm mb-6">
            Para usar DOCommunication, coloca tu dispositivo en modo horizontal (landscape)
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
            <span>🔄</span>
            <span>Rotación automática activada</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Video de cámara */}
      <CameraFeed onVideoReady={setVideoElement} />

      {/* Overlay de landmarks */}
      <LandmarksOverlay canvasSize={canvasSize} />

      {/* Header responsive - oculto en mobile/tablet para maximizar espacio */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-30 px-6 py-4 items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            DOCommunication
          </h1>
          <p className="text-xs text-slate-500">Sistema de Comunicación Gestual</p>
        </div>
      </header>

      {/* Indicador de estado - se maneja por separado */}
      <StateIndicator state={systemState} />

      {/* Área de círculos - mobile/tablet: desde arriba, desktop: debajo del header */}
      <div className="fixed top-[5%] lg:top-[18%] left-0 right-0 z-20">
        <VirtualKeyboard
          keys={graph.nodes.size > 0 ? Array.from(graph.nodes.values()) : UCI_KEYS}
          fingerPosition={fingerPosition}
          canvasSize={canvasSize}
          hoveredKey={hoveredKey}
          hoverProgress={hoverProgress}
          isRecording={systemState === 'RECORDING'}
        />
      </div>

      {/* Panel de mensaje actual - Desktop: derecha, Mobile: abajo compacto */}
      {systemState !== 'IDLE' && (
        <>
          {/* Desktop version */}
          <motion.div
            className="hidden lg:block fixed top-[40%] right-4 md:right-6 z-30 bg-slate-800/90 backdrop-blur-md rounded-xl p-5 text-white min-w-[300px] max-w-[400px] shadow-2xl border border-slate-700/50"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, type: 'spring' }}
          >
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2 text-slate-200">
              <span className="text-lg">💬</span>
              Mensaje en construcción
            </h3>

            {currentMessage.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-4">
                Apunta a un círculo para seleccionar...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentMessage.map((word, i) => {
                  const keyNode = UCI_KEYS.find(k => k.label === word);
                  return (
                    <motion.div
                      key={i}
                      className="px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-md"
                      style={{ backgroundColor: keyNode?.color || '#3b82f6' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05, type: 'spring' }}
                    >
                      {word}
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
              <span>{selectedKeys.length} selección{selectedKeys.length !== 1 ? 'es' : ''}</span>
              <span className="text-slate-600">Brazo der. L + 👍 para finalizar</span>
            </div>
          </motion.div>

          {/* Mobile version - bar at bottom */}
          <motion.div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/90 backdrop-blur-sm px-3 py-2 text-white"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentMessage.length === 0 ? (
              <div className="text-slate-400 text-xs text-center">
                👆 Apunta a un círculo para seleccionar
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {currentMessage.map((word, i) => {
                  const keyNode = UCI_KEYS.find(k => k.label === word);
                  return (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: keyNode?.color || '#3b82f6' }}
                    >
                      {word.split(' ')[0]}
                    </span>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Panel de instrucciones - desktop */}
      <div className="hidden lg:block fixed bottom-4 left-4 z-40 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1.5 max-w-[220px] border border-slate-700/30">
        <div className="font-semibold text-slate-300 mb-2 text-sm">Controles</div>
        <div className="flex items-center gap-2">
          <span className="w-5 text-center text-sm">💪</span>
          <span className="text-slate-400 text-xs">Brazo izq. en L → Iniciar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 text-center text-sm">👆</span>
          <span className="text-slate-400 text-xs">Dedo índice → Seleccionar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 text-center text-sm">👍</span>
          <span className="text-slate-400 text-xs">Brazo der. + pulgar → Fin</span>
        </div>
        <div className="pt-2 border-t border-slate-700/50 text-slate-600 text-xs">
          {isReady ? '● Sistema listo' : '○ Preparando...'}
        </div>
      </div>

      {/* Instrucciones mobile - solo cuando IDLE */}
      {systemState === 'IDLE' && (
        <div className="lg:hidden fixed bottom-2 left-2 right-2 z-40 bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-3 text-white">
          <div className="flex items-center justify-center gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="text-base">💪</span>
              <span className="text-slate-300">L izq = Iniciar</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-base">👆</span>
              <span className="text-slate-300">Dedo = Elegir</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-base">👍</span>
              <span className="text-slate-300">OK = Fin</span>
            </span>
          </div>
        </div>
      )}

      {/* Panel de métricas completo */}
      {systemState === 'DISPLAYING' && metrics && (
        <MetricsPanel
          metrics={metrics}
          keys={UCI_KEYS}
          onReset={resetSession}
        />
      )}

      {/* Cursor de dedo índice */}
      {systemState === 'RECORDING' && fingerPosition && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            left: fingerPosition.x,
            top: fingerPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="w-4 h-4 lg:w-5 lg:h-5 bg-yellow-400 rounded-full border-2 lg:border-3 border-white shadow-lg shadow-yellow-400/50" />
        </motion.div>
      )}

      {/* Barra de progreso de gestos */}
      <GestureProgressBar
        progress={gestureProgress}
        label={gestureType === 'starting' ? 'Iniciando grabación...' : 'Finalizando...'}
        color={gestureType === 'starting' ? '#10b981' : '#ef4444'}
        visible={gestureType !== 'none'}
      />

      {/* Overlay de gradiente para contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none z-10" />
    </div>
  );
}

export default App;
