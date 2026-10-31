import { ANIM_FPS, useFrame } from "../time";
import React from "react";
import { interpolate, spring, Easing } from "remotion";
import { Emoji, EmojiGlyph } from "../components/Emoji";
import { RichText } from "../components/RichText";
import { body, display } from "../fonts";
import { Scene, Theme } from "../schema";
import { Card, Stage, Title } from "./common";
import { Drawing as DrawingSvg } from "../drawings/Drawings";

type P<T extends Scene["type"]> = { scene: Extract<Scene, { type: T }>; theme: Theme };

const Hook: React.FC<P<"hook">> = ({ scene, theme }) => {
  const frame = useFrame();
  const shake = frame < 12 ? Math.sin(frame * 2.5) * (12 - frame) : 0;
  return (
    <Stage>
      <Emoji e={scene.emoji} size={260} />
      <div style={{ transform: `translateX(${shake}px)` }}>
        <RichText text={scene.text} highlight={scene.highlight} accent={theme.accent} delay={6} perWord={4}
          style={{ fontFamily: display, fontWeight: 900, fontSize: 104, lineHeight: 1.05, color: theme.text, textTransform: "uppercase", letterSpacing: -2 }} />
      </div>
    </Stage>
  );
};

const Text: React.FC<P<"text">> = ({ scene, theme }) => (
  <Stage>
    <Emoji e={scene.emoji} size={200} />
    {scene.title && <Title theme={theme} delay={4}>{scene.title}</Title>}
    <RichText text={scene.text} highlight={scene.highlight} accent={theme.accent} delay={14} perWord={2}
      style={{ fontWeight: 700, fontSize: 64, lineHeight: 1.25, color: theme.text }} />
  </Stage>
);

const List: React.FC<P<"list">> = ({ scene, theme }) => {
  const fps = ANIM_FPS;
  const step = Math.min(fps * 1.2, (scene.duration * fps - 30) / scene.items.length);
  return (
    <Stage gap={36}>
      <Title theme={theme}>{scene.title}</Title>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, width: "100%" }}>
        {scene.items.map((it, i) => (
          <Card key={i} theme={theme} delay={14 + i * step} from={i % 2 ? "right" : "left"} style={{ display: "flex", alignItems: "center", gap: 30, textAlign: "left", padding: "28px 36px" }}>
            <div style={{ fontFamily: display, fontWeight: 900, fontSize: 64, minWidth: 80, textAlign: "center", color: theme.accent }}>{it.emoji ? <EmojiGlyph e={it.emoji} size={80} /> : i + 1}</div>
            <div style={{ fontWeight: 700, fontSize: 50, lineHeight: 1.2 }}>{it.text}</div>
          </Card>
        ))}
      </div>
    </Stage>
  );
};

const Stat: React.FC<P<"stat">> = ({ scene, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const p = interpolate(frame, [6, fps * 1.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const v = (scene.value * p).toLocaleString("es-ES", { minimumFractionDigits: scene.decimals, maximumFractionDigits: scene.decimals });
  const pop = spring({ frame: frame - fps * 1.8, fps, config: { damping: 6 } });
  const len = (scene.prefix + v + scene.suffix).length;
  return (
    <Stage>
      <div style={{ fontFamily: display, fontWeight: 900, fontSize: Math.min(260, 1500 / Math.max(len, 4)), lineHeight: 1, color: theme.accent, textShadow: `0 0 60px ${theme.accent}99`, transform: `scale(${0.9 + 0.1 * pop})`, whiteSpace: "nowrap" }}>
        {scene.prefix}{v}{scene.suffix}
      </div>
      <RichText text={scene.label} accent={theme.accent} delay={20} perWord={2} style={{ fontWeight: 700, fontSize: 60, lineHeight: 1.25, color: theme.text }} />
    </Stage>
  );
};

const Compare: React.FC<P<"compare">> = ({ scene, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const vs = spring({ frame: frame - 24, fps, config: { damping: 8 } });
  const side = (s: typeof scene.left, d: number, from: "left" | "right", color: string) => (
    <Card theme={theme} delay={d} from={from} style={{ width: "100%", borderColor: color }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {s.emoji && <EmojiGlyph e={s.emoji} size={100} />}
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: display, fontWeight: 900, fontSize: 56, color, textTransform: "uppercase" }}>{s.title}</div>
          <div style={{ fontWeight: 600, fontSize: 42, lineHeight: 1.25, marginTop: 8 }}>{s.text}</div>
        </div>
      </div>
    </Card>
  );
  return (
    <Stage gap={30}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      {side(scene.left, 8, "left", theme.accent)}
      <div style={{ fontFamily: display, fontWeight: 900, fontSize: 90, color: theme.text, transform: `scale(${vs}) rotate(${(1 - vs) * 180}deg)` }}>VS</div>
      {side(scene.right, 30, "right", theme.accent2)}
    </Stage>
  );
};

const Steps: React.FC<P<"steps">> = ({ scene, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const step = Math.min(fps * 1.5, (scene.duration * fps - 30) / scene.steps.length);
  return (
    <Stage gap={40}>
      <Title theme={theme}>{scene.title}</Title>
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ position: "absolute", left: 50, top: 50, width: 8, borderRadius: 4, background: theme.accent, height: `${interpolate(frame, [14, 14 + step * (scene.steps.length - 1)], [0, 82], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%` }} />
        {scene.steps.map((st, i) => {
          const s = spring({ frame: frame - 14 - i * step, fps, config: { damping: 12 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 34, opacity: s, transform: `translateX(${(1 - s) * 100}px)` }}>
              <div style={{ flexShrink: 0, width: 108, height: 108, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontWeight: 900, fontSize: 54, color: theme.bg1, transform: `scale(${s})`, zIndex: 1 }}>{i + 1}</div>
              <div style={{ textAlign: "left", fontWeight: 700, fontSize: 50, lineHeight: 1.2, color: theme.text }}>{st}</div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

const Quote: React.FC<P<"quote">> = ({ scene, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const s = spring({ frame, fps, config: { damping: 10 } });
  const a = spring({ frame: frame - fps * 2, fps });
  return (
    <Stage>
      <div style={{ fontFamily: display, fontWeight: 900, fontSize: 300, lineHeight: 0.6, height: 140, color: theme.accent, transform: `scale(${s})` }}>“</div>
      <RichText text={scene.text} accent={theme.accent} delay={8} perWord={3} style={{ fontFamily: display, fontWeight: 800, fontSize: 72, lineHeight: 1.2, color: theme.text, fontStyle: "italic" }} />
      {scene.author && <div style={{ fontWeight: 600, fontSize: 46, color: theme.accent2, opacity: a }}>— {scene.author}</div>}
    </Stage>
  );
};

const Bars: React.FC<P<"bars">> = ({ scene, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const max = Math.max(...scene.bars.map((b) => b.value));
  return (
    <Stage gap={44}>
      <Title theme={theme}>{scene.title}</Title>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 30 }}>
        {scene.bars.map((b, i) => {
          const p = interpolate(frame, [12 + i * 8, 12 + i * 8 + fps * 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const color = i % 2 ? theme.accent2 : theme.accent;
          return (
            <div key={i} style={{ textAlign: "left", color: theme.text }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 42, marginBottom: 10 }}>
                <span>{b.emoji && <EmojiGlyph e={b.emoji} size={48} style={{ marginRight: 12 }} />}{b.label}</span>
                <span style={{ color, fontFamily: display, fontWeight: 900 }}>{(b.value * p).toLocaleString("es-ES", { maximumFractionDigits: 1 })}{scene.unit}</span>
              </div>
              <div style={{ height: 54, borderRadius: 27, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(b.value / max) * 100 * p}%`, borderRadius: 27, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 30px ${color}88` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

const Outro: React.FC<P<"outro">> = ({ scene, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const c = spring({ frame: frame - fps, fps, config: { damping: 9 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.03 * c;
  return (
    <Stage>
      <Emoji e={scene.emoji} size={240} />
      <RichText text={scene.text} accent={theme.accent} delay={6} perWord={3} style={{ fontFamily: display, fontWeight: 900, fontSize: 88, lineHeight: 1.1, color: theme.text, textTransform: "uppercase" }} />
      {scene.cta && (
        <div style={{ fontFamily: body, fontWeight: 800, fontSize: 50, color: theme.bg1, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`, padding: "26px 54px", borderRadius: 60, transform: `scale(${c * pulse})`, boxShadow: `0 20px 50px ${theme.accent2}66` }}>
          {scene.cta}
        </div>
      )}
    </Stage>
  );
};

const DrawingScene: React.FC<P<"drawing">> = ({ scene, theme }) => (
  <Stage gap={30}>
    {scene.title && (scene.bigTitle ? (
      <RichText text={scene.title} highlight={scene.highlight} accent={theme.accent} perWord={4}
        style={{ fontFamily: display, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: theme.text, textTransform: "uppercase", letterSpacing: -2 }} />
    ) : <Title theme={theme}>{scene.title}</Title>)}
    <div style={{ width: "100%" }}>
      <DrawingSvg name={scene.drawing} data={scene.data} theme={theme} mascot={scene.mascot} />
    </div>
    {scene.text && (
      <RichText text={scene.text} highlight={scene.highlight} accent={theme.accent} delay={20} perWord={2}
        style={{ fontWeight: 700, fontSize: 54, lineHeight: 1.22, color: theme.text }} />
    )}
  </Stage>
);

export const SceneView: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  switch (scene.type) {
    case "hook": return <Hook scene={scene} theme={theme} />;
    case "text": return <Text scene={scene} theme={theme} />;
    case "list": return <List scene={scene} theme={theme} />;
    case "stat": return <Stat scene={scene} theme={theme} />;
    case "compare": return <Compare scene={scene} theme={theme} />;
    case "steps": return <Steps scene={scene} theme={theme} />;
    case "quote": return <Quote scene={scene} theme={theme} />;
    case "bars": return <Bars scene={scene} theme={theme} />;
    case "drawing": return <DrawingScene scene={scene} theme={theme} />;
    case "outro": return <Outro scene={scene} theme={theme} />;
  }
};
