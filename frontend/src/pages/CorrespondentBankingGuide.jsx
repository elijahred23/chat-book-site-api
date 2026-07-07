import Card from "../ui/Card";
import { Page, PageHeader } from "../ui/Page";

export default function CorrespondentBankingGuide() {
  return (
    <Page className="banking-guide-page">
      <section className="banking-hero">
        <div className="banking-hero__copy">
          <span className="banking-kicker">Correspondent banking field guide</span>
          <h1>Payment rails without the fog machine.</h1>
          <p>Learn how Fedwire, ISO 20022, ACH, Nacha, Fiserv-style platforms, and check image processing fit together when one bank helps another bank move money, files, images, and operational evidence.</p>
        </div>
      </section>
      <PageHeader eyebrow="Overview" title="Correspondent banking concepts" description="A friendly reference page for wire, ACH, vendor, and check processing concepts." />
      <Card><p>Guide content coming together here.</p></Card>
    </Page>
  );
}
