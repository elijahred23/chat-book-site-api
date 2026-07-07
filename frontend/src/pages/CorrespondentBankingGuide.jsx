import { Link } from "react-router-dom";
import Card from "../ui/Card";
import { Page } from "../ui/Page";
import { bankingModules } from "../correspondent_banking/modules";
import { bankingDiagrams } from "../correspondent_banking/diagrams";
import CorrespondentBankingNav from "./CorrespondentBankingNav";

const highlights = [
  ["10", "learning modules"],
  [String(bankingDiagrams.length), "PlantUML diagrams"],
  ["0", "saved state"],
];

export default function CorrespondentBankingGuide() {
  return (
    <Page className="banking-guide-page">
      <section className="banking-learning-shell">
        <CorrespondentBankingNav />
        <main className="banking-learning-main">
          <section className="banking-hero">
            <div>
              <span className="banking-kicker">Correspondent banking field guide</span>
              <h1>Learn the rails, messages, controls, and evidence trail.</h1>
              <p>
                A routed learning guide for correspondent banking operations: Fedwire, ACH, ISO 20022,
                SWIFT CBPR+, check image exchange, exceptions, controls, and reconciliation.
              </p>
            </div>
            <div className="banking-hero__summary" aria-label="Guide highlights">
              {highlights.map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="banking-index-grid" aria-label="Correspondent banking modules">
            {bankingModules.map((module) => (
              <Card className="banking-index-card" key={module.id}>
                <span>{module.eyebrow}</span>
                <h2>{module.title}</h2>
                <p>{module.summary}</p>
                <Link to={module.path}>Open module</Link>
              </Card>
            ))}
          </section>
        </main>
      </section>
    </Page>
  );
}
