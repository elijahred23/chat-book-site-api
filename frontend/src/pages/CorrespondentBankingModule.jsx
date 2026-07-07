/* eslint-disable react/prop-types */
import { Link, Navigate, useParams } from "react-router-dom";
import Card from "../ui/Card";
import { Page } from "../ui/Page";
import PlantUMLDiagram from "../components/plantuml/PlantUMLDiagram";
import { bankingModules, getBankingModule } from "../correspondent_banking/modules";
import { getDiagramById } from "../correspondent_banking/diagrams";
import CorrespondentBankingNav from "./CorrespondentBankingNav";

function ListPanel({ title, items }) {
  return (
    <Card className="banking-list-panel">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </Card>
  );
}

export default function CorrespondentBankingModule({ moduleId: explicitModuleId }) {
  const params = useParams();
  const moduleId = explicitModuleId || params.moduleId;
  const module = getBankingModule(moduleId);

  if (!module) {
    return <Navigate replace to="/correspondent-banking" />;
  }

  const currentIndex = bankingModules.findIndex((item) => item.id === module.id);
  const previous = currentIndex > 0 ? bankingModules[currentIndex - 1] : null;
  const next = currentIndex < bankingModules.length - 1 ? bankingModules[currentIndex + 1] : null;
  const diagrams = module.diagramIds.map(getDiagramById).filter(Boolean);

  return (
    <Page className="banking-guide-page">
      <section className="banking-learning-shell">
        <CorrespondentBankingNav />
        <main className="banking-learning-main">
          <header className="banking-module-header">
            <span>{module.eyebrow}</span>
            <h1>{module.title}</h1>
            <p>{module.summary}</p>
          </header>

          <section className="banking-module-grid">
            <ListPanel title="What to learn" items={module.objectives} />
            <ListPanel title="Common mistakes" items={module.commonMistakes} />
          </section>

          <section className="banking-concept-grid" aria-label={`${module.title} concepts`}>
            {module.concepts.map(([term, definition]) => (
              <Card className="banking-concept-card" key={term}>
                <h2>{term}</h2>
                <p>{definition}</p>
              </Card>
            ))}
          </section>

          <section className="banking-module-grid">
            <ListPanel title="Operational detail" items={module.details} />
            <ListPanel title="Developer lens" items={module.developerLens} />
          </section>

          {diagrams.length > 0 && (
            <section className="banking-diagram-stack" aria-label={`${module.title} diagrams`}>
              {diagrams.map((diagram) => (
                <PlantUMLDiagram
                  description={diagram.description}
                  diagramId={diagram.id}
                  key={diagram.id}
                  title={diagram.title}
                />
              ))}
            </section>
          )}

          <nav className="banking-module-pager" aria-label="Module pagination">
            {previous ? <Link to={previous.path}>Previous: {previous.label}</Link> : <span />}
            {next ? <Link to={next.path}>Next: {next.label}</Link> : <Link to="/correspondent-banking/diagrams">Open diagrams</Link>}
          </nav>
        </main>
      </section>
    </Page>
  );
}
