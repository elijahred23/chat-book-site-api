import { useState } from "react";
import Card from "../ui/Card";
import { Page, PageHeader } from "../ui/Page";

const roles = [
  ["Respondent bank", "A community bank or credit union that uses a correspondent for rail access, settlement, item processing, liquidity, or operations support."],
  ["Correspondent bank", "The banker's bank in the middle. It may provide Fed access, wire operations, ACH services, image exchange, international payment services, and settlement accounts."],
  ["Core banking system", "The system of record for customers, accounts, holds, ledger entries, approvals, and posting."],
  ["Payment hub", "The orchestration layer that validates messages, applies limits, routes to adapters, records status, and reconciles responses."],
  ["Rail or operator", "Fedwire, CHIPS, FedACH, EPN, SWIFT, FedForward, FedReturn, or an image exchange partner."],
  ["Exception desk", "The team and workflow that handles rejects, returns, recalls, investigations, adjustments, duplicate checks, and out-of-balance files."],
];

const standards = [
  {
    title: "Fedwire Funds Service",
    reference: "Fedwire Funds Service ISO 20022 implementation guidance, Federal Reserve operating circulars, and FedLine access requirements.",
    use: "Domestic U.S. high-value and time-sensitive funds transfers with real-time gross settlement in Federal Reserve money.",
    memorize: ["Immediate final settlement", "Business Application Header head.001", "pacs.008, pacs.009, pacs.002, pacs.004", "camt.056 and camt.029 for recall and investigation", "ABA routing, trace IDs, sender and receiver roles"],
  },
  {
    title: "ISO 20022",
    reference: "ISO 20022 schemas plus rail-specific usage guidelines for Fedwire, FedNow, CHIPS, and SWIFT CBPR+.",
    use: "A shared message language for payments, reporting, and investigations. The schema is the alphabet; each rail's guide is the grammar book.",
    memorize: ["pacs = payments clearing and settlement", "camt = cash management and investigation", "pain = customer payment initiation", "XSD validation", "Market-practice code sets and cardinality rules"],
  },
  {
    title: "SWIFT CBPR+",
    reference: "Cross-Border Payments and Reporting Plus usage guidelines for ISO 20022 over SWIFT.",
    use: "Cross-border correspondent banking where banks send ISO 20022 messages through SWIFT and settle through correspondent relationships.",
    memorize: ["pacs.008 customer transfer", "pacs.009 institution transfer", "UETR tracking", "Intermediary agents", "Charges, purpose, remittance, and regulatory data"],
  },
  {
    title: "ACH and Nacha",
    reference: "Nacha Operating Rules, ACH file format, Federal Reserve Operating Circular 4, and operator schedules for FedACH and EPN.",
    use: "Batch credits and debits for payroll, vendor payments, tax payments, bill payment, consumer pulls, and corporate cash movement.",
    memorize: ["ODFI, RDFI, Originator, Receiver", "SEC codes: PPD, CCD, CTX, WEB, TEL, IAT", "File, batch, entry, addenda, and control records", "Return codes such as R01 and R03", "NOCs, prenotes, and Same Day ACH windows"],
  },
  {
    title: "Fiserv-style platforms",
    reference: "Vendor implementation layer, not a payment standard. These systems are configured around Fed, Nacha, OFAC, core, and image exchange requirements.",
    use: "A bank may use Fiserv products for core processing, wire rooms, ACH origination, item processing, digital channels, reports, or back-office workflows.",
    memorize: ["Core posting", "Payment origination screens", "Approval limits", "Rail adapters", "Reconciliation, reports, and audit trails"],
  },
  {
    title: "Check image processing",
    reference: "Check 21 Act, Regulation CC, ANSI X9.100-187 image cash letter, X9.100-181 TIFF, X9.100-160 MICR, ECCHO Rules, and FedForward/FedReturn documentation.",
    use: "Electronic exchange of check images, returns, cash letters, adjustments, substitute checks, and warranties between banks and image partners.",
    memorize: ["MICR line: routing, account, serial, and transaction codes", "Front and back image capture", "Image Quality Analysis", "Cash letter headers and controls", "Returns, duplicate detection, endorsements, and adjustments"],
  },
];

const messageFamilies = [
  {
    id: "pacs",
    label: "pacs",
    title: "Payment clearing and settlement",
    description: "The interbank money-movement family. These messages carry wires, settlement transfers, returns, reversals, and status reports.",
    color: "blue",
    messages: [
      ["pacs.002", "Payment status report", "Status update for a payment message. Received, accepted, rejected, settled, or pending."],
      ["pacs.003", "Direct debit instruction", "Direct debit payment instruction between banks."],
      ["pacs.004", "Payment return", "Return previously received funds back to the sender."],
      ["pacs.007", "Payment reversal", "Reverse or undo a previously settled payment."],
      ["pacs.008", "Customer credit transfer", "Send money for a customer payment. This is the standard customer wire transfer message."],
      ["pacs.009", "Financial institution credit transfer", "Send money for a bank-to-bank payment or settlement transfer."],
      ["pacs.010", "Direct debit received notice", "Notify another institution that a direct debit has been received."],
      ["pacs.028", "Payment status request", "Ask for the status of an existing payment."],
    ],
  },
  {
    id: "pain",
    label: "pain",
    title: "Customer initiated requests",
    description: "The customer-to-bank instruction family. A pain message often starts the story before the bank converts it into an interbank pacs message.",
    color: "purple",
    messages: [
      ["pain.001", "Customer credit transfer initiation", "Customer asks their bank to send money."],
      ["pain.002", "Customer payment status report", "Bank responds with the status of the customer's payment request."],
      ["pain.007", "Customer reversal request", "Customer requests a payment reversal."],
      ["pain.008", "Customer direct debit initiation", "Customer initiates a direct debit collection request."],
      ["pain.009", "Customer payment status request", "Customer requests the status of a payment."],
      ["pain.012", "Customer cancellation request", "Customer requests a payment cancellation."],
      ["pain.013", "Customer investigation request", "Customer requests a payment investigation or inquiry."],
      ["pain.014", "Investigation response", "Bank responds to a payment investigation request."],
    ],
  },
  {
    id: "camt",
    label: "camt",
    title: "Cash management and investigations",
    description: "The reporting, notification, recall, and case-management family. This is where balances, statements, credits, debits, and investigations live.",
    color: "teal",
    messages: [
      ["camt.026", "Investigation request", "Request investigation of a payment or account issue."],
      ["camt.029", "Resolution or recall response", "Response to an investigation, recall, or cancellation request."],
      ["camt.030", "Case status request", "Request a case status update."],
      ["camt.052", "Intraday account report", "Intraday account reporting and balance updates."],
      ["camt.053", "Bank statement", "End-of-day account statement."],
      ["camt.054", "Debit or credit notification", "Notification that money was credited or debited from an account."],
      ["camt.055", "Cancellation request", "Request cancellation of a payment."],
      ["camt.056", "Recall request", "Recall or cancellation request for a payment already sent."],
      ["camt.057", "Case assignment notice", "Notification that an investigation case has been assigned or modified."],
      ["camt.058", "Investigation status update", "Resolution or status update for an investigation case."],
      ["camt.087", "Additional information request", "Request additional information about a payment or investigation case."],
    ],
  },
  {
    id: "admin",
    label: "admin",
    title: "Headers and technical acknowledgements",
    description: "The technical envelope and plumbing family. These messages help the network route, acknowledge, or reject the package before business logic takes over.",
    color: "amber",
    messages: [
      ["head.001", "Business application header", "Business application header containing sender, receiver, and routing information."],
      ["admi.002", "Technical acknowledgement", "Technical acknowledgement that a message was received."],
      ["admi.004", "Technical rejection", "Technical rejection or error response for a message."],
    ],
  },
];

const railMessageTabs = [
  {
    id: "fednow",
    label: "FedNow",
    summary: "Instant payment rail where one outgoing payment may generate multiple status reports as it moves through validation and final posting.",
    messages: ["pacs.008", "pacs.002", "camt.056", "camt.029", "pacs.004"],
  },
  {
    id: "fedwire",
    label: "Fedwire ISO 20022",
    summary: "High-value domestic wire rail focused on final settlement, status, account reporting, and debit or credit notifications.",
    messages: ["pacs.008", "pacs.009", "pacs.002", "camt.052", "camt.053", "camt.054"],
  },
  {
    id: "swift",
    label: "SWIFT CBPR+",
    summary: "Cross-border correspondent banking messages for customer wires, bank transfers, status, recalls, responses, and returns.",
    messages: ["pacs.008", "pacs.009", "pacs.002", "camt.056", "camt.029", "pacs.004"],
  },
];

const rails = [
  ["Fedwire", "Real-time gross settlement", "Minutes or less", "High-value domestic USD wires"],
  ["ACH", "Batch clearing with operator settlement", "Same day or next day", "Payroll, billing, vendor, tax, and account transfers"],
  ["SWIFT CBPR+", "Messaging with correspondent settlement", "Depends on bank corridor", "International correspondent banking"],
  ["Check image", "Presentment and return exchange", "Daily cycles", "Deposits, returns, adjustments, and image archives"],
];

const flow = [
  ["1", "Instruction", "Customer or bank starts a payment, ACH batch, or check deposit."],
  ["2", "Validation", "The bank checks fields, account status, limits, approvals, and required operational controls."],
  ["3", "Correspondent service", "The correspondent supplies the rail connection, settlement account, file exchange, or operations desk."],
  ["4", "Rail format", "The work becomes ISO XML, a Nacha file, a SWIFT message, or an X9 image cash letter."],
  ["5", "Settlement and posting", "Funds or entries settle and the core records customer and general ledger activity."],
  ["6", "Evidence", "Statuses, returns, trace IDs, reports, and journals prove the lifecycle."],
];

const fieldNotes = [
  "Transport delivery, business acceptance, settlement, and core posting are separate signals. Do not flatten them into one vague status.",
  "A standard says what the message looks like. A rail guide says what that network allows. A bank procedure says who can send it.",
  "Fiserv belongs in the cockpit and plumbing layer. Fedwire, Nacha, SWIFT, and X9 define the road signs.",
  "Correspondent banking is reach plus trust: connectivity, liquidity, operations, compliance support, and reconciliation at scale.",
];

export default function CorrespondentBankingGuide() {
  const [activeFamily, setActiveFamily] = useState(messageFamilies[0].id);
  const [activeRail, setActiveRail] = useState(railMessageTabs[0].id);

  const selectedFamily = messageFamilies.find((family) => family.id === activeFamily) ?? messageFamilies[0];
  const selectedRail = railMessageTabs.find((rail) => rail.id === activeRail) ?? railMessageTabs[0];
  const totalMessageCount = messageFamilies.reduce((count, family) => count + family.messages.length, 0);

  return (
    <Page className="banking-guide-page">
      <section className="banking-hero">
        <div className="banking-hero__copy">
          <span className="banking-kicker">Correspondent banking field guide</span>
          <h1>Payment rails without the fog machine.</h1>
          <p>Learn how Fedwire, ISO 20022, ACH, Nacha, Fiserv-style platforms, and check image processing fit together when one bank helps another bank move money, files, images, and evidence.</p>
          <div className="banking-hero__chips" aria-label="Included topics">
            <span>Fedwire ISO 20022</span><span>ACH Nacha</span><span>Fiserv layer</span><span>X9 check images</span>
          </div>
        </div>
        <div className="banking-hero__diagram" aria-label="Correspondent banking flow diagram">
          <div className="banking-node banking-node--small">Respondent bank</div>
          <div className="banking-rail">correspondent services</div>
          <div className="banking-node banking-node--large">Fedwire · ACH · Checks · SWIFT</div>
          <div className="banking-pulse banking-pulse--one" />
          <div className="banking-pulse banking-pulse--two" />
        </div>
      </section>

      <section className="banking-overview-strip" aria-label="Correspondent banking highlights">
        <div><span>Scope</span><strong>Rails, standards, vendors, exceptions</strong></div>
        <div><span>ISO messages</span><strong>{totalMessageCount} decoder cards</strong></div>
        <div><span>Best mental model</span><strong>Lifecycle, not one status</strong></div>
      </section>

      <PageHeader eyebrow="Mental model" title="Who is doing what?" description="Correspondent banking is a relay race with compliance checkpoints, ledger footprints, and carefully labeled envelopes." />
      <div className="banking-role-grid">
        {roles.map(([role, description]) => (
          <Card className="banking-role-card" key={role}><h2>{role}</h2><p>{description}</p></Card>
        ))}
      </div>

      <section className="banking-flow-section">
        <PageHeader eyebrow="End-to-end story" title="From instruction to evidence trail" description="A practical payment lifecycle separates the message, acceptance, settlement, posting, and exceptions." />
        <div className="banking-flow-grid">
          {flow.map(([number, title, text]) => (
            <div className="banking-flow-step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>
          ))}
        </div>
      </section>

      <PageHeader eyebrow="Standards map" title="The correspondent-banking standards cabinet" description="The useful shelf: Fed operating rules, ISO schemas, Nacha rules, X9 check-image standards, ECCHO rules, and vendor implementation layers." />
      <div className="banking-standard-list">
        {standards.map((item) => (
          <Card className="banking-standard-card" key={item.title}>
            <div className="banking-standard-card__header"><div><span>Reference</span><h2>{item.title}</h2></div><p>{item.use}</p></div>
            <div className="banking-standard-card__body">
              <div><h3>Specific standard or rulebook</h3><p>{item.reference}</p></div>
              <div><h3>What to memorize</h3><ul>{item.memorize.map((concept) => <li key={concept}>{concept}</li>)}</ul></div>
            </div>
          </Card>
        ))}
      </div>

      <section className="banking-iso-lab">
        <div className="banking-iso-lab__intro">
          <PageHeader eyebrow="ISO 20022 decoder" title="Message types, grouped like a clean control room" description="Tabs keep the license-plate names readable: customer requests, interbank movement, cash management, and technical acknowledgements." />
          <div className="banking-memory-grid" aria-label="ISO 20022 memory trick">
            <div><code>pain</code><span>Customer asks</span></div>
            <div><code>pacs</code><span>Money moves</span></div>
            <div><code>camt</code><span>Accounts and cases</span></div>
            <div><code>admi/head</code><span>Technical envelope</span></div>
          </div>
        </div>

        <Card className={`banking-message-panel banking-message-panel--${selectedFamily.color}`}>
          <div className="banking-tabs" role="tablist" aria-label="ISO 20022 message families">
            {messageFamilies.map((family) => (
              <button
                aria-controls={`message-panel-${family.id}`}
                aria-selected={selectedFamily.id === family.id}
                className="banking-tab"
                id={`message-tab-${family.id}`}
                key={family.id}
                onClick={() => setActiveFamily(family.id)}
                role="tab"
                type="button"
              >
                <span>{family.label}</span>
                <strong>{family.messages.length}</strong>
              </button>
            ))}
          </div>

          <div
            aria-labelledby={`message-tab-${selectedFamily.id}`}
            className="banking-tab-panel"
            id={`message-panel-${selectedFamily.id}`}
            role="tabpanel"
          >
            <div className="banking-tab-panel__header">
              <div>
                <span>{selectedFamily.label} messages</span>
                <h2>{selectedFamily.title}</h2>
              </div>
              <p>{selectedFamily.description}</p>
            </div>
            <div className="banking-message-card-grid">
              {selectedFamily.messages.map(([message, name, meaning]) => (
                <article className="banking-message-card" key={message}>
                  <code>{message}</code>
                  <h3>{name}</h3>
                  <p>{meaning}</p>
                </article>
              ))}
            </div>
          </div>
        </Card>

        <Card className="banking-rail-message-panel">
          <div className="banking-rail-message-panel__copy">
            <span>Common by rail</span>
            <h2>Which ISO messages show up together?</h2>
            <p>Use this as the operator cheat sheet when reading FedNow, Fedwire ISO 20022, or SWIFT CBPR+ lifecycle logs.</p>
          </div>
          <div className="banking-rail-tabs" role="tablist" aria-label="Common ISO messages by payment rail">
            {railMessageTabs.map((rail) => (
              <button
                aria-controls={`rail-panel-${rail.id}`}
                aria-selected={selectedRail.id === rail.id}
                className="banking-rail-tab"
                id={`rail-tab-${rail.id}`}
                key={rail.id}
                onClick={() => setActiveRail(rail.id)}
                role="tab"
                type="button"
              >
                {rail.label}
              </button>
            ))}
          </div>
          <div aria-labelledby={`rail-tab-${selectedRail.id}`} className="banking-rail-tab-panel" id={`rail-panel-${selectedRail.id}`} role="tabpanel">
            <p>{selectedRail.summary}</p>
            <div className="banking-token-row">
              {selectedRail.messages.map((message) => <code key={message}>{message}</code>)}
            </div>
          </div>
        </Card>
      </section>

      <section className="banking-reference-section">
        <Card className="banking-note-card">
          <h2>Developer lens</h2>
          <p>Build payments as lifecycles, not one status field. A wire can be created, approved, serialized, queued, delivered, accepted, settled, posted, returned, or investigated.</p>
          <pre><code>{`instruction -> validation -> envelope -> rail delivery -> status report -> settlement journal -> core posting -> exception handling`}</code></pre>
        </Card>
        <Card className="banking-note-card banking-note-card--blueprint">
          <h2>UI idea for your lab</h2>
          <p>Keep queue delivery, network response, settlement journal, and core posting in separate timeline lanes. That prevents a green transport checkmark from pretending the money fully settled.</p>
        </Card>
      </section>

      <PageHeader eyebrow="Rail comparison" title="Pick the rail by settlement, speed, and risk" description="Every rail has a personality: urgent dragon, batch goose, international octopus, or check-image fossil with a scanner." />
      <div className="banking-rail-table" role="table" aria-label="Payment rail comparison">
        <div className="banking-rail-row banking-rail-row--head" role="row"><span>Rail</span><span>Settlement model</span><span>Typical speed</span><span>Best fit</span></div>
        {rails.map(([rail, settlement, speed, fit]) => (<div className="banking-rail-row" role="row" key={rail}><strong>{rail}</strong><span>{settlement}</span><span>{speed}</span><span>{fit}</span></div>))}
      </div>

      <section className="banking-field-notes">
        <PageHeader eyebrow="Field notes" title="Rules of thumb for real systems" description="Sticky notes for reading message logs, queue deliveries, settlement reports, and core journals." />
        <div className="banking-note-grid">
          {fieldNotes.map((note, index) => (<Card className="banking-sticky-note" key={note}><span>{String(index + 1).padStart(2, "0")}</span><p>{note}</p></Card>))}
        </div>
      </section>
    </Page>
  );
}
