import "./globals.css";
import { Darker_Grotesque, Imbue } from "next/font/google";
import MagicCursor from "@/components/ui/MagicCursor";

const imbue = Imbue({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
});

const darkerGrotesque = Darker_Grotesque({
  subsets: ["latin"],
  variable: "--font-secondary",
  display: "swap",
});

export const metadata = {
  title: "Caraval: La Isla de los Sueños",
  description: "Experiencia transmedia inspirada en Caraval: La Isla de los Sueños.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${imbue.variable} ${darkerGrotesque.variable}`}>
      <body>
        {children}
        <MagicCursor />
      </body>
    </html>
  );
}
