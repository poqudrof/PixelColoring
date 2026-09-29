import "./globals.css";
export const metadata = {
  title: "Pixel & Papier — Atelier de coloriage",
  description:
    "Transformez vos pixel arts en coloriages à imprimer au format A4.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
