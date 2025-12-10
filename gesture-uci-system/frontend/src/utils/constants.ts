import { KeyNode } from '@/types';

// Detectar si es dispositivo móvil o tablet (< 1024px para coincidir con lg: breakpoint)
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
};

// Sistema responsive: círculos se adaptan al viewport
export const UCI_KEYS: KeyNode[] = [
  { id: 'T1', label: 'Alerta respiratoria', color: '#EF4444', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T2', label: 'Alerta cardíaca', color: '#F59E0B', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T3', label: 'Fármacos urgentes', color: '#8B5CF6', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T4', label: 'Material estéril', color: '#06B6D4', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T5', label: 'Equipo quirúrgico', color: '#10B981', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T6', label: 'Sedación necesaria', color: '#6366F1', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T7', label: 'Hemodinamia', color: '#EC4899', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T8', label: 'Soporte ECMO', color: '#F97316', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T9', label: 'Aislamiento urgente', color: '#14B8A6', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null },
  { id: 'T10', label: 'Apoyo inmediato', color: '#84CC16', position: { x: 0, y: 0 }, radius: 50, selectionCount: 0, lastSelected: null }
];

export const SELECTION_DURATION = 3000; // 3 segundos
export const PROXIMITY_THRESHOLD = 80; // pixels
export const HOVER_THRESHOLD = 60; // pixels

// Parámetros de detección de gestos
// En móvil: más estricto para evitar falsos positivos
export const L_POSE_ANGLE_TOLERANCE = 45; // desktop: grados (45-135 grados)
export const L_POSE_ANGLE_TOLERANCE_MOBILE = 30; // móvil: más estricto (60-120 grados)

export const L_POSE_DURATION = 2000; // 2 segundos
export const L_POSE_DURATION_MOBILE = 2000; // móvil: igual que desktop

export const MIN_LANDMARK_VISIBILITY = 0.3; // umbral de visibilidad
export const MIN_LANDMARK_VISIBILITY_MOBILE = 0.4; // móvil: más estricto para evitar detecciones fantasma

export const FPS_TARGET = 30;

// Funciones helper para obtener valores según dispositivo
export const getLPoseAngleTolerance = (): number => {
  return isMobileDevice() ? L_POSE_ANGLE_TOLERANCE_MOBILE : L_POSE_ANGLE_TOLERANCE;
};

export const getLPoseDuration = (): number => {
  return isMobileDevice() ? L_POSE_DURATION_MOBILE : L_POSE_DURATION;
};

export const getMinLandmarkVisibility = (): number => {
  return isMobileDevice() ? MIN_LANDMARK_VISIBILITY_MOBILE : MIN_LANDMARK_VISIBILITY;
};
