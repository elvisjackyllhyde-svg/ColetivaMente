import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ColetivaMente | Engajamento Corporativo",
  description: "GiroQuiz, Voto em Valor e Sorteio em uma única plataforma de treinamento, decisão e celebração para equipes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
