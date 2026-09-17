import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Sépare les artefacts de production de ceux du serveur de développement :
  // les deux partageaient .next, et une build lancée pendant un « npm run dev »
  // corrompait le serveur en cours.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  transpilePackages: ['@i2s/contracts'],
  poweredByHeader: false,
  // forbidden() : une lecture refusée par l'API rend un écran « Accès refusé »
  // avec un vrai statut 403, au lieu d'une erreur serveur.
  experimental: { authInterrupts: true },
};

export default config;
