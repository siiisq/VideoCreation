import { createContext, useContext } from "react";
import { ANIM_FPS, useFrame } from "./time";

/** Segundo del reel en el que empieza la escena actual (lo pone Reel.tsx). */
export const SceneStart = createContext(0);
/** Tiempo global del reel en unidades de 30 fps: para animaciones que deben continuar sin saltos entre escenas. */
export const useGlobalFrame = () => useFrame() + useContext(SceneStart) * ANIM_FPS;
