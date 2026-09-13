import type { Metadata } from 'next';
import { ModuleAVenir } from '@/components/module-a-venir';

export const metadata: Metadata = { title: "Qualité" };

export default function Page() {
  return (
    <ModuleAVenir
      eyebrow={"Pilotage"}
      title={"Qualité"}
      phase="V2"
      summary={"Les indicateurs qualité déjà contractualisés dans vos procédures PR01, PR02 et PR03, suivis automatiquement au lieu d’être recalculés à la main chaque trimestre."}
      capabilities={[
        "Taux de respect des délais de remise de rapport, par département et par trimestre.",
        "Délai moyen de remise, avec l’objectif de moins de 21 jours ouvrés fixé par le QMS.",
        "Taux de respect du planning d’étalonnage des équipements de mesure, indicateur annuel.",
        "Taux de respect des interventions planifiées, indicateur mensuel du pôle EILM.",
        "Réclamations client sur les rapports, avec l’objectif de moins de deux par trimestre.",
        "Export pour la revue de direction.",
      ]}
      dependsOn={[
        { label: "Rapports", href: "/operations/rapports" },
        { label: "Parc de mesure", href: "/operations/parc-mesure" },
      ]}
    />
  );
}
