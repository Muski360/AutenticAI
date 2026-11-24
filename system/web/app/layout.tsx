import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutenticAI",
  description: "Projeto acadêmico do SENAI para investigar informações.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
