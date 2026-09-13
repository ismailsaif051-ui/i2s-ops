import type { Metadata } from 'next';
import { ModuleAVenir } from '@/components/module-a-venir';

export const metadata: Metadata = { title: "Projets & sites" };

export default function Page() {
  return (
    <ModuleAVenir
      eyebrow={"Affaires"}
      title={"Projets & sites"}
      phase="V2"
      summary={"Vue transverse des projets et des sites d’intervention, indépendamment de l’affaire qui les porte."}
      capabilities={[
        "Fiche site : géolocalisation, région, contraintes d’accès et exigences HSE.",
        "Distance au siège, qui déclenche automatiquement l’indemnité de déplacement au-delà de 150 km.",
        "Historique des interventions par site, toutes affaires confondues.",
        "Équipements inspectés rattachés au site.",
      ]}
      dependsOn={[
        { label: "Affaires", href: "/affaires" },
      ]}
    />
  );
}
