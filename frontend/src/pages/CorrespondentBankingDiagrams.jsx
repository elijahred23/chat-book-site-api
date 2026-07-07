import { useMemo, useState } from "react";
import Card from "../ui/Card";
import { Page } from "../ui/Page";
import PlantUMLDiagram from "../components/plantuml/PlantUMLDiagram";
import { bankingDiagrams } from "../correspondent_banking/diagrams";
import CorrespondentBankingNav from "./CorrespondentBankingNav";

export default function CorrespondentBankingDiagrams() {
  const [activeType, setActiveType] = useState("All");
  const types = useMemo(() => ["All", ...new Set(bankingDiagrams.map((diagram) => diagram.type))], []);
  const visibleDiagrams = activeType === "All"
    ? bankingDiagrams
    : bankingDiagrams.filter((diagram) => diagram.type === activeType);

  return (
    <Page className="banking-guide-page">
      <section className="banking-learning-shell">
        <CorrespondentBankingNav />
        <main className="banking-learning-main">
          <header className="banking-module-header">
            <span>Visual learning lab</span>
            <h1>PlantUML diagrams for correspondent banking flows</h1>
            <p>
              These diagrams render through the Express API so the browser does not call the PlantUML
              service directly. Use them to see relationships, sequences, states, ACH files, check image
              processing, controls, exceptions, and reconciliation.
            </p>
          </header>

          <Card className="banking-filter-card">
            <span>Filter diagrams</span>
            <div className="banking-filter-row" role="tablist" aria-label="Diagram types">
              {types.map((type) => (
                <button
                  aria-selected={activeType === type}
                  key={type}
                  onClick={() => setActiveType(type)}
                  role="tab"
                  type="button"
                >
                  {type}
                </button>
              ))}
            </div>
          </Card>

          <section className="banking-diagram-stack">
            {visibleDiagrams.map((diagram) => (
              <PlantUMLDiagram
                description={diagram.description}
                diagramId={diagram.id}
                key={diagram.id}
                title={diagram.title}
              />
            ))}
          </section>
        </main>
      </section>
    </Page>
  );
}
