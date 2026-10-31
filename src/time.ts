import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Todas las animaciones están escritas en "fotogramas a 30 fps".
 * useFrame() devuelve el tiempo actual en esas unidades (con decimales), así que a 60 fps
 * las animaciones duran lo mismo pero se calculan el doble de veces → más fluidas.
 */
export const ANIM_FPS = 30;
export const useFrame = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame * ANIM_FPS) / fps;
};
