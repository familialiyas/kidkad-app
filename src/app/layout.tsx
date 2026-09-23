import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

// Display font — playful, rounded, for game UI: dialogue text, buttons,
// titles, the HUD counter.
const baloo2 = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "700"],
});

// Body font — for practical/input moments: form fields, fine print, the
// dashboard table.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "KoolKad",
  description: "Your invite, leveled up.",
  openGraph: {
    title: "KoolKad",
    description: "Your invite, leveled up.",
  },
  twitter: {
    card: "summary",
    title: "KoolKad",
    description: "Your invite, leveled up.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${baloo2.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
