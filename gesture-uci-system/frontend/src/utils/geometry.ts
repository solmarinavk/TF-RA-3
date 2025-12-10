import { PoseLandmark, HandLandmark, PoseLandmarkIndex } from '@/types';
import { getLPoseAngleTolerance, getMinLandmarkVisibility, isMobileDevice } from './constants';

/**
 * Calcula el ángulo entre tres puntos usando producto punto
 * @param p1 - Primer punto (ej: hombro)
 * @param p2 - Punto medio (ej: codo) - vértice del ángulo
 * @param p3 - Tercer punto (ej: muñeca)
 * @returns Ángulo en grados (0-180)
 */
export function calculateAngle(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number },
  p3: { x: number; y: number; z: number }
): number {
  // Vectores desde p2 hacia p1 y p3
  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z
  };

  const v2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: p3.z - p2.z
  };

  // Producto punto
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

  // Magnitudes
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

  // Evitar división por cero
  if (mag1 === 0 || mag2 === 0) return 0;

  // Ángulo en radianes
  const cosAngle = dot / (mag1 * mag2);

  // Clamp para evitar errores de precisión
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));

  // Convertir a grados
  return Math.acos(clampedCos) * (180 / Math.PI);
}

/**
 * Calcula distancia euclidiana 2D entre dos puntos
 * @param p1 - Primer punto
 * @param p2 - Segundo punto
 * @returns Distancia en píxeles o unidades normalizadas
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Convierte coordenadas normalizadas (0-1) a píxeles
 * @param normalized - Coordenadas normalizadas
 * @param dimensions - Dimensiones del canvas
 * @returns Coordenadas en píxeles
 */
export function normalizeToPixels(
  normalized: { x: number; y: number },
  dimensions: { width: number; height: number }
): { x: number; y: number } {
  return {
    x: normalized.x * dimensions.width,
    y: normalized.y * dimensions.height
  };
}

/**
 * Detecta si el brazo izquierdo está en postura L
 * @param landmarks - Array de pose landmarks
 * @returns true si el brazo está en L (90° ± tolerancia)
 */
export function detectLeftLPose(landmarks: PoseLandmark[]): boolean {
  if (!landmarks || landmarks.length < 33) return false;

  const shoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const elbow = landmarks[PoseLandmarkIndex.LEFT_ELBOW];
  const wrist = landmarks[PoseLandmarkIndex.LEFT_WRIST];

  const minVisibility = getMinLandmarkVisibility();
  const angleTolerance = getLPoseAngleTolerance();

  // Verificar visibilidad
  if (
    !shoulder?.visibility || shoulder.visibility < minVisibility ||
    !elbow?.visibility || elbow.visibility < minVisibility ||
    !wrist?.visibility || wrist.visibility < minVisibility
  ) {
    return false;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);

  // Verificar si está cerca de 90 grados
  return Math.abs(angle - 90) < angleTolerance;
}

/**
 * Detecta si el brazo derecho está en postura L
 * @param landmarks - Array de pose landmarks
 * @returns true si el brazo está en L (90° ± tolerancia)
 */
export function detectRightLPose(landmarks: PoseLandmark[]): boolean {
  if (!landmarks || landmarks.length < 33) return false;

  const shoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  const elbow = landmarks[PoseLandmarkIndex.RIGHT_ELBOW];
  const wrist = landmarks[PoseLandmarkIndex.RIGHT_WRIST];

  const minVisibility = getMinLandmarkVisibility();
  const angleTolerance = getLPoseAngleTolerance();

  // Verificar visibilidad
  if (
    !shoulder?.visibility || shoulder.visibility < minVisibility ||
    !elbow?.visibility || elbow.visibility < minVisibility ||
    !wrist?.visibility || wrist.visibility < minVisibility
  ) {
    return false;
  }

  const angle = calculateAngle(shoulder, elbow, wrist);

  // Verificar si está cerca de 90 grados
  return Math.abs(angle - 90) < angleTolerance;
}

/**
 * Verifica si un brazo está completamente visible en pantalla
 * @param shoulder - Landmark del hombro
 * @param elbow - Landmark del codo
 * @param wrist - Landmark de la muñeca
 * @returns true si los 3 puntos están dentro de los límites visibles
 */
function isArmVisibleInFrame(
  shoulder: PoseLandmark,
  elbow: PoseLandmark,
  wrist: PoseLandmark
): boolean {
  const margin = 0.05;
  const minX = margin;
  const maxX = 1 - margin;
  const minY = margin;
  const maxY = 1 - margin;

  const points = [shoulder, elbow, wrist];

  for (const point of points) {
    if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
      return false;
    }
  }

  return true;
}

/**
 * Verifica si el brazo está levantado (pose de L intencional)
 * En coordenadas normalizadas, y=0 es arriba, y=1 es abajo
 * @param elbow - Landmark del codo
 * @param wrist - Landmark de la muñeca
 * @returns true si el antebrazo está levantado
 */
function isArmRaised(elbow: PoseLandmark, wrist: PoseLandmark): boolean {
  // El antebrazo debe estar levantado: muñeca debe estar más arriba o al mismo nivel que el codo
  // Añadimos tolerancia de 0.15 para no ser demasiado estricto
  return wrist.y < elbow.y + 0.15;
}

/**
 * Detecta L-pose en mobile usando solo codo y muñeca (sin necesitar el hombro)
 * Útil cuando la cámara no alcanza a captar el hombro
 * @param elbow - Landmark del codo
 * @param wrist - Landmark de la muñeca
 * @returns true si el antebrazo sugiere una pose de L
 */
function detectForearmLPose(elbow: PoseLandmark, wrist: PoseLandmark): boolean {
  // El antebrazo debe estar aproximadamente horizontal o apuntando hacia arriba
  // En una L, el antebrazo está perpendicular al brazo superior

  // Calcular el ángulo del antebrazo respecto a la horizontal
  const deltaX = wrist.x - elbow.x;
  const deltaY = wrist.y - elbow.y;

  // Ángulo en grados (0° = horizontal derecha, 90° = vertical abajo, -90° = vertical arriba)
  const forearmAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // Para una L válida, el antebrazo debe estar:
  // - Aproximadamente horizontal (entre -45° y 45°) o
  // - Apuntando hacia arriba (entre -90° y -45°)
  // Básicamente, no debe estar apuntando hacia abajo
  const isHorizontalOrUp = forearmAngle > -100 && forearmAngle < 45;

  // Además, la muñeca debe estar a una distancia razonable del codo (brazo extendido, no pegado al cuerpo)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const hasReasonableLength = distance > 0.08; // Al menos 8% del ancho de pantalla

  return isHorizontalOrUp && hasReasonableLength;
}

/**
 * Verifica si codo y muñeca están visibles en el frame (para detección mobile sin hombro)
 */
function isForearmVisibleInFrame(elbow: PoseLandmark, wrist: PoseLandmark): boolean {
  const margin = 0.03; // Margen más pequeño para mobile
  const minX = margin;
  const maxX = 1 - margin;
  const minY = margin;
  const maxY = 1 - margin;

  // Solo verificar codo y muñeca
  if (elbow.x < minX || elbow.x > maxX || elbow.y < minY || elbow.y > maxY) {
    return false;
  }
  if (wrist.x < minX || wrist.x > maxX || wrist.y < minY || wrist.y > maxY) {
    return false;
  }

  return true;
}

/**
 * Detecta ambos brazos en postura L
 * En mobile: permite detección sin hombro visible (solo codo + muñeca)
 * En desktop: requiere hombro + codo + muñeca visibles
 * @param landmarks - Array de pose landmarks
 * @returns Objeto con estado de cada brazo y si está visible en pantalla
 */
export function detectLPose(landmarks: PoseLandmark[]): {
  left: boolean;
  right: boolean;
  leftAngle: number | null;
  rightAngle: number | null;
  leftVisibleInFrame: boolean;
  rightVisibleInFrame: boolean;
} {
  if (!landmarks || landmarks.length < 33) {
    return {
      left: false,
      right: false,
      leftAngle: null,
      rightAngle: null,
      leftVisibleInFrame: false,
      rightVisibleInFrame: false
    };
  }

  const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const leftElbow = landmarks[PoseLandmarkIndex.LEFT_ELBOW];
  const leftWrist = landmarks[PoseLandmarkIndex.LEFT_WRIST];

  const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  const rightElbow = landmarks[PoseLandmarkIndex.RIGHT_ELBOW];
  const rightWrist = landmarks[PoseLandmarkIndex.RIGHT_WRIST];

  const minVisibility = getMinLandmarkVisibility();
  const angleTolerance = getLPoseAngleTolerance();
  const isMobile = isMobileDevice();

  let leftAngle: number | null = null;
  let rightAngle: number | null = null;
  let leftVisibleInFrame = false;
  let rightVisibleInFrame = false;
  let leftDetected = false;
  let rightDetected = false;

  // === BRAZO IZQUIERDO ===
  const leftShoulderVisible = leftShoulder?.visibility && leftShoulder.visibility >= minVisibility;
  const leftElbowVisible = leftElbow?.visibility && leftElbow.visibility >= minVisibility;
  const leftWristVisible = leftWrist?.visibility && leftWrist.visibility >= minVisibility;

  if (leftShoulderVisible && leftElbowVisible && leftWristVisible) {
    // Detección completa con hombro visible (desktop y mobile)
    leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    leftVisibleInFrame = isArmVisibleInFrame(leftShoulder, leftElbow, leftWrist);
    const leftArmRaised = isMobile ? isArmRaised(leftElbow, leftWrist) : true;
    leftDetected = Math.abs(leftAngle - 90) < angleTolerance && leftVisibleInFrame && leftArmRaised;
  } else if (isMobile && leftElbowVisible && leftWristVisible) {
    // MOBILE ONLY: Detección alternativa sin hombro
    // Usar ángulo del antebrazo para inferir pose de L
    leftVisibleInFrame = isForearmVisibleInFrame(leftElbow, leftWrist);
    const leftArmRaised = isArmRaised(leftElbow, leftWrist);
    const forearmLPose = detectForearmLPose(leftElbow, leftWrist);
    leftDetected = leftVisibleInFrame && leftArmRaised && forearmLPose;
  }

  // === BRAZO DERECHO ===
  const rightShoulderVisible = rightShoulder?.visibility && rightShoulder.visibility >= minVisibility;
  const rightElbowVisible = rightElbow?.visibility && rightElbow.visibility >= minVisibility;
  const rightWristVisible = rightWrist?.visibility && rightWrist.visibility >= minVisibility;

  if (rightShoulderVisible && rightElbowVisible && rightWristVisible) {
    // Detección completa con hombro visible (desktop y mobile)
    rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    rightVisibleInFrame = isArmVisibleInFrame(rightShoulder, rightElbow, rightWrist);
    const rightArmRaised = isMobile ? isArmRaised(rightElbow, rightWrist) : true;
    rightDetected = Math.abs(rightAngle - 90) < angleTolerance && rightArmRaised;
  } else if (isMobile && rightElbowVisible && rightWristVisible) {
    // MOBILE ONLY: Detección alternativa sin hombro
    rightVisibleInFrame = isForearmVisibleInFrame(rightElbow, rightWrist);
    const rightArmRaised = isArmRaised(rightElbow, rightWrist);
    const forearmLPose = detectForearmLPose(rightElbow, rightWrist);
    rightDetected = rightVisibleInFrame && rightArmRaised && forearmLPose;
  }

  return {
    left: leftDetected,
    right: rightDetected,
    leftAngle,
    rightAngle,
    leftVisibleInFrame,
    rightVisibleInFrame
  };
}

/**
 * Extrae la posición de la punta del dedo índice de hand landmarks
 * @param handLandmarks - Array de hand landmarks
 * @returns Posición normalizada de la punta del índice o null
 */
export function getIndexFingerTip(handLandmarks: HandLandmark[] | null): { x: number; y: number } | null {
  if (!handLandmarks || handLandmarks.length < 21) return null;

  // INDEX_FINGER_TIP es el landmark 8
  const tip = handLandmarks[8];

  if (!tip) return null;

  return { x: tip.x, y: tip.y };
}

/**
 * Calcula la distancia de un punto a todos los nodos y retorna el más cercano
 * @param point - Punto en píxeles
 * @param nodes - Array de nodos con posiciones normalizadas
 * @param dimensions - Dimensiones del canvas
 * @param threshold - Distancia máxima base (se usa el mayor entre threshold y radius del nodo)
 * @returns ID del nodo más cercano o null
 */
export function findClosestNode(
  point: { x: number; y: number },
  nodes: Array<{ id: string; position: { x: number; y: number }; radius: number }>,
  dimensions: { width: number; height: number },
  _threshold: number // No usado - ahora usamos node.radius directamente
): string | null {
  let closestId: string | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const nodePixels = normalizeToPixels(node.position, dimensions);
    const distance = calculateDistance(point, nodePixels);

    // Detectar si el dedo está DENTRO del círculo (distance < radius)
    // Usamos el radio del nodo como threshold para que funcione en cualquier parte del círculo
    const effectiveThreshold = node.radius;

    if (distance < effectiveThreshold && distance < minDistance) {
      minDistance = distance;
      closestId = node.id;
    }
  }

  return closestId;
}

/**
 * Interpola entre dos valores con easing
 * @param start - Valor inicial
 * @param end - Valor final
 * @param t - Factor de interpolación (0-1)
 * @returns Valor interpolado
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Easing cubic out para animaciones suaves
 * @param t - Factor de tiempo (0-1)
 * @returns Valor con easing aplicado
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Calcula distancia 3D entre dos landmarks
 * @param p1 - Primer landmark
 * @param p2 - Segundo landmark
 * @returns Distancia euclidiana 3D
 */
function distance3D(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

/**
 * Detecta si la mano está abierta (palma extendida)
 * Estrategia simple: la mano está abierta si NO está cerrada
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si la palma está abierta
 */
export function isHandOpen(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  // Estrategia simplificada: si no está cerrada, está abierta
  // Esto hace que sea mucho más fácil activar el inicio de grabación
  return !isHandClosed(handLandmarks);
}

/**
 * Detecta si la mano está cerrada (puño)
 * MUY estricto para evitar cortes accidentales de grabación
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si la mano está cerrada
 */
export function isHandClosed(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  const wrist = handLandmarks[0]; // Muñeca
  const palm = handLandmarks[9]; // Centro de la palma

  // Puntas de los dedos (índice, medio, anular, meñique)
  const fingerTips = [8, 12, 16, 20];

  // Verificar que las puntas estén cerca de la palma (puño cerrado)
  let closedFingers = 0;

  for (const tipIndex of fingerTips) {
    const tip = handLandmarks[tipIndex];

    // Distancia de punta a palma
    const tipToPalm = distance3D(tip, palm);

    // Distancia de punta a muñeca
    const tipToWrist = distance3D(tip, wrist);

    // Más estricto: ratio de 0.35 en vez de 0.4
    if (tipToPalm < tipToWrist * 0.35) {
      closedFingers++;
    }
  }

  // Verificar pulgar también (más estricto: 0.4 en vez de 0.5)
  const thumbTip = handLandmarks[4];
  const thumbToPalm = distance3D(thumbTip, palm);
  const thumbToWrist = distance3D(thumbTip, wrist);

  if (thumbToPalm < thumbToWrist * 0.4) {
    closedFingers++;
  }

  // MUY ESTRICTO: todos los 5 dedos deben estar cerrados
  return closedFingers >= 5;
}

/**
 * Detecta gesto de pulgar arriba (👍)
 * Para finalizar grabación - requiere pulgar extendido y dedos cerrados
 * En móvil: más estricto para evitar activaciones accidentales
 * @param handLandmarks - Array de hand landmarks (21 puntos)
 * @returns true si el pulgar está levantado y los demás dedos cerrados
 */
export function isThumbsUp(handLandmarks: HandLandmark[] | null): boolean {
  if (!handLandmarks || handLandmarks.length < 21) return false;

  const isMobile = isMobileDevice();

  const thumbTip = handLandmarks[4];
  const thumbMCP = handLandmarks[2];
  const indexTip = handLandmarks[8];
  const middleTip = handLandmarks[12];
  const ringTip = handLandmarks[16];
  const pinkyTip = handLandmarks[20];
  const indexMCP = handLandmarks[5];

  // 1. El pulgar debe estar claramente extendido hacia arriba
  // Más estricto: pulgar debe estar significativamente arriba del MCP
  const thumbExtended = thumbTip.y < thumbMCP.y - 0.02;

  // 2. El pulgar debe estar más arriba que las puntas de otros dedos
  const thumbAboveOthers = thumbTip.y < indexTip.y && thumbTip.y < middleTip.y;

  // 3. Los otros dedos deben estar doblados (cerca de la muñeca/palma)
  const foldThreshold = 0.7; // Más estricto
  const indexFolded = distance3D(indexTip, indexMCP) < distance3D(thumbTip, indexMCP) * foldThreshold;
  const middleFolded = distance3D(middleTip, indexMCP) < distance3D(thumbTip, indexMCP) * foldThreshold;
  const ringFolded = distance3D(ringTip, indexMCP) < distance3D(thumbTip, indexMCP) * foldThreshold;
  const pinkyFolded = distance3D(pinkyTip, indexMCP) < distance3D(thumbTip, indexMCP) * foldThreshold;

  // Contar dedos doblados
  const foldedCount = [indexFolded, middleFolded, ringFolded, pinkyFolded].filter(Boolean).length;

  // En móvil: requerir 3 dedos doblados; Desktop: 2 dedos
  const minFoldedRequired = isMobile ? 3 : 2;

  return thumbExtended && thumbAboveOthers && foldedCount >= minFoldedRequired;
}
