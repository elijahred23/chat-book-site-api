export const bankingDiagrams = [
  {
    id: "relationship-map",
    title: "Correspondent relationship map",
    type: "Relationship",
    moduleId: "overview",
    description: "Shows how a respondent bank reaches external rails through a correspondent bank, payment hub, and settlement account.",
  },
  {
    id: "fedwire-iso-sequence",
    title: "Fedwire ISO 20022 sequence",
    type: "Sequence",
    moduleId: "payment-rails",
    description: "Follows a domestic wire from user request through screening, ISO message construction, Fedwire status, and core posting.",
  },
  {
    id: "iso-family-map",
    title: "ISO message family map",
    type: "Mind map",
    moduleId: "iso-20022",
    description: "Organizes pain, pacs, camt, head, and admi message families by practical job.",
  },
  {
    id: "status-state-machine",
    title: "Status lane state machine",
    type: "State",
    moduleId: "lifecycle-statuses",
    description: "Separates validation, approval, transport, business acceptance, settlement, posting, returns, recalls, and reconciliation.",
  },
  {
    id: "ach-file-structure",
    title: "ACH file structure",
    type: "ACH",
    moduleId: "ach-nacha",
    description: "Breaks down Nacha file, batch, entry, addenda, and control records.",
  },
  {
    id: "ach-return-flow",
    title: "ACH return flow",
    type: "ACH",
    moduleId: "ach-nacha",
    description: "Shows how a return moves from RDFI back to ODFI and originator after original ACH processing.",
  },
  {
    id: "check-image-presentment",
    title: "Check image presentment",
    type: "Checks",
    moduleId: "check-image-processing",
    description: "Models image capture, MICR parsing, quality review, duplicate detection, X9 cash letter creation, and exception routing.",
  },
  {
    id: "exception-investigation-loop",
    title: "Exception and investigation loop",
    type: "Exceptions",
    moduleId: "exceptions-investigations",
    description: "Shows recall request, recall response, possible return, case notes, and reconciliation around the original payment.",
  },
  {
    id: "liquidity-controls",
    title: "Liquidity and settlement controls",
    type: "Controls",
    moduleId: "risk-controls",
    description: "Separates payment requests from balance checks, credit-line checks, release control, and final settlement movement.",
  },
  {
    id: "reconciliation-evidence-model",
    title: "Reconciliation evidence model",
    type: "Reconciliation",
    moduleId: "reconciliation-reporting",
    description: "Connects payments to messages, status events, ledger entries, and external reports.",
  },
  {
    id: "platform-placement",
    title: "Fiserv-style platform placement",
    type: "Systems",
    moduleId: "roles-and-systems",
    description: "Places vendor-style core, wire, ACH, item-processing, reporting, and audit tools beside channels, controls, and rails.",
  },
  {
    id: "daily-operations-close",
    title: "Daily operations close",
    type: "Reconciliation",
    moduleId: "reconciliation-reporting",
    description: "Shows the daily close path from rail reports and core journals to balanced evidence or exception carry-forward.",
  },
];

export function getDiagramsForModule(moduleId) {
  return bankingDiagrams.filter((diagram) => diagram.moduleId === moduleId);
}

export function getDiagramById(diagramId) {
  return bankingDiagrams.find((diagram) => diagram.id === diagramId);
}
