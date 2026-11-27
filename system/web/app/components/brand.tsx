import Image from "next/image";
import type { ReactNode } from "react";

const glyphs = {
  arrow: <path d="M5 19 19 5M7 5h12v12"/>,
  right: <path d="M4 12h16m-7-7 7 7-7 7"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"/>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  lock: <><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  shield: <path d="m12 22 1.5-.6C19.4 19 21 15.9 21 11V5l-9-3-9 3v6c0 4.9 1.6 8 7.5 10.4zM8 12l3 3 5-6"/>,
  scan: <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3m13 5h3a2 2 0 0 0 2-2v-3M3 12h18"/>,
  browser: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-12 0v11"/></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></>,
} satisfies Record<string, ReactNode>;

export function Icon({ name }: { name: keyof typeof glyphs }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{glyphs[name]}</svg>;
}

export function Brand() {
  return <Image className="brand-image" src="/brand/lockup.webp" width={420} height={210} alt="AutenticAI" unoptimized />;
}

export function Investigation() {
  return (
    <figure className="investigation">
      <div className="investigation-canvas">
        <div className="investigation-orbits" aria-hidden="true"><i/><i/><i/><b/><b/></div>
        <svg className="investigation-path" viewBox="0 0 600 520" preserveAspectRatio="none" aria-hidden="true">
          <path d="M170 140H245Q270 140 270 165V255Q270 275 290 275H340Q365 275 365 300V376H430"/>
          <circle cx="170" cy="140" r="4"/><circle cx="430" cy="376" r="4"/>
        </svg>
        <div className="investigation-core" aria-hidden="true"><Image src="/brand/symbol.webp" width={320} height={320} alt="" unoptimized /></div>
        <div className="claim-note">
          <blockquote>“A Lua emite luz própria.”</blockquote>
        </div>
        <div className="finding-note">
          <p className="finding-verdict"><span aria-hidden="true">×</span> Contradita</p>
          <a className="finding-foot" href="#exemplo">Ver exemplo <Icon name="right" /></a>
        </div>
      </div>
    </figure>
  );
}
