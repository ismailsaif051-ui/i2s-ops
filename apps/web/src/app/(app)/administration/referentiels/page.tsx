import type { Metadata } from "next";
import { api, apiIfAllowed } from "@/lib/api";
import { moneyDh } from "@/lib/format";
import {
  Card,
  DataTable,
  PageHeader,
  StatusBadge,
  Td,
  Th,
} from "@/components/ui";

export const metadata: Metadata = { title: "Référentiels" };

interface Department {
  id: string;
  code: string;
  name: string;
  manager: { firstName: string; lastName: string } | null;
  _count: { employees: number };
}

interface ExpenseCategory {
  id: string;
  code: string;
  label: string;
  capType: string;
  capAmount: string | null;
  requiresReceipt: boolean;
  requiresPriorApproval: boolean;
}

interface Method {
  id: string;
  code: string;
  name: string;
  standards: string[];
  department: { code: string } | null;
}

const CAP_LABELS: Record<string, string> = {
  NONE: "Frais réels",
  DAILY: "par jour",
  MONTHLY: "par mois",
  PER_NIGHT: "par nuitée",
};

export default async function ReferentialsPage() {
  // La page relève du droit « paramètres » ; chaque liste de référence relève
  // du droit de son domaine. Un rôle qui n'a pas ce droit ne voit pas la
  // section, au lieu de ne pas voir la page (constaté pour les RH, le contrôle
  // de gestion et le RAF, privés des méthodes d'inspection).
  const [departments, categories, methods, settings] = await Promise.all([
    apiIfAllowed<Department[]>("/departments"),
    apiIfAllowed<ExpenseCategory[]>("/expense-categories"),
    apiIfAllowed<Method[]>("/inspection-methods"),
    api<Record<string, unknown>>("/settings"),
  ]);

  const rules: Array<{
    key: string;
    label: string;
    format?: (v: unknown) => string;
  }> = [
    {
      key: "expense.submissionDeadlineDay",
      label: "Saisie des frais au plus tard le",
      format: (v) => `${v} du mois suivant`,
    },
    {
      key: "expense.managerDeadlineWorkingDays",
      label: "Validation N+1 sous",
      format: (v) => `${v} jours ouvrés`,
    },
    {
      key: "expense.hrDeadlineWorkingDays",
      label: "Contrôle RH / contrôle de gestion sous",
      format: (v) => `${v} jours ouvrés`,
    },
    {
      key: "expense.paymentDay",
      label: "Virement des frais le",
      format: (v) => `${v} du mois`,
    },
    {
      key: "expense.travelAllowanceMinKm",
      label: "Indemnité de déplacement au-delà de",
      format: (v) => `${v} km du siège`,
    },
    {
      key: "report.dueWorkingDays",
      label: "Délai de remise de rapport",
      format: (v) => `${v} jours ouvrés`,
    },
    {
      key: "report.qualityTargetComplaintsPerQuarter",
      label: "Réclamations client tolérées",
      format: (v) => `moins de ${v} par trimestre`,
    },
    {
      key: "affair.marginAlertThresholdPoints",
      label: "Alerte de marge à partir de",
      format: (v) => `${v} points d’écart`,
    },
    {
      key: "certification.alertDaysBefore",
      label: "Alerte certification",
      format: (v) => `${v} jours avant expiration`,
    },
    {
      key: "calibration.alertDaysBefore",
      label: "Alerte étalonnage",
      format: (v) => `${v} jours avant échéance`,
    },
    {
      key: "timesheet.unassignedAlertConsecutiveDays",
      label: "Alerte inspecteur non affecté après",
      format: (v) => `${v} jours consécutifs`,
    },
  ];

  const rejectReasons =
    (settings["expense.rejectReasons"] as string[] | undefined) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Référentiels"
        description="Les règles de gestion sont des paramètres, pas du code. Modifier un plafond ou un délai ne demande aucun développement."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {departments && (
          <Card title={`Départements — ${departments.length}`}>
            <DataTable>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Libellé</Th>
                  <Th>Responsable</Th>
                  <Th align="right">Effectif</Th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <Td mono>{d.code}</Td>
                    <Td>{d.name}</Td>
                    <Td>
                      {d.manager
                        ? `${d.manager.lastName.toUpperCase()} ${d.manager.firstName}`
                        : "—"}
                    </Td>
                    <Td align="right" mono>
                      {d._count.employees}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
        )}

        <Card title="Règles de gestion">
          <DataTable>
            <thead>
              <tr>
                <Th>Règle</Th>
                <Th align="right">Valeur</Th>
              </tr>
            </thead>
            <tbody>
              {rules
                .filter((rule) => settings[rule.key] !== undefined)
                .map((rule) => (
                  <tr key={rule.key}>
                    <Td>{rule.label}</Td>
                    <Td align="right">
                      {rule.format
                        ? rule.format(settings[rule.key])
                        : String(settings[rule.key])}
                    </Td>
                  </tr>
                ))}
            </tbody>
          </DataTable>
        </Card>
      </div>

      {categories && (
        <div className="mt-5">
          <Card
            title={`Catégories de frais et plafonds — ${categories.length}`}
          >
            <DataTable>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Libellé</Th>
                  <Th align="right">Plafond</Th>
                  <Th>Justificatif</Th>
                  <Th>Accord préalable</Th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <Td mono>{category.code}</Td>
                    <Td>{category.label}</Td>
                    <Td align="right" mono>
                      {category.capAmount
                        ? `${moneyDh(category.capAmount)} ${CAP_LABELS[category.capType] ?? ""}`
                        : CAP_LABELS.NONE}
                    </Td>
                    <Td>
                      {category.requiresReceipt ? (
                        <StatusBadge tone="warning">Obligatoire</StatusBadge>
                      ) : (
                        <span className="text-subtle">Non requis</span>
                      )}
                    </Td>
                    <Td>
                      {category.requiresPriorApproval ? (
                        <StatusBadge tone="danger">Requis</StatusBadge>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {methods && (
          <Card title={`Méthodes d’inspection — ${methods.length}`}>
            <DataTable>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Méthode</Th>
                  <Th>Dép.</Th>
                  <Th>Référentiels</Th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id}>
                    <Td mono>{method.code}</Td>
                    <Td>{method.name}</Td>
                    <Td>{method.department?.code ?? "—"}</Td>
                    <Td>
                      {method.standards.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {method.standards.map((s) => (
                            <span
                              key={s}
                              className="rounded-[4px] bg-surface-2 px-1.5 py-0.5 text-[12.5px]"
                            >
                              {s}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
        )}

        <Card title="Motifs de rejet d’une note de frais">
          <ul className="divide-y divide-border">
            {rejectReasons.map((reason) => (
              <li key={reason} className="px-5 py-2.5 text-[14.5px]">
                {reason}
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-5 py-3 text-[13px] text-subtle">
            Liste fermée : un rejet doit toujours porter un motif issu de la
            procédure.
          </p>
        </Card>
      </div>
    </>
  );
}
