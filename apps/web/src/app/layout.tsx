import type { Metadata, Viewport } from 'next';
import './globals.css';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';

export const metadata: Metadata = {
  title: {
    default: 'I2S-System',
    template: '%s · I2S-System',
  },
  description:
    "ERP de gestion opérationnelle, inspection et contrôle de gestion — I2S TESTING.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#131514' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning : le script ci-dessous pose data-theme avant
    // React, l'écart d'attribut est voulu.
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* Police Archivo servie par l'application (public/fonts) : pas de
            dépendance à Google, et la graisse 600 est disponible dès le
            premier affichage. */}
        <link rel="preload" href="/fonts/Archivo-400.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Archivo-600.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
