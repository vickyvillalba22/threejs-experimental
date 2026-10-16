import "./globals.css";
import { Imbue } from "next/font/google";

const imbue = Imbue({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
});

export const metadata = {
  title: "Caraval: La Isla de los Sueños",
  description: "Experiencia transmedia inspirada en Caraval: La Isla de los Sueños.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={imbue.variable}>
      <body>{children}</body>
    </html>
  );
}
