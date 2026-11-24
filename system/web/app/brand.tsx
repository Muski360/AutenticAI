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
      <div className="figure-line"><span>Da dúvida à evidência</span><span>Fig. 01 <Icon name="arrow" /></span></div>
      <div className="investigation-canvas">
        <div className="investigation-orbits" aria-hidden="true"><i/><i/><i/><b/><b/></div>
        <svg className="investigation-path" viewBox="0 0 600 520" preserveAspectRatio="none" aria-hidden="true">
          <path d="M170 140H245Q270 140 270 165V255Q270 275 290 275H340Q365 275 365 300V376H430"/>
        </svg>
        <div className="investigation-core" aria-hidden="true"><Image src="/brand/symbol.webp" width={320} height={320} alt="" unoptimized /></div>
        <div className="claim-note">
          <span className="note-label"><b>01</b> A afirmação</span>
          <blockquote>“A Lua emite luz própria.”</blockquote>
          <span className="note-detail"><Icon name="file" /> Algo para questionar</span>
        </div>
        <div className="context-note"><Icon name="plus" /><div><span className="note-label">02 / O contexto</span><p>Luz solar refletida</p></div></div>
        <div className="finding-note">
          <span className="note-label"><b>03</b> A evidência</span>
          <p className="finding-verdict"><span aria-hidden="true">×</span> Contradita</p>
          <p>A Lua reflete a luz do Sol.<br />Ela não produz luz própria.</p>
          <span className="finding-foot">Afirmação verificada <Icon name="right" /></span>
        </div>
        <span className="figure-coordinate" aria-hidden="true">+ CONTEXTO, NÃO ACHISMO.</span>
      </div>
      <figcaption className="figure-line figure-end"><span><i/> Exemplo ilustrativo</span><span>Sem consulta real a fontes.</span></figcaption>
    </figure>
  );
}
