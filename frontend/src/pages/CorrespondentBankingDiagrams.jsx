import { useState } from "react";

const diagramModels = [
  {
    id: "relationship-map",
    eyebrow: "Relationship map",
    title: "How a respondent bank reaches the rails",
    summary: "The correspondent bank works as the bridge between the customer bank, settlement accounts, operations controls, and external networks.",
    metric: "6 roles",
    nodes: ["Customer", "Respondent bank", "Correspondent bank", "Payment hub", "Rail", "Beneficiary bank"],
    details: [
      "The respondent bank owns the customer relationship and starts the operational request.",
      "The correspondent bank provides access, settlement support, monitoring, limits, and exception handling.",
      "The payment hub validates the request, builds rail-ready messages, tracks status, and stores evidence.",
    ],
    watch: ["Who is the sender of record?", "Which settlement account is used?", "Where is the final status stored?"],
  },
  {
    id: "iso-lifecycle",
    eyebrow: "Message lifecycle",
    title: "From request to ISO evidence",
    summary: "A single wire-style payment becomes a chain of requests, headers, status reports, accounting entries, and exception signals.",
    metric: "8 checkpoints",
    nodes: ["pain.001", "Validate", "head.001", "pacs.008", "pacs.002", "Settlement", "Core posting", "Exception"],
    details: [
      "A customer-facing request can start as pain.001 before the bank creates the interbank ISO message.",
      "head.001 works like the routing label for the ISO package and carries sender, receiver, service, and message metadata.",
      "pacs.002 is a status report. It should not be confused with settlement or core posting.",
    ],
    watch: ["Delivered is not the same as accepted.", "Accepted is not the same as posted.", "Original IDs must be preserved for research and returns."],
  },
  {
    id: "status-lanes",
    eyebrow: "Status lanes",
    title: "Why one payment needs multiple status tracks",
    summary: "Transport, network response, settlement, and core posting should be shown as separate lanes instead of one overloaded badge.",
    metric: "4 lanes",
    nodes: ["Queue delivery", "Network response", "Settlement journal", "Core posting"],
    details: [
      "Queue delivery only proves the message moved through transport.",
      "Network response proves the external system replied through a business or technical status message.",
      "Settlement journal and core posting prove the accounting side and should reconcile separately.",
    ],
    watch: ["Transport can succeed while business validation fails.", "Posting can lag behind rail response.", "A return creates a new lifecycle to track."],
  },
  {
    id: "exception-loop",
    eyebrow: "Exception loop",
    title: "Returns, recalls, and investigations",
    summary: "Exception messages are a controlled loop around the original payment, not just a red label on top of it.",
    metric: "5 signals",
    nodes: ["Original", "camt.056", "camt.029", "pacs.004", "Reconcile"],
    details: [
      "camt.056 asks for cancellation or recall after the payment has already moved into the network.",
      "camt.029 answers the investigation, recall, or cancellation request.",
      "pacs.004 carries the return when value needs to move back through the chain.",
    ],
    watch: ["Who requested the recall?", "Was the request accepted?", "Did accounting reverse, return, or annotate?"],
  },
];

export default function CorrespondentBankingDiagrams() {
  const [activeDiagram, setActiveDiagram] = useState(null);

  return (
    <section className="banking-diagram-zone">
      <div className="banking-dark-heading">
        <span>Visual learning lab</span>
        <h2>Open each diagram model to see the concept in depth</h2>
        <p>These models turn correspondent banking into clickable pictures: relationships, ISO lifecycle, status lanes, and exception handling.</p>
      </div>

      <div className="banking-diagram-grid">
        {diagramModels.map((diagram) => (
          <button className="banking-diagram-card" key={diagram.id} onClick={() => setActiveDiagram(diagram)} type="button">
            <span>{diagram.eyebrow}</span>
            <strong>{diagram.metric}</strong>
            <h3>{diagram.title}</h3>
            <p>{diagram.summary}</p>
            <div className="banking-mini-flow" aria-hidden="true">
              {diagram.nodes.slice(0, 4).map((node) => <i key={node}>{node}</i>)}
            </div>
            <em>Open diagram</em>
          </button>
        ))}
      </div>

      {activeDiagram && (
        <div className="banking-modal-backdrop" onClick={() => setActiveDiagram(null)} role="presentation">
          <section aria-labelledby="banking-diagram-modal-title" aria-modal="true" className="banking-diagram-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <button className="banking-modal-close" onClick={() => setActiveDiagram(null)} type="button">Close</button>
            <div className="banking-modal-header">
              <span>{activeDiagram.eyebrow}</span>
              <h2 id="banking-diagram-modal-title">{activeDiagram.title}</h2>
              <p>{activeDiagram.summary}</p>
            </div>
            <div className="banking-modal-flow" aria-label={`${activeDiagram.title} flow`}>
              {activeDiagram.nodes.map((node, index) => (
                <div className="banking-modal-node" key={node}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{node}</strong>
                </div>
              ))}
            </div>
            <div className="banking-modal-detail-grid">
              <div>
                <h3>What this means</h3>
                <ul>{activeDiagram.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              </div>
              <div>
                <h3>What to watch in logs</h3>
                <ul>{activeDiagram.watch.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
