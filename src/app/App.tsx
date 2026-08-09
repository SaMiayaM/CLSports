import React, { useState, useId, createContext, useContext, useCallback } from "react";
import {
  Menu, X, ArrowRight, Phone, Mail, MapPin,
  Instagram, Twitter, Facebook, Youtube,
  CheckCircle, Users, User,
  Heart, Zap, Shield, Star, ChevronRight,
  RotateCcw, Camera, Calendar, Clock,
} from "lucide-react";
import {
  motion, AnimatePresence,
  useScroll, useTransform,
} from "motion/react";
import { ShoppingCart } from "lucide-react";
import { CartProvider, useCart } from "@/app/components/payments/CartContext";
import { CartDrawer } from "@/app/components/payments/CartDrawer";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import InstagramGallery from "@/app/components/InstagramGallery";
import { SquareCheckout } from "@/app/components/payments/SquareCheckout";

// ─── Coach video imports ──────────────────────────────────────────────────────
import coachVideo  from "@/imports/coachd__1_.mp4?url";
import coachVideo2 from "@/imports/coachd__1_-1.mp4?url";

// ─── Logo imports ─────────────────────────────────────────────────────────────
import logoRed from "@/imports/logo-red.png";

// ─── Product image imports — Studio ──────────────────────────────────────────
import tshirtWhiteFront from "@/imports/TSHIRT-white-2-FRONT.png";
import tshirtWhiteBack  from "@/imports/TSHIRT-white-2-BACK.png";
import tshirtBlackFront from "@/imports/TSHIRT-BLACK-_1-FRONT.png";
import tshirtBlackBack  from "@/imports/TSHIRT-BLACK-_1-BACK.png";
import tankWhiteFront   from "@/imports/TANK-white-2-FRONT.png";
import tankWhiteBack    from "@/imports/TANK-white-2-BACK.png";
import tankBlackFront   from "@/imports/TANK-BLACK-_1-FRONT.png";
import tankBlackBack    from "@/imports/TANK-BLACK-_1-BACK.png";

// ─── Product image imports — On Court ────────────────────────────────────────
import tankBlackFront2   from "@/imports/image-0.jpg";
import tankBlackBack2    from "@/imports/image-1.jpg";
import tshirtBlackFront2 from "@/imports/image-2.jpg";
import tshirtBlackBack2  from "@/imports/image-3.jpg";
import tshirtWhiteBack2  from "@/imports/image-4.jpg";
import tshirtWhiteFront2 from "@/imports/image-5.jpg";
import tankWhiteFront2   from "@/imports/image-6.jpg";
import tankWhiteBack2    from "@/imports/image-7.jpg";

// ─── Page type ────────────────────────────────────────────────────────────────
type Page = "home" | "about" | "training" | "shop" | "gallery" | "schedule";

// ─── Navigation context ───────────────────────────────────────────────────────
const NavCtx = createContext<{ page: Page; go: (p: Page) => void }>({
  page: "home",
  go: () => {},
});
const useNav = () => useContext(NavCtx);

// ─── Global CSS ──────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  .font-display { font-family: 'Oswald', sans-serif; }
  .font-body    { font-family: 'Inter', sans-serif; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #080808; }
  ::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 2px; }
  * { scrollbar-width: thin; scrollbar-color: #dc2626 #080808; }

  @keyframes ballBounceY {
    0%   { transform: translateY(0px); }
    22%  { transform: translateY(-130px); }
    38%  { transform: translateY(5px); }
    53%  { transform: translateY(-58px); }
    65%  { transform: translateY(5px); }
    76%  { transform: translateY(-24px); }
    85%  { transform: translateY(3px); }
    92%  { transform: translateY(-9px); }
    97%  { transform: translateY(2px); }
    100% { transform: translateY(0px); }
  }
  @keyframes ballBounceSquash {
    0%,1%  { transform: scaleX(1)    scaleY(1); }
    15%    { transform: scaleX(0.93) scaleY(1.08); }
    36%    { transform: scaleX(1)    scaleY(1); }
    38%    { transform: scaleX(1.32) scaleY(0.68); }
    41%    { transform: scaleX(0.96) scaleY(1.04); }
    43%    { transform: scaleX(1)    scaleY(1); }
    65%    { transform: scaleX(1.16) scaleY(0.84); }
    68%    { transform: scaleX(1)    scaleY(1); }
    85%    { transform: scaleX(1.09) scaleY(0.91); }
    87%    { transform: scaleX(1)    scaleY(1); }
    100%   { transform: scaleX(1)    scaleY(1); }
  }
  @keyframes ballBounceRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-600deg); }
  }
  @keyframes ballBounceShadow {
    0%   { transform: scaleX(1);    opacity: 0.55; }
    22%  { transform: scaleX(0.28); opacity: 0.06; }
    38%  { transform: scaleX(1.14); opacity: 0.62; }
    53%  { transform: scaleX(0.52); opacity: 0.18; }
    65%  { transform: scaleX(1.06); opacity: 0.55; }
    85%  { transform: scaleX(1.02); opacity: 0.5; }
    100% { transform: scaleX(1);    opacity: 0.55; }
  }
  .ball-bounce-y      { animation: ballBounceY      2.8s cubic-bezier(.42,0,.58,1) infinite; }
  .ball-bounce-squash { animation: ballBounceSquash 2.8s cubic-bezier(.42,0,.58,1) infinite; transform-origin: 50% 100%; }
  .ball-bounce-rotate { animation: ballBounceRotate 2.8s linear infinite; }
  .ball-bounce-shadow { animation: ballBounceShadow 2.8s cubic-bezier(.42,0,.58,1) infinite; }

  @keyframes particleRise {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    8%   { opacity: 0.75; }
    90%  { opacity: 0.55; }
    100% { transform: translateY(-120px) translateX(var(--px, 15px)); opacity: 0; }
  }
  .particle {
    position: absolute; border-radius: 50%; pointer-events: none;
    animation: particleRise var(--pd, 4s) ease-in-out var(--del, 0s) infinite;
  }

  .glass {
    background: rgba(255,255,255,0.035);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .glass-deep {
    background: rgba(255,255,255,0.055);
    backdrop-filter: blur(26px); -webkit-backdrop-filter: blur(26px);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09);
  }
  .glass-nav {
    background: rgba(8,8,8,0.88);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.055);
  }
  .text-gradient-fire {
    background: linear-gradient(135deg, #dc2626 0%, #f97316 55%, #fbbf24 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .hero-bg {
    background:
      radial-gradient(ellipse 80% 65% at 50% 55%, rgba(220,38,38,0.16) 0%, rgba(249,115,22,0.06) 40%, transparent 68%),
      radial-gradient(ellipse 40% 40% at 80% 18%, rgba(220,38,38,0.08) 0%, transparent 60%), #080808;
  }
  .section-glow { background: radial-gradient(ellipse 55% 40% at 50% 50%, rgba(220,38,38,0.07) 0%, transparent 72%); }
  .red-strip {
    background:
      radial-gradient(ellipse 70% 55% at 50% 55%, rgba(220,38,38,0.14) 0%, transparent 70%), #0a0000;
    border-top: 1px solid rgba(220,38,38,0.15); border-bottom: 1px solid rgba(220,38,38,0.15);
  }
  .divider-red { height: 2px; background: linear-gradient(90deg, transparent, #dc2626, #f97316, transparent); }
  .divider-subtle { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); }
  .form-input {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    color: #f0f0f0; font-family: 'Inter', sans-serif; font-size: 14px;
    width: 100%; padding: 13px 16px; border-radius: 4px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .form-input:focus { outline: none; border-color: rgba(220,38,38,0.55); box-shadow: 0 0 0 3px rgba(220,38,38,0.12); }
  .form-input::placeholder { color: rgba(255,255,255,0.25); }
  .form-label { font-family: 'Oswald', sans-serif; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; font-size: 11px; color: rgba(255,255,255,0.45); display: block; margin-bottom: 7px; }

  @keyframes introGlowPulse {
    0%,100% { opacity: 0.55; transform: scale(1); }
    50%     { opacity: 0.85; transform: scale(1.06); }
  }
  .intro-glow-loop { animation: introGlowPulse 2.8s ease-in-out infinite; }

  .coach-schedule-section {
    padding: 6rem 0;
    background:
      radial-gradient(circle at top right, rgba(239, 0, 0, 0.16), transparent 34rem),
      #050505;
  }
  .coach-schedule-container {
    width: min(1120px, calc(100% - 2rem));
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.85fr);
    gap: 4rem;
    align-items: center;
  }
  .coach-video-card {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: 1.5rem;
    background: #050505;
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .coach-video-card video,
  .coach-video {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    background: #050505;
  }
  .coach-schedule-copy {
    max-width: 620px;
  }
  .coach-schedule-copy h2 {
    max-width: 760px;
    margin: 0 0 1.25rem;
    font-size: clamp(3rem, 7vw, 6.5rem);
    line-height: 0.88;
    letter-spacing: -0.05em;
    text-transform: uppercase;
  }
  .coach-schedule-copy p {
    max-width: 560px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 1rem;
    line-height: 1.75;
  }
  .coach-schedule-list {
    display: grid;
    gap: 0.85rem;
    margin: 2rem 0;
    padding: 0;
    list-style: none;
    color: rgba(255, 255, 255, 0.78);
  }
  .coach-schedule-list li {
    padding-left: 1.75rem;
    position: relative;
    line-height: 1.5;
  }
  .coach-schedule-list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.65em;
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 999px;
    background: #ef0000;
  }
  .instagram-gallery-section {
    padding: 4rem 0 5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .instagram-gallery-section .section-header {
    max-width: 760px;
    margin-bottom: 2rem;
  }
  .instagram-gallery-section h2 {
    margin-bottom: 0.75rem;
  }
  .gallery-page {
    background: #050505;
    color: #ffffff;
  }
  .gallery-hero {
    padding: 7rem 0 4rem;
  }
  .gallery-cta {
    padding: 5rem 0;
  }
  .section-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    font-family: 'Oswald', sans-serif;
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.48);
    margin-bottom: 0.8rem;
  }
  .section-kicker::before {
    content: "";
    width: 1.75rem;
    height: 1px;
    background: #dc2626;
  }

  .schedule-request-options {
    display: grid;
    gap: 1rem;
  }
  .schedule-request-card {
    padding: 1.1rem 1.15rem;
    border-radius: 1rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .schedule-request-form {
    display: grid;
    gap: 1rem;
  }
  .schedule-request-grid {
    display: grid;
    gap: 1rem;
  }
  .schedule-request-form select,
  .schedule-request-form textarea {
    appearance: none;
  }

  @media (max-width: 900px) {
    .coach-schedule-container {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }

    .coach-schedule-section {
      padding: 4rem 0;
    }

    .coach-schedule-copy h2 {
      font-size: clamp(2.75rem, 13vw, 5rem);
    }

    .coach-video-card {
      max-width: 520px;
    }
  }
`;

// ─── Data ────────────────────────────────────────────────────────────────────
interface Product {
  id: number; name: string; category: "elite";
  color: "Black" | "White"; type: "Tee" | "Tank";
  front: string; back: string; lifestyleFront: string; lifestyleBack: string;
  badge?: string; price: string;
}

const PRODUCTS: Product[] = [
  { id: 1, name: "CL Sports Club Tee — Black", category: "elite", color: "Black", type: "Tee",
    front: tshirtBlackFront, back: tshirtBlackBack, lifestyleFront: tshirtBlackFront2, lifestyleBack: tshirtBlackBack2, badge: "New", price: "Kids $25 • Adults $35" },
  { id: 2, name: "CL Sports Club Tee — White", category: "elite", color: "White", type: "Tee",
    front: tshirtWhiteFront, back: tshirtWhiteBack, lifestyleFront: tshirtWhiteFront2, lifestyleBack: tshirtWhiteBack2, price: "Kids $25 • Adults $35" },
  { id: 3, name: "CL Sports Club Tank — Black", category: "elite", color: "Black", type: "Tank",
    front: tankBlackFront, back: tankBlackBack, lifestyleFront: tankBlackFront2, lifestyleBack: tankBlackBack2, badge: "New", price: "Kids $25 • Adults $35" },
  { id: 4, name: "CL Sports Club Tank — White", category: "elite", color: "White", type: "Tank",
    front: tankWhiteFront, back: tankWhiteBack, lifestyleFront: tankWhiteFront2, lifestyleBack: tankWhiteBack2, price: "Kids $25 • Adults $35" },
];

const GOALS = [
  { icon: Heart,  label: "Confidence", desc: "We build athletes who believe in themselves on and off the court." },
  { icon: Shield, label: "Discipline", desc: "Success comes from consistent effort, every single session." },
  { icon: Star,   label: "Respect",    desc: "Honor your teammates, coaches, opponents, and the game itself." },
  { icon: Zap,    label: "Growth",     desc: "Every workout is an opportunity to improve. We never stop developing." },
  { icon: Users,  label: "Community",  desc: "Building stronger athletes while strengthening our community." },
];

const WEEKLY_SCHEDULE = [
  { day: "Sunday", sessions: [
    { time: "3:00 – 6:00 PM", name: "Travel Basketball Availability", level: "Appointment Only", spots: "Limited", color: "red" },
  ]},
  { day: "Monday", sessions: [
    { time: "By Appointment", name: "Private Training", level: "Travel Basketball Focus", spots: 1, color: "orange" },
  ]},
  { day: "Wednesday", sessions: [
    { time: "By Appointment", name: "Development Session", level: "Skill Growth", spots: 2, color: "orange" },
  ]},
  { day: "Thursday", sessions: [
    { time: "By Appointment", name: "Skills Evaluation", level: "Player Assessment", spots: 1, color: "orange" },
  ]},
  { day: "Saturday", sessions: [
    { time: "By Appointment", name: "Competitive Workout", level: "Travel Basketball Prep", spots: 2, color: "orange" },
  ]},
];

// ─── Motion variants ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as number[] } },
};
const stagger = (delay = 0.08) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
});
const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0,   transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as number[] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.28, ease: "easeIn" } },
};

// ─── Basketball SVG ───────────────────────────────────────────────────────────
function BallSVG({ size, uid }: { size: number; uid: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" style={{ overflow: "visible", display: "block" }}>
      <defs>
        <clipPath id={`bc-${uid}`}><circle cx="130" cy="130" r="120"/></clipPath>
        <filter id={`lf-${uid}`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.88 0.82" numOctaves="4" seed="7" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.07  0 0 0 0 0  0 0 0 0.3 0" in="noise" result="dn"/>
          <feComposite in="dn" in2="SourceGraphic" operator="in" result="clipped"/>
          <feBlend in="SourceGraphic" in2="clipped" mode="multiply"/>
        </filter>
        <radialGradient id={`lb-${uid}`} cx="40%" cy="36%" r="74%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#e86a1e"/>
          <stop offset="38%"  stopColor="#cb5410"/>
          <stop offset="70%"  stopColor="#8e3608"/>
          <stop offset="100%" stopColor="#481c04"/>
        </radialGradient>
        <radialGradient id={`ao-${uid}`} cx="50%" cy="62%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"/>
          <stop offset="60%"  stopColor="rgba(0,0,0,0.18)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.68)"/>
        </radialGradient>
        <radialGradient id={`rl-${uid}`} cx="80%" cy="78%" r="52%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="rgba(220,38,38,0.42)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
        <radialGradient id={`fl-${uid}`} cx="50%" cy="92%" r="52%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="rgba(210,105,45,0.2)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <circle cx="130" cy="130" r="120" fill={`url(#lb-${uid})`}/>
      <circle cx="130" cy="130" r="120" filter={`url(#lf-${uid})`}/>
      <circle cx="130" cy="130" r="120" fill={`url(#fl-${uid})`}/>
      <circle cx="130" cy="130" r="120" fill={`url(#ao-${uid})`}/>
      <circle cx="130" cy="130" r="120" fill={`url(#rl-${uid})`} opacity="0.88"/>
      <g clipPath={`url(#bc-${uid})`} fill="none" strokeLinecap="round">
        <g stroke="rgba(255,165,80,0.2)" strokeWidth="5">
          <path d="M 10,131 C 64,109 98,124 130,131 C 162,138 196,153 250,131"/>
          <path d="M 130,10 C 109,64 124,98 130,131 C 138,162 153,196 130,250"/>
          <path d="M 130,10 C 86,24 60,78 57,131 C 55,184 75,236 130,250"/>
          <path d="M 130,10 C 174,24 200,78 203,131 C 205,184 185,236 130,250"/>
        </g>
        <g stroke="#1c0900" strokeWidth="4.2">
          <path d="M 10,131 C 64,109 98,124 130,131 C 162,138 196,153 250,131"/>
          <path d="M 130,10 C 109,64 124,98 130,131 C 138,162 153,196 130,250"/>
          <path d="M 130,10 C 86,24 60,78 57,131 C 55,184 75,236 130,250"/>
          <path d="M 130,10 C 174,24 200,78 203,131 C 205,184 185,236 130,250"/>
        </g>
      </g>
      <ellipse cx="90" cy="76" rx="38" ry="22" fill="rgba(255,255,255,0.15)" transform="rotate(-32,90,76)" clipPath={`url(#bc-${uid})`}/>
      <ellipse cx="82" cy="67" rx="23" ry="13" fill="rgba(255,255,255,0.35)" transform="rotate(-32,82,67)" clipPath={`url(#bc-${uid})`}/>
      <ellipse cx="76" cy="61" rx="10" ry="6"  fill="rgba(255,255,255,0.6)"  transform="rotate(-32,76,61)" clipPath={`url(#bc-${uid})`}/>
      <circle cx="130" cy="130" r="120" fill="none" stroke="#1c0900" strokeWidth="2.5"/>
    </svg>
  );
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-px bg-red-600"/>
      <span className="font-display text-[10px] tracking-[0.28em] text-red-500 uppercase">{text}</span>
    </div>
  );
}

function Heading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-display font-bold uppercase leading-none tracking-tight text-white ${className}`}
      style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)" }}>
      {children}
    </h2>
  );
}

function BtnRed({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button onClick={onClick}
      whileHover={{ scale: 1.035, boxShadow: "0 0 32px rgba(220,38,38,0.55)" }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 font-display font-semibold uppercase tracking-[0.12em] text-sm px-8 py-3.5 rounded-sm bg-red-600 text-white cursor-pointer ${className}`}>
      {children}
    </motion.button>
  );
}

function BtnGlass({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 font-display font-semibold uppercase tracking-[0.12em] text-sm px-8 py-3.5 rounded-sm glass text-white cursor-pointer ${className}`}>
      {children}
    </motion.button>
  );
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} variants={fadeUp}
      initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}>
      {children}
    </motion.div>
  );
}

function StaggerGrid({ children, className = "", staggerDelay = 0.07 }: {
  children: React.ReactNode; className?: string; staggerDelay?: number;
}) {
  return (
    <motion.div className={className} variants={stagger(staggerDelay)}
      initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
      {children}
    </motion.div>
  );
}

// ─── Cinematic Intro ─────────────────────────────────────────────────────────
const TAGLINE_WORDS = ["Precision", "·", "Power", "·", "Performance"];

function CinematicIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  const finish = useCallback(() => {
    setPhase("out");
    setTimeout(onDone, 1100);
  }, [onDone]);

  React.useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 1400);
    const exitTimer = setTimeout(finish, 4000);
    return () => { clearTimeout(holdTimer); clearTimeout(exitTimer); };
  }, [finish]);

  return (
    <AnimatePresence>
      {phase !== "out" && (
        <motion.div key="intro"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#080808" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}>

          <motion.div className="absolute inset-0 pointer-events-none intro-glow-loop"
            style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(220,38,38,0.22) 0%, rgba(220,38,38,0.06) 50%, transparent 75%)" }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 200px 60px rgba(0,0,0,0.85)" }}/>
          <motion.div className="absolute"
            style={{ width: "min(340px, 55vw)", height: "2px",
              background: "linear-gradient(90deg, transparent, #dc2626, rgba(255,120,80,0.9), #dc2626, transparent)" }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.77, 0, 0.18, 1], delay: 0.1 }}
          />

          <motion.div className="relative flex flex-col items-center">
            <motion.div className="relative"
              style={{ width: "min(260px, 48vw)", height: "min(260px, 48vw)" }}
              initial={{ opacity: 0, scale: 0.82, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}>
              <motion.div className="absolute pointer-events-none"
                style={{ inset: "-10px", borderRadius: "22px",
                  background: "conic-gradient(from 0deg, transparent 0%, rgba(220,38,38,0.5) 20%, rgba(255,180,100,0.35) 35%, rgba(255,255,255,0.5) 45%, rgba(220,38,38,0.4) 60%, transparent 80%)",
                  filter: "blur(10px)", zIndex: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ opacity: { delay: 0.9, duration: 0.8 }, rotate: { delay: 0.9, duration: 4, ease: "linear", repeat: Infinity } }}
              />
              <motion.div className="absolute pointer-events-none"
                style={{ inset: "-2px", borderRadius: "18px",
                  background: "conic-gradient(from 0deg, transparent 0%, rgba(180,180,180,0.15) 10%, rgba(255,255,255,0.9) 22%, rgba(220,38,38,0.95) 32%, rgba(255,200,120,0.7) 40%, rgba(255,255,255,0.85) 50%, rgba(180,180,180,0.12) 60%, transparent 72%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor", maskComposite: "exclude", padding: "2px", zIndex: 1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ opacity: { delay: 0.9, duration: 0.6 }, rotate: { delay: 0.9, duration: 4, ease: "linear", repeat: Infinity } }}
              />
              <img src={logoRed} alt="CL Sports Club" className="select-none relative"
                style={{ width: "100%", height: "100%", objectFit: "contain", zIndex: 2 }}/>
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ filter: "blur(32px)", background: "radial-gradient(circle, rgba(220,38,38,0.45) 0%, transparent 65%)", zIndex: 0 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
              />
            </motion.div>

            <motion.div className="flex items-center gap-3 mt-7"
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 1.5 } } }}>
              {TAGLINE_WORDS.map((word, i) => (
                <motion.span key={i}
                  className="font-display font-light text-white/60 uppercase"
                  style={{ fontSize: "clamp(0.5rem, 1.2vw, 0.72rem)", letterSpacing: "0.42em" }}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}>
                  {word}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          <motion.button onClick={finish}
            className="fixed bottom-6 right-6 font-display text-[11px] tracking-[0.18em] uppercase text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}>
            Skip ▸
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const { page, go } = useNav();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { items } = useCart();
  const totalCount = items.reduce((s, it) => s + it.quantity, 0);

  const tabs: { label: string; page: Page }[] = [
    { label: "About",    page: "about" },
    { label: "Schedule", page: "schedule" },
    { label: "Gallery",  page: "gallery" },
    { label: "Shop",     page: "shop" },
  ];

  const nav = (p: Page) => { go(p); setOpen(false); };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
          <motion.button onClick={() => nav("home")} whileHover={{ opacity: 0.85 }}
            className="flex items-center gap-2.5">
            <img src={logoRed} alt="CL Sports Club" className="h-9 w-9 object-contain"
              style={{ filter: "drop-shadow(0 0 6px rgba(220,38,38,0.45))" }}/>
            <div className="flex flex-col leading-none items-start">
              <span className="font-display font-bold text-sm tracking-widest text-white uppercase">CL Sports Club</span>
              <span className="font-display text-[9px] tracking-[0.35em] text-red-500 uppercase">CL Sports Club</span>
            </div>
          </motion.button>

          <div className="hidden md:flex items-center gap-1">
            {tabs.map((t) => (
              <motion.button key={t.page} onClick={() => nav(t.page)}
                className="relative px-5 py-2 cursor-pointer group">
                <span className={`font-display text-[12px] tracking-[0.14em] uppercase transition-colors ${page === t.page ? "text-white" : "text-white/55 group-hover:text-white"}`}>
                  {t.label}
                </span>
                {page === t.page && (
                  <motion.div layoutId="nav-pill"
                    className="absolute inset-0 rounded-sm bg-white/[0.07] border border-white/[0.09]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}/>
                )}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setCartOpen(true)} className="text-white p-1 relative">
              <ShoppingCart size={18} />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-xs w-4 h-4 rounded-full flex items-center justify-center text-white">{totalCount}</span>
              )}
            </button>
            <BtnRed onClick={() => nav("training")} className="hidden sm:inline-flex text-xs px-5 py-2.5">
              Explore Programs
            </BtnRed>
            <button onClick={() => setOpen(!open)} className="md:hidden text-white p-1">
              {open ? <X size={21}/> : <Menu size={21}/>}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}/>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#0d0d0d] border-l border-white/[0.07] flex flex-col items-center px-8 pt-12 pb-10 md:hidden">
              <button onClick={() => setOpen(false)} className="absolute top-5 right-5 text-white/50 hover:text-white">
                <X size={20}/>
              </button>
              <button onClick={() => nav("home")} className="flex flex-col items-center mb-10">
                <img src={logoRed} alt="CL Sports Club" className="w-24 h-24 object-contain mb-3"
                  style={{ filter: "drop-shadow(0 0 16px rgba(220,38,38,0.5))" }}/>
                <span className="font-display text-[10px] tracking-[0.38em] text-red-500 uppercase">CL Sports Club</span>
              </button>
              <nav className="flex flex-col gap-1 w-full">
                {tabs.map((t) => (
                  <button key={t.page} onClick={() => nav(t.page)}
                    className={`text-center font-display text-sm tracking-[0.15em] uppercase py-3.5 border-b border-white/[0.06] ${page === t.page ? "text-red-500" : "text-white/60"}`}>
                    {t.label}
                  </button>
                ))}
                <button onClick={() => nav("training")}
                  className={`text-center font-display text-sm tracking-[0.15em] uppercase py-3.5 border-b border-white/[0.06] ${page === "training" ? "text-red-500" : "text-white/60"}`}>
                  Explore Programs
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const { go } = useNav();
  return (
    <footer className="bg-[#050505] border-t border-white/[0.055]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <button onClick={() => go("home")} className="flex items-center gap-3 mb-4">
              <img src={logoRed} alt="CL" className="h-11 w-11 object-contain"
                style={{ filter: "drop-shadow(0 0 4px rgba(220,38,38,0.3))" }}/>
              <div className="flex flex-col items-start">
                <span className="font-display font-bold text-xl tracking-widest text-white uppercase">CL Sports Club</span>
                <span className="font-display text-[9px] tracking-[0.35em] text-red-500 uppercase mt-0.5">CL Sports Club</span>
              </div>
            </button>
            <p className="font-body text-sm text-white/38 leading-relaxed">
              Developing athletes. Building leaders. Rahway, NJ — est. 2018.
            </p>
          </div>
          <div>
            <h4 className="font-display text-[10px] font-semibold tracking-[0.22em] uppercase text-white/38 mb-4">Navigation</h4>
            <ul className="space-y-2">
              {([["About","about"],["Schedule","schedule"],["Gallery","gallery"],["Programs","training"],["Shop Official Gear","shop"]] as [string,Page][]).map(([label, p]) => (
                <li key={p}>
                  <button onClick={() => go(p)} className="font-body text-sm text-white/45 hover:text-white transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-[10px] font-semibold tracking-[0.22em] uppercase text-white/38 mb-4">Connect</h4>
            <div className="flex gap-2 mb-4">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <motion.button key={i} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/40 hover:text-red-500 transition-colors">
                  <Icon size={13}/>
                </motion.button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Phone size={12} className="text-red-500"/><span className="font-body text-xs text-white/40">(908) 555-0142</span></div>
              <div className="flex items-center gap-2"><Mail size={12} className="text-red-500"/><span className="font-body text-xs text-white/40">info@clsportsclub.com</span></div>
              <div className="flex items-center gap-2"><MapPin size={12} className="text-red-500"/><span className="font-body text-xs text-white/40">Rahway, NJ 07065</span></div>
            </div>
          </div>
        </div>
        <div className="divider-subtle mt-10 mb-6"/>
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <p className="font-body text-xs text-white/20">© 2025 CL Sports Club. All rights reserved.</p>
          <p className="font-body text-xs text-white/20">Apparel by <span className="text-orange-500/70">Lyfer Athletics</span></p>
        </div>
      </div>
    </footer>
  );
}

// ─── Hero Logo Ball ───────────────────────────────────────────────────────────
function HeroLogoBall({ y }: { y: import("motion/react").MotionValue<number> }) {
  const SIZE = 420;
  const LOGO = 272;
  return (
    <motion.div style={{ y }}
      className="relative flex items-center justify-center select-none"
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.55, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
      <div style={{ width: SIZE, height: SIZE, position: "relative" }}>
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ filter: "blur(55px)", background: "radial-gradient(circle, rgba(220,38,38,0.38) 0%, rgba(180,30,30,0.12) 55%, transparent 75%)" }}/>
        <motion.div className="absolute inset-0 rounded-full overflow-hidden"
          style={{ background: "radial-gradient(ellipse 80% 80% at 38% 32%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 55%, transparent 100%)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.3)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 24, ease: "linear", repeat: Infinity }}>
          <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full" fill="none" strokeLinecap="round">
            <g stroke="rgba(255,255,255,0.13)" strokeWidth="2.2">
              <path d="M 10,131 C 64,109 98,124 130,131 C 162,138 196,153 250,131"/>
              <path d="M 130,10 C 109,64 124,98 130,131 C 138,162 153,196 130,250"/>
              <path d="M 130,10 C 86,24 60,78 57,131 C 55,184 75,236 130,250"/>
              <path d="M 130,10 C 174,24 200,78 203,131 C 205,184 185,236 130,250"/>
            </g>
            <g stroke="rgba(0,0,0,0.25)" strokeWidth="1.4">
              <path d="M 10,131 C 64,109 98,124 130,131 C 162,138 196,153 250,131"/>
              <path d="M 130,10 C 109,64 124,98 130,131 C 138,162 153,196 130,250"/>
              <path d="M 130,10 C 86,24 60,78 57,131 C 55,184 75,236 130,250"/>
              <path d="M 130,10 C 174,24 200,78 203,131 C 205,184 185,236 130,250"/>
            </g>
          </svg>
        </motion.div>
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ inset: "-10px", background: "conic-gradient(from 0deg, transparent 0%, rgba(220,38,38,0.5) 20%, rgba(255,180,100,0.32) 35%, rgba(255,255,255,0.48) 45%, rgba(220,38,38,0.38) 60%, transparent 78%)", filter: "blur(11px)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}/>
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ inset: "-2px", background: "conic-gradient(from 0deg, transparent 0%, rgba(160,160,160,0.1) 8%, rgba(255,255,255,0.92) 20%, rgba(220,38,38,0.95) 30%, rgba(255,210,130,0.7) 38%, rgba(255,255,255,0.88) 48%, rgba(160,160,160,0.1) 58%, transparent 70%)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", padding: "2px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}/>
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ inset: "-2px", background: "conic-gradient(from 0deg, transparent 0%, transparent 82%, rgba(255,255,255,0.6) 88%, rgba(255,255,255,0.95) 91%, rgba(255,255,255,0.6) 94%, transparent 100%)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", padding: "2px" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 7, ease: "linear", repeat: Infinity }}/>
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
          <img src={logoRed} alt="CL Sports Club" className="select-none"
            style={{ width: LOGO, height: LOGO, objectFit: "contain", filter: "drop-shadow(0 0 28px rgba(220,38,38,0.65)) drop-shadow(0 0 8px rgba(220,38,38,0.35))" }}/>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
function HomePage() {
  const { go } = useNav();
  const heroRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const ballY = useTransform(scrollYProgress, [0, 0.4], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scrollToPrograms = () => document.getElementById("programs")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden hero-bg">
        <motion.div style={{ opacity: heroOpacity }} className="max-w-6xl mx-auto px-5 sm:px-8 w-full pt-20 pb-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <motion.div variants={stagger(0.1)} initial="hidden" animate="show">
                <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-px bg-red-600"/>
                  <span className="font-display text-[10px] tracking-[0.28em] text-red-500 uppercase">Rahway, NJ · Est. 2018</span>
                </motion.div>
                <motion.h1 variants={fadeUp} className="font-display font-bold uppercase leading-none tracking-tight text-white" style={{ fontSize: "clamp(3rem, 8vw, 6.4rem)" }}>
                  Train.<br/>
                  <span className="text-gradient-fire">Compete.</span><br/>
                  Represent.
                </motion.h1>
                <motion.p variants={fadeUp} className="font-body text-white/50 text-lg leading-relaxed mt-6 max-w-md">
                  CL Sports Club develops young athletes through travel basketball, skill clinics, group training, and individual development in Rahway, NJ — with official club gear by Lyfer Athletics.
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mt-8">
                  <BtnRed onClick={scrollToPrograms}>
                    Explore Programs <ArrowRight size={15}/>
                  </BtnRed>
                  <BtnGlass onClick={() => go("schedule")}>
                    View Schedule
                  </BtnGlass>
                  <BtnGlass onClick={() => go("shop")}>
                    Shop Official Gear
                  </BtnGlass>
                </motion.div>
              </motion.div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <HeroLogoBall y={ballY}/>
            </div>
          </div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to top, #080808, transparent)" }}/>
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-white/40"/>
          </div>
        </motion.div>
      </section>

      <div className="divider-red"/>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <SectionLabel text="About CL Sports Club"/>
            <Heading className="mb-5">Built for Player Development.</Heading>
            <p className="font-body text-white/52 leading-relaxed mb-3">
              CL Sports Club is a youth basketball development club based in Rahway, NJ. Through travel basketball, skill clinics, group training, and individual development, we help athletes build confidence, discipline, leadership, and a stronger understanding of the game.
            </p>
            <BtnGlass onClick={() => go("about")}>
              Learn More <ChevronRight size={14}/>
            </BtnGlass>
          </Reveal>
          <StaggerGrid className="grid grid-cols-2 gap-3">
            {[
              { value: "4",   label: "Core Programs" },
              { value: "All", label: "Skill Levels Welcome" },
              { value: "Travel", label: "Travel Basketball" },
              { value: "Rec", label: "Clinics at Rahway Rec" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="glass rounded-xl p-7 text-center">
                <div className="font-display font-bold text-4xl text-white mb-1">{s.value}</div>
                <div className="font-body text-xs text-white/38 tracking-wide">{s.label}</div>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      <section id="programs" className="section-glow">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
          <Reveal className="text-center mb-14">
            <SectionLabel text="Programs"/>
            <Heading className="mb-4">Ways to Train, Compete, and Grow.</Heading>
            <p className="font-body text-white/48 text-lg max-w-2xl mx-auto">
              Built around development, structure, and opportunity for athletes at every stage.
            </p>
          </Reveal>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-5" staggerDelay={0.1}>
            {[
              { icon: Shield, title: "Travel Basketball", desc: "Competitive team opportunities for athletes ready to represent CL Sports Club through scheduled practices, games, tournaments, and club development." },
              { icon: Star, title: "Clinics", desc: "Skill-focused basketball clinics hosted primarily through Rahway Rec Center, designed to strengthen fundamentals, confidence, conditioning, and game IQ." },
              { icon: Users, title: "Group Training", desc: "High-energy sessions where athletes develop alongside other motivated players through drills, competition, and structured coaching." },
              { icon: User, title: "Individual Training", desc: "Personalized one-on-one development focused on each athlete’s needs, including shooting, ball handling, footwork, confidence, and decision-making." },
            ].map((program) => (
              <motion.div key={program.title} variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="glass-deep rounded-2xl p-7 lg:p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-600/25 flex items-center justify-center mb-5">
                  <program.icon size={20} className="text-red-500"/>
                </div>
                <div className="font-display font-bold text-xl text-white uppercase tracking-tight mb-3">{program.title}</div>
                <p className="font-body text-sm text-white/52 leading-relaxed">{program.desc}</p>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      <div className="red-strip">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <Reveal>
            <Heading className="mb-2">Ready to Represent the Standard?</Heading>
            <p className="font-body text-white/45 text-base">Explore programs, view the schedule, or shop official CL Sports Club gear by Lyfer Athletics.</p>
          </Reveal>
          <Reveal delay={0.12} className="shrink-0">
            <div className="flex flex-wrap gap-3">
              <BtnGlass onClick={scrollToPrograms}>Explore Programs</BtnGlass>
              <BtnGlass onClick={() => go("schedule")}>View Schedule</BtnGlass>
              <BtnRed onClick={() => go("shop")}>Shop Official Gear <ArrowRight size={15}/></BtnRed>
            </div>
          </Reveal>
        </div>
      </div>

      <Footer/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ABOUT PAGE
// ══════════════════════════════════════════════════════════════════════════════
function AboutPage() {
  const { go } = useNav();
  return (
    <div>
      <div className="relative min-h-[52vh] flex items-end overflow-hidden bg-black">
        <img src="https://images.unsplash.com/photo-1546519638405-a29d3b0f9cf8?w=1400&h=650&fit=crop&auto=format"
          alt="CL Sports Club" className="absolute inset-0 w-full h-full object-cover opacity-30"/>
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #080808 0%, rgba(8,8,8,0.35) 55%, transparent 100%)" }}/>
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pb-14 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <SectionLabel text="About CL Sports Club"/>
            <Heading>Built for the <span className="text-gradient-fire">Community.</span></Heading>
          </motion.div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <Reveal>
            <SectionLabel text="Our Mission"/>
            <Heading className="mb-6">Why We <span className="text-gradient-fire">Exist.</span></Heading>
            <p className="font-body text-white/55 leading-relaxed mb-4">
              CL Sports Club&apos;s mission is to provide high-quality basketball instruction that develops fundamental skills, basketball IQ, athletic performance, confidence, leadership, and character.
            </p>
            <p className="font-body text-white/55 leading-relaxed mb-4">
              Every athlete is met at their current level and coached toward the next — beginners and competitive players alike receive the same commitment and attention.
            </p>
            <p className="font-body text-white/55 leading-relaxed">
              We prioritize player development over winning, fundamentals before flash, and a safe, encouraging environment where athletes grow as people first.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="coach-schedule" className="coach-schedule-section">
        <div className="coach-schedule-container">
          <Reveal className="coach-schedule-copy">
            <span className="section-kicker">Coach D + Scheduling</span>

            <h2 className="font-display font-bold uppercase tracking-tight mb-0">Train With <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Purpose</span>. Schedule With <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Intention</span>.</h2>

            <p>
              Coach D leads CL Sports Club with a focus on structured development,
              confidence, discipline, and team-first growth. Families can request
              travel basketball information, clinics, group training, or individual
              development based on the athlete’s goals and availability.
            </p>

            <ul className="coach-schedule-list">
              <li>Travel basketball opportunities</li>
              <li>Skill clinics through Rahway Rec Center</li>
              <li>Group training sessions</li>
              <li>Individual player development</li>
            </ul>

            <motion.a
              href="#schedule-request"
              onClick={(e) => { e.preventDefault(); go("schedule"); }}
              whileHover={{ scale: 1.035, boxShadow: "0 0 32px rgba(220,38,38,0.55)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 font-display font-semibold uppercase tracking-[0.12em] text-sm px-8 py-3.5 rounded-sm bg-red-600 text-white cursor-pointer">
              Request to Schedule
            </motion.a>
          </Reveal>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            className="coach-video-card">
            <video src={coachVideo} autoPlay loop muted playsInline className="coach-video" />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 45%)" }}/>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="font-display font-bold text-base text-white uppercase tracking-tight">Coach Dante</div>
              <div className="font-body text-xs text-red-400 mt-0.5">Head Coach — 10+ Years Youth Development</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-glow">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
          <Reveal className="text-center mb-14">
            <SectionLabel text="Our Goals"/>
            <Heading>What We <span className="text-gradient-fire">Stand For.</span></Heading>
          </Reveal>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            {GOALS.slice(0, 3).map((g) => (
              <motion.div key={g.label} variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.22 } }}
                className="glass-deep rounded-2xl p-7 cursor-default group flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-600/25 flex items-center justify-center mb-5 group-hover:bg-red-600/25 transition-colors">
                  <g.icon size={20} className="text-red-500"/>
                </div>
                <div className="font-display font-bold text-base text-white uppercase tracking-tight mb-2">{g.label}</div>
                <p className="font-body text-sm text-white/50 leading-relaxed">{g.desc}</p>
              </motion.div>
            ))}
          </StaggerGrid>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {GOALS.slice(3).map((g) => (
              <motion.div key={g.label} variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.22 } }}
                className="glass-deep rounded-2xl p-7 cursor-default group flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-600/25 flex items-center justify-center mb-5 group-hover:bg-red-600/25 transition-colors">
                  <g.icon size={20} className="text-red-500"/>
                </div>
                <div className="font-display font-bold text-base text-white uppercase tracking-tight mb-2">{g.label}</div>
                <p className="font-body text-sm text-white/50 leading-relaxed">{g.desc}</p>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { title: "Commitment to Families",  body: "Clear communication, organized sessions, and a welcoming environment. We keep families informed and involved every step of the way." },
            { title: "Commitment to Athletes",  body: "Age-appropriate instruction, positive reinforcement, and structured sessions. Every athlete is met at their level and coached toward the next." },
            { title: "Commitment to Growth",    body: "Player development over winning — always. We measure success by the athlete's improvement in skill, confidence, and character." },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 0.1}>
              <motion.div whileHover={{ y: -4, transition: { duration: 0.22 } }}
                className="glass-deep rounded-xl p-7 h-full">
                <div className="w-8 h-8 rounded-full bg-red-600/18 border border-red-600/28 flex items-center justify-center mb-5">
                  <CheckCircle size={14} className="text-red-500"/>
                </div>
                <h3 className="font-display font-bold text-base text-white uppercase tracking-tight mb-3">{item.title}</h3>
                <p className="font-body text-sm text-white/50 leading-relaxed">{item.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="red-strip">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 text-center">
          <Reveal>
            <Heading className="mb-4">Ready to <span className="text-gradient-fire">Get Started?</span></Heading>
            <p className="font-body text-white/45 text-lg mb-8 max-w-xl mx-auto">
              Programs for all ages and skill levels. Tell us about your athlete and we&apos;ll find the right fit.
            </p>
            <BtnRed onClick={() => go("training")}>Book Training <ArrowRight size={15}/></BtnRed>
          </Reveal>
        </div>
      </div>
      <Footer/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SCHEDULE PAGE
// ══════════════════════════════════════════════════════════════════════════════
const scheduleRequestOptions = [
  {
    title: "Travel Basketball",
    description:
      "Request information about upcoming travel team opportunities, practices, games, and tournament schedules.",
  },
  {
    title: "Clinics",
    description:
      "Ask about upcoming skill clinics hosted primarily through Rahway Rec Center.",
  },
  {
    title: "Group Training",
    description:
      "Request group training availability for athletes looking to develop in a structured, competitive setting.",
  },
  {
    title: "Individual Training",
    description:
      "Request one-on-one training focused on personalized player development, confidence, and skill growth.",
  },
];

function SchedulePage() {
  const { go } = useNav();
  return (
    <div>
      <div className="relative pt-28 pb-16 hero-bg overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <SectionLabel text="Scheduling"/>
            <Heading className="mb-4">Request to <span className="text-gradient-fire">Schedule.</span></Heading>
            <p className="font-body text-white/50 text-lg max-w-xl">
              Interested in travel basketball, clinics, group training, or individual development? Submit a scheduling request and the CL Sports Club team will follow up with available options based on age group, goals, and upcoming availability.
            </p>
          </motion.div>
        </div>
      </div>
      <div className="divider-red"/>

      <section id="schedule-request" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
          <Reveal className="space-y-4">
            <div className="schedule-request-options">
              {scheduleRequestOptions.map((option) => (
                <motion.div key={option.title} whileHover={{ y: -3, transition: { duration: 0.18 } }} className="schedule-request-card glass-deep">
                  <h3 className="font-display font-bold text-base text-white uppercase tracking-tight mb-2">{option.title}</h3>
                  <p className="font-body text-sm text-white/50 leading-relaxed">{option.description}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className="glass-deep rounded-2xl p-8 lg:p-9">
              <div className="font-display text-[10px] tracking-[0.24em] text-red-500 uppercase mb-2">Scheduling</div>
              <h3 className="font-display font-bold text-2xl text-white uppercase tracking-tight mb-3">Request to Schedule</h3>
              <p className="font-body text-sm text-white/50 leading-relaxed mb-6 max-w-2xl">
                Interested in travel basketball, clinics, group training, or individual development? Submit a scheduling request and the CL Sports Club team will follow up with available options based on age group, goals, and upcoming availability.
              </p>

              <form name="schedule-request" method="POST" data-netlify="true" className="schedule-request-form">
                <input type="hidden" name="form-name" value="schedule-request" />
                <div className="schedule-request-grid grid grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label className="form-label">Athlete Name</label>
                    <input name="athlete-name" type="text" className="form-input" placeholder="Athlete name" required />
                  </div>
                  <div>
                    <label className="form-label">Parent/Guardian Name</label>
                    <input name="guardian-name" type="text" className="form-input" placeholder="Parent or guardian" required />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input name="email" type="email" className="form-input" placeholder="email@example.com" required />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input name="phone" type="tel" className="form-input" placeholder="(908) 555-0142" required />
                  </div>
                  <div>
                    <label className="form-label">Athlete Age/Grade</label>
                    <input name="age-grade" type="text" className="form-input" placeholder="12th grade / 14U" required />
                  </div>
                  <div>
                    <label className="form-label">What are you interested in?</label>
                    <select name="interest" className="form-input" defaultValue="" required>
                      <option value="" disabled>Select one</option>
                      <option value="Travel Basketball">Travel Basketball</option>
                      <option value="Clinics">Clinics</option>
                      <option value="Group Training">Group Training</option>
                      <option value="Individual Training">Individual Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Preferred Days/Times</label>
                    <input name="preferred-days-times" type="text" className="form-input" placeholder="Weeknights, Saturdays, etc." />
                  </div>
                  <div>
                    <label className="form-label">Message / Goals</label>
                    <textarea name="message" className="form-input min-h-[116px] resize-none" placeholder="Tell us about your athlete and goals." required />
                  </div>
                </div>

                <motion.button type="submit" whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(220,38,38,0.45)" }} whileTap={{ scale: 0.97 }} className="w-full flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-[0.14em] text-sm px-8 py-4 rounded-sm bg-red-600 text-white cursor-pointer mt-2">
                  Submit Schedule Request <ArrowRight size={15}/>
                </motion.button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  GALLERY PAGE
// ══════════════════════════════════════════════════════════════════════════════
function GalleryPage() {
  return (
    <main className="gallery-page">
      <section className="gallery-hero max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl">
          <SectionLabel text="Club Gallery"/>
          <h1 className="font-display font-bold uppercase leading-none tracking-tight text-white" style={{ fontSize: "clamp(3rem, 7vw, 5.8rem)" }}>
            The <span className="text-gradient-fire">Grind.</span>
          </h1>
          <p className="font-body text-white/50 text-lg max-w-xl mt-5">
            Athletes in action. Every rep, every session, every breakthrough.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <InstagramGallery/>
      </div>

      <section className="gallery-cta max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl">
          <Heading className="mb-4">Be Part of the <span className="text-gradient-fire">Story.</span></Heading>
          <p className="font-body text-white/45 text-lg mb-8 max-w-xl">
            Join the club and let your game speak for itself.
          </p>
          <BtnRed onClick={() => window.location.href = "/contact"}>
            Join Now
          </BtnRed>
        </div>
      </section>
    </main>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  BOOK TRAINING PAGE
// ══════════════════════════════════════════════════════════════════════════════
const EXPERIENCE_OPTIONS = [
  { value: "",             label: "Select experience level" },
  { value: "beginner",     label: "Beginner — just starting out" },
  { value: "recreational", label: "Recreational — plays for fun" },
  { value: "school-team",  label: "School Team — plays organized ball" },
  { value: "travel-basketball", label: "Travel Basketball — competitive development" },
  { value: "elite",        label: "Elite — seeking college exposure" },
];

function TrainingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", experience: "", phone: "" });
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="relative pt-28 pb-16 hero-bg overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <SectionLabel text="Book Training"/>
            <Heading className="mb-4">Training for <span className="text-gradient-fire">Every Athlete.</span></Heading>
            <p className="font-body text-white/50 text-lg max-w-xl">
              We offer appointment-only training and development sessions for athletes ready to grow.<br/>
              Sundays from 3:00 PM to 6:00 PM remain our guaranteed weekly availability.
            </p>
          </motion.div>
        </div>
      </div>
      <div className="divider-red"/>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
        <StaggerGrid className="grid md:grid-cols-2 gap-6" staggerDelay={0.12}>
          {[
            { icon: Users, title: "Group Sessions", sub: "High-Energy. Team-Based. Competitive.",
              body: "Train alongside other motivated athletes in small-group settings (3–8 players). Build chemistry, sharpen skills through peer competition, and develop the habits that separate good players from great ones.",
              features: ["3–8 players per session", "Twice weekly", "All skill levels welcome", "Structured drill system"] },
            { icon: User, title: "Individual Training", sub: "Personalized. Focused. Intentional.",
              body: "1-on-1 sessions built around you. We assess your game, identify your gaps, and build a custom training plan targeting exactly what you need — whether that's making the school team or earning a scholarship.",
              features: ["Custom skill plan", "Film breakdown available", "60-minute sessions", "Progress tracking"] },
          ].map((opt) => (
            <motion.div key={opt.title} variants={fadeUp}
              whileHover={{ y: -5, transition: { duration: 0.22 } }}
              className="glass-deep rounded-2xl p-8 flex flex-col gap-5">
              <div className="w-12 h-12 rounded-xl bg-red-600/18 border border-red-600/28 flex items-center justify-center">
                <opt.icon size={22} className="text-red-500"/>
              </div>
              <div>
                <div className="font-display text-[10px] tracking-[0.22em] text-red-500 uppercase mb-1">{opt.sub}</div>
                <h3 className="font-display font-bold text-2xl text-white uppercase tracking-tight">{opt.title}</h3>
              </div>
              <p className="font-body text-sm text-white/52 leading-relaxed">{opt.body}</p>
              <ul className="space-y-2">
                {opt.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={12} className="text-red-500 shrink-0"/>
                    <span className="font-body text-xs text-white/55">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </StaggerGrid>
      </section>

      <section className="section-glow">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
          <Reveal className="mb-10">
            <SectionLabel text="Athlete Inquiry"/>
            <Heading>Submit Your <span className="text-gradient-fire">Info.</span></Heading>
            <p className="font-body text-white/45 text-base mt-3 max-w-lg">
              All sessions are by appointment only. Once we review your submission, a coach will personally reach out to find the right fit for your athlete.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                    className="glass-deep rounded-2xl p-12 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                      className="w-16 h-16 rounded-full bg-red-600/20 border border-red-600/35 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={28} className="text-red-500"/>
                    </motion.div>
                    <h3 className="font-display font-bold text-3xl text-white uppercase mb-3">Inquiry Received!</h3>
                    <p className="font-body text-white/50 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                      A coach will review your submission and reach out personally within 24 hours.
                    </p>
                    <BtnGlass onClick={() => { setSubmitted(false); setForm({ name: "", age: "", experience: "", phone: "" }); }}>
                      Submit Another
                    </BtnGlass>
                  </motion.div>
                ) : (
                  <motion.div key="form"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="glass-deep rounded-2xl p-8">
                    <h3 className="font-display font-bold text-lg uppercase text-white tracking-tight mb-7">Athlete Submission Form</h3>
                    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="form-label">Athlete Name *</label>
                          <input type="text" required placeholder="Marcus Smith"
                            className="form-input" value={form.name} onChange={set("name")}/>
                        </div>
                        <div>
                          <label className="form-label">Athlete Age *</label>
                          <input type="number" required min="4" max="22" placeholder="12"
                            className="form-input" value={form.age} onChange={set("age")}/>
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Experience Level *</label>
                        <select required className="form-input" value={form.experience} onChange={set("experience")}
                          style={{ appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
                          {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Parent / Guardian Phone *</label>
                        <input type="tel" required placeholder="(908) 555-0100"
                          className="form-input" value={form.phone} onChange={set("phone")}/>
                      </div>
                      <motion.button type="submit"
                        whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(220,38,38,0.45)" }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-[0.14em] text-sm px-8 py-4 rounded-sm bg-red-600 text-white cursor-pointer">
                        Submit Inquiry <ArrowRight size={15}/>
                      </motion.button>
                      <p className="font-body text-xs text-white/28 text-center">
                        No payment required. A coach will contact you within 24 hours.
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <Reveal className="glass-deep rounded-xl p-6">
                <h4 className="font-display font-bold text-sm uppercase text-white tracking-tight mb-5">What Happens Next</h4>
                <div className="space-y-4">
                  {[
                    { step: "01", text: "We review your submission within 24 hours" },
                    { step: "02", text: "A coach personally calls or texts you" },
                    { step: "03", text: "We recommend the right training fit" },
                    { step: "04", text: "Your athlete's journey begins" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <span className="font-display font-bold text-red-500 text-lg leading-none w-7 shrink-0">{s.step}</span>
                      <span className="font-body text-sm text-white/50 leading-relaxed">{s.text}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.08} className="glass-deep rounded-xl p-6">
                <h4 className="font-display font-bold text-sm uppercase text-white tracking-tight mb-4">Questions?</h4>
                <div className="space-y-3">
                  {[{ I: Phone, t: "(908) 555-0142" }, { I: Mail, t: "info@clsportsclub.com" }, { I: MapPin, t: "Rahway, NJ 07065" }].map(({ I, t }) => (
                    <div key={t} className="flex items-center gap-2.5">
                      <I size={12} className="text-red-500 shrink-0"/>
                      <span className="font-body text-xs text-white/50">{t}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.16} className="glass-deep rounded-xl p-6">
                <h4 className="font-display font-bold text-sm uppercase text-white tracking-tight mb-3">Payments</h4>
                <p className="font-body text-xs text-white/50 leading-relaxed mb-4">
                  Start with a secure Square checkout component and connect it to a Vercel function that creates the actual charge server-side.
                </p>
                {import.meta.env.VITE_SQUARE_APPLICATION_ID && import.meta.env.VITE_SQUARE_LOCATION_ID ? (
                  <SquareCheckout
                    applicationId={import.meta.env.VITE_SQUARE_APPLICATION_ID}
                    locationId={import.meta.env.VITE_SQUARE_LOCATION_ID}
                    amount="25.00"
                    currency="USD"
                    description="CL Sports Club session deposit"
                    createPaymentEndpoint="/api/square/create-payment"
                    buttonLabel="Pay Deposit"
                  />
                ) : (
                  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <p className="font-body text-xs text-white/55 leading-relaxed">
                      Set VITE_SQUARE_APPLICATION_ID and VITE_SQUARE_LOCATION_ID to render the checkout form here.
                    </p>
                  </div>
                )}
              </Reveal>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}

// ─── Product Flip Card ────────────────────────────────────────────────────────
function ProductFlipCard({ product, index, viewMode }: {
  product: Product; index: number; viewMode: "studio" | "court";
}) {
  const { go } = useNav();
  const [flipped, setFlipped] = useState(false);
  const { addItem } = useCart();
  const [category, setCategory] = useState<"Adult" | "Kids">("Adult");
  const [size, setSize] = useState<string>("M");
  const [qty, setQty] = useState<number>(1);
  const imgFront = viewMode === "court" ? product.lifestyleFront : product.front;
  const imgBack  = viewMode === "court" ? product.lifestyleBack  : product.back;
  const fit      = viewMode === "court" ? "object-cover" : "object-contain";
  React.useEffect(() => { setFlipped(false); }, [viewMode]);
  const priceNum = category === "Adult" ? 35 : 25;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col" style={{ perspective: "1000px" }}>
      <div className="relative w-full cursor-pointer" style={{ aspectRatio: "3/4" }}
        onClick={() => setFlipped(f => !f)}>
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}>
          <div className="absolute inset-0 rounded-xl overflow-hidden glass"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <ImageWithFallback src={imgFront} alt={`${product.name} — front`} className={`w-full h-full ${fit}`}/>
            {product.badge && (
              <div className="absolute top-3 left-3 bg-red-600 px-2.5 py-1 rounded-sm z-10">
                <span className="font-display text-[9px] font-bold tracking-widest text-white uppercase">{product.badge}</span>
              </div>
            )}
            <div className="absolute bottom-3 right-3 glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <RotateCcw size={10} className="text-white/55"/>
              <span className="font-display text-[9px] tracking-widest text-white/55 uppercase">Back</span>
            </div>
          </div>
          <div className="absolute inset-0 rounded-xl overflow-hidden glass"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <ImageWithFallback src={imgBack} alt={`${product.name} — back`} className={`w-full h-full ${fit}`}/>
            <div className="absolute bottom-3 right-3 glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <RotateCcw size={10} className="text-white/55"/>
              <span className="font-display text-[9px] tracking-widest text-white/55 uppercase">Front</span>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="pt-4 pb-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display text-[9px] tracking-[0.2em] text-orange-500 uppercase">CL Sports Club</span>
          <span className="w-1 h-1 rounded-full bg-white/20"/>
          <span className="font-display text-[9px] tracking-[0.18em] text-white/40 uppercase">{product.color}</span>
        </div>
        <div className="font-display font-bold text-sm text-white uppercase tracking-tight leading-snug mb-1">
          {product.type === "Tee" ? "Travel Tee" : "Travel Tank"}
        </div>
        <div className="font-body text-[11px] text-orange-400/80 mb-3">${priceNum}.00</div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 items-center">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="form-input bg-black/10 text-white/90 px-3 py-2">
              <option value="Adult">Adult</option>
              <option value="Kids">Kids</option>
            </select>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="form-input bg-black/10 text-white/90 px-3 py-2">
              {["S","M","L","XL"].map(sz => <option key={sz} value={sz}>{sz}</option>)}
            </select>
            <div className="ml-2 flex items-center gap-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-sm bg-white/5 text-white">-</button>
              <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-12 text-center bg-transparent border border-white/6 rounded-sm px-2 py-1 text-white" />
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-sm bg-white/5 text-white">+</button>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => addItem({ productId: product.id?.toString?.() ?? product.name, name: product.name, category, size, price: priceNum, image: imgFront, quantity: qty })}
            className="font-display text-[10px] font-bold tracking-widest uppercase px-4 py-2 bg-red-600 text-white rounded-sm cursor-pointer">
            Add {qty} to Cart
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SHOP PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ShopPage() {
  const { go } = useNav();
  const [activeTab, setActiveTab] = useState<"all" | "tee" | "tank">("all");
  const [viewMode, setViewMode]   = useState<"studio" | "court">("studio");
  const filtered = activeTab === "all" ? PRODUCTS : PRODUCTS.filter(p => p.type.toLowerCase() === activeTab);
  const tabs: { key: "all" | "tee" | "tank"; label: string; count: number }[] = [
    { key: "all",  label: "All Gear", count: PRODUCTS.length },
    { key: "tee",  label: "Tees",     count: PRODUCTS.filter(p => p.type === "Tee").length },
    { key: "tank", label: "Tanks",    count: PRODUCTS.filter(p => p.type === "Tank").length },
  ];

  return (
    <div>
      <div className="relative pt-28 pb-16 hero-bg overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <SectionLabel text="Apparel & Gear"/>
            <Heading className="mb-4">Wear the <span className="text-gradient-fire">Brand.</span></Heading>
            <p className="font-body text-white/48 text-lg max-w-md">
              Official CL Sports Club apparel. Tap any item to see front and back.
            </p>
          </motion.div>
        </div>
      </div>
      <div className="divider-red"/>

      <div className="bg-[#080808] sticky top-[64px] z-30 border-b border-white/[0.055]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <motion.button key={t.key} onClick={() => setActiveTab(t.key)} whileTap={{ scale: 0.97 }}
                className={`relative font-display text-[12px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-sm cursor-pointer transition-colors ${activeTab === t.key ? "text-white" : "text-white/45 hover:text-white/70"}`}>
                {activeTab === t.key && (
                  <motion.div layoutId="shop-tab" className="absolute inset-0 bg-red-600 rounded-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}/>
                )}
                <span className="relative z-10">{t.label}</span>
                <span className={`relative z-10 ml-2 font-body text-[10px] ${activeTab === t.key ? "text-white/70" : "text-white/28"}`}>({t.count})</span>
              </motion.button>
            ))}
          </div>
          <div className="flex items-center glass rounded-sm overflow-hidden shrink-0">
            {(["studio", "court"] as const).map((mode) => (
              <motion.button key={mode} onClick={() => setViewMode(mode)} whileTap={{ scale: 0.97 }}
                className={`relative font-display text-[11px] tracking-[0.12em] uppercase px-4 py-2 cursor-pointer transition-colors ${viewMode === mode ? "text-white" : "text-white/38 hover:text-white/60"}`}>
                {viewMode === mode && (
                  <motion.div layoutId="view-toggle" className="absolute inset-0 bg-white/10"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}/>
                )}
                <span className="relative z-10">{mode === "studio" ? "Studio" : "On Court"}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {filtered.map((p, i) => (
              <ProductFlipCard key={p.id} product={p} index={i} viewMode={viewMode}/>
            ))}
          </motion.div>
        </AnimatePresence>
        <Reveal className="mt-12 text-center">
          <div className="glass-deep rounded-2xl border border-red-600/20 p-6 inline-block max-w-2xl">
            <p className="font-display text-[10px] tracking-[0.24em] text-red-500 uppercase mb-2">Club Apparel</p>
            <p className="font-body text-sm text-white/70 mb-2">Grab your CL Sports Club shirt before your first session.</p>
            <p className="font-body text-sm text-white/48">Kids shirts are $25 and adult shirts are $35 — represent the club on and off the court.</p>
          </div>
          <p className="font-body text-sm text-white/38 mt-6 mb-4">Tap a product to flip it and see the back design.</p>
          <p className="font-body text-xs text-white/22">
            To order, use the Inquire button or reach out via the{" "}
            <button onClick={() => go("training")} className="text-orange-500/70 hover:text-orange-400 transition-colors underline underline-offset-2">
              contact form
            </button>.
          </p>
        </Reveal>
      </section>

      <div className="border-y border-white/[0.055] bg-[#060606]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-body text-[10px] text-white/25 uppercase tracking-widest">Apparel Powered By</span>
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide mt-0.5">
              Lyfer <span className="text-gradient-fire">Athletics</span>
            </h3>
          </div>
          <p className="font-body text-xs text-white/32 max-w-xs text-center sm:text-right">
            All CL Sports Club apparel is designed and fulfilled through our exclusive partnership with Lyfer Athletics.
          </p>
        </div>
      </div>
      <Footer/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT APP  —  self-contained embed, no external router needed
// ══════════════════════════════════════════════════════════════════════════════
const VALID_PAGES: Page[] = ["home", "about", "training", "shop", "gallery", "schedule"];

function getInitialPage(): Page {
  try {
    const hash = window.location.hash.replace("#", "").toLowerCase() as Page;
    return VALID_PAGES.includes(hash) ? hash : "home";
  } catch {
    return "home";
  }
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [introDone, setIntroDone] = useState(() => {
    try { return sessionStorage.getItem("cl-intro-done") === "1"; } catch { return false; }
  });

  const go = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
    try { window.location.hash = p === "home" ? "" : p; } catch { /* noop */ }
  }, []);

  const handleIntroDone = useCallback(() => {
    try { sessionStorage.setItem("cl-intro-done", "1"); } catch { /* noop */ }
    setIntroDone(true);
  }, []);

  const content = {
    home:     <HomePage/>,
    about:    <AboutPage/>,
    training: <TrainingPage/>,
    shop:     <ShopPage/>,
    gallery:  <GalleryPage/>,
    schedule: <SchedulePage/>,
  }[page];

  return (
    <NavCtx.Provider value={{ page, go }}>
      <CartProvider>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }}/>
      {!introDone && <CinematicIntro onDone={handleIntroDone}/>}
      <motion.div
        className="min-h-screen bg-background text-foreground"
        style={{ fontFamily: "'Inter', sans-serif" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}>
        <Navbar/>
        <AnimatePresence mode="wait">
          <motion.main key={page} {...pageTransition}>
            {content}
          </motion.main>
        </AnimatePresence>
      </motion.div>
      </CartProvider>
    </NavCtx.Provider>
  );
}
