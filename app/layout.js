import "./globals.css";
export const metadata = {
  title: "Pixel & Papier — Pixel art coloring studio",
  description: "Transform pixel art into printable A4 coloring pages.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
