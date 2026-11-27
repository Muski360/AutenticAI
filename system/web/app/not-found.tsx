import Link from "next/link";
import { Brand, Icon } from "./components/brand";

export default function NotFound() {
  return (
    <>
      <header className="frame header-inner">
        <Link href="/"><Brand /></Link>
      </header>
      <main className="missing-page">
        <div className="frame landing-section">
          <h1>Página não <span>encontrada</span></h1>
          <Link className="button text-link" href="/">Voltar ao início <Icon name="right" /></Link>
        </div>
      </main>
    </>
  );
}
