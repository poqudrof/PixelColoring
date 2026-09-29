import "./globals.css";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "../lib/site.js";
export const metadata = {
  // Next.js already prefixes generated asset paths with basePath.
  metadataBase: new URL("/", SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Jeremy Laviole" }],
  category: "art",
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { googleBot: { "max-image-preview": "large" } },
};
export const viewport = { themeColor: "#fffefb" };
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  image: `${SITE_URL}/opengraph-image.png`,
  applicationCategory: "DesignApplication",
  operatingSystem: "Navigateur web",
  browserRequirements: "JavaScript",
  inLanguage: ["fr", "en"],
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  author: { "@type": "Person", name: "Jeremy Laviole" },
  featureList: [
    "Import PNG, JPEG, WebP ou GIF sans envoi à un serveur",
    "Reconstruction des pixel arts agrandis ou quadrillés",
    "Palette de 12 couleurs numérotées",
    "Export PDF vectoriel au format A4",
    "Mode projection",
  ],
};
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
