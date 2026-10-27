import { hairKind, pickColor } from "../avatarLook.js";

export default function AvatarPortrait({ look, size = 112 }) {
  const style = look?.style || "Anime";
  const mood = look?.mood || "neutral";
  const hair = pickColor(look?.hair, "#3a3128");
  const eyes = pickColor(look?.eyes, "#6b3f2a");
  const outfit = pickColor(look?.outfit, "#2f3b46");
  const kind = hairKind(look?.hair);
  const pixel = style === "Pixel art";
  const comic = style === "Comic";
  const photo = style === "Photorealistic";
  const dimensional = style === "Stylized 3D";
  const stroke = comic ? 3.2 : photo ? 0.6 : dimensional ? 1.1 : 1.7;
  const skin = photo ? "url(#skin-photo)" : dimensional ? "url(#skin-3d)" : "#f3d2b8";
  const eyeShift = mood === "thinking" ? 4 : 0;
  const eyeScale = mood === "alert" ? 1.18 : mood === "focused" ? 0.86 : 1;
  const pleased = mood === "pleased";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden="true"
      shapeRendering={pixel ? "crispEdges" : "auto"}
    >
      <defs>
        <radialGradient id="skin-3d" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffe0c4" />
          <stop offset="70%" stopColor="#f0c4a4" />
          <stop offset="100%" stopColor="#d9a484" />
        </radialGradient>
        <radialGradient id="skin-photo" cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#f6d7c4" />
          <stop offset="100%" stopColor="#c99278" />
        </radialGradient>
        <clipPath id="portrait-clip">
          <circle cx="80" cy="80" r="74" />
        </clipPath>
      </defs>
      <g clipPath="url(#portrait-clip)">
        <rect width="160" height="160" fill={dimensional ? "#f7f4ef" : "#fffdf8"} />
        <path d="M28 132c12-28 32-40 52-40s40 12 52 40v28H28z" fill={outfit} />
        <rect x="68" y="104" width="24" height="22" rx={pixel ? 0 : 8} fill={skin} />
        {kind !== "bald" && <Hair kind={kind} color={hair} pixel={pixel} />}
        <ellipse cx="80" cy="78" rx="36" ry="40" fill={skin} stroke={hair} strokeWidth={photo ? 0 : stroke * 0.35} />
        {kind === "bald" && (
          <>
            <ellipse cx="46" cy="82" rx="6" ry="8" fill={skin} />
            <ellipse cx="114" cy="82" rx="6" ry="8" fill={skin} />
          </>
        )}
        <Brows mood={mood} />
        <g transform={`translate(${eyeShift} 0) scale(${eyeScale})`} style={{ transformOrigin: "80px 78px" }}>
          {pleased ? (
            <>
              <path d="M58 76q8 8 16 0" fill="none" stroke={eyes} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M86 76q8 8 16 0" fill="none" stroke={eyes} strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Eye cx={66} color={eyes} photo={photo} />
              <Eye cx={94} color={eyes} photo={photo} />
            </>
          )}
        </g>
        <Mouth mood={mood} />
      </g>
      <circle cx="80" cy="80" r="73" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={stroke} />
    </svg>
  );
}

function Hair({ kind, color, pixel }) {
  if (kind === "bun") {
    return (
      <>
        <path d="M46 70c0-36 20-52 34-52s34 16 34 52c-6-18-18-26-34-26S52 52 46 70z" fill={color} />
        <circle cx="80" cy="28" r="14" fill={color} />
      </>
    );
  }
  if (kind === "long") {
    return <path d="M42 78c2-48 22-64 38-64s36 16 38 64c2 36-6 70-14 78-6-28-16-36-24-36s-18 8-24 36c-8-8-16-42-14-78z" fill={color} />;
  }
  if (kind === "bob") {
    return <path d="M44 92c0-52 16-70 36-70s36 18 36 70c-8-6-16 8-36 8s-28-14-36-8z" fill={color} />;
  }
  if (kind === "curly") {
    return (
      <g fill={color}>
        <circle cx="52" cy="58" r="16" />
        <circle cx="80" cy="40" r="20" />
        <circle cx="108" cy="58" r="16" />
        <circle cx="48" cy="82" r="12" />
        <circle cx="112" cy="82" r="12" />
      </g>
    );
  }
  if (kind === "short") {
    return <path d="M50 72c2-30 14-46 30-46s28 16 30 46c-8-16-18-22-30-22s-22 6-30 22z" fill={color} />;
  }
  return <path d={pixel ? "M48 74h64v-8H96V42H64v24H48z" : "M46 76c2-40 18-54 34-54s32 14 34 54c-8-20-18-28-34-28S54 56 46 76z"} fill={color} />;
}

function Eye({ cx, color, photo }) {
  return (
    <g>
      <ellipse cx={cx} cy="78" rx={photo ? 7 : 8} ry="9" fill="#fffdf8" />
      <circle cx={cx} cy="79" r="4.2" fill={color} />
      <circle cx={cx + 1.4} cy="77.4" r="1.3" fill="#fff" />
    </g>
  );
}

function Brows({ mood }) {
  const tilt = mood === "alert" ? -6 : mood === "focused" ? 5 : mood === "thinking" ? 4 : 0;
  return (
    <g fill="none" stroke="#3a3128" strokeWidth="2" strokeLinecap="round">
      <path d={`M56 ${68 + tilt}q8-6 16 0`} />
      <path d={`M88 68q8-6 16 ${tilt}`} />
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === "pleased") return <path d="M68 96q12 12 24 0" fill="none" stroke="#a85b58" strokeWidth="2.2" strokeLinecap="round" />;
  if (mood === "alert") return <ellipse cx="80" cy="98" rx="4" ry="3.2" fill="#a85b58" />;
  if (mood === "focused") return <path d="M70 98h20" stroke="#a85b58" strokeWidth="2" strokeLinecap="round" />;
  if (mood === "thinking") return <path d="M74 98q8 4 14-1" fill="none" stroke="#a85b58" strokeWidth="2" strokeLinecap="round" />;
  return <path d="M72 97q8 6 16 0" fill="none" stroke="#a85b58" strokeWidth="2" strokeLinecap="round" />;
}
