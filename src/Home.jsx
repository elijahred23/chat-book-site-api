import { NavLink } from "react-router-dom";
import { FaArrowRight, FaBookOpen, FaCode, FaLayerGroup, FaPlay } from "react-icons/fa";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { Page, PageHeader } from "./ui/Page";

const destinations = [
  { to: "/flashCards", icon: FaLayerGroup, title: "Flash cards", text: "Build, refine, and review study cards." },
  { to: "/coding", icon: FaCode, title: "Coding practice", text: "Work through guided programming problems." },
  { to: "/system-design", icon: FaBookOpen, title: "System design", text: "Study concepts and structured design exercises." },
  { to: "/media-player", icon: FaPlay, title: "Media player", text: "Practice with focused playback controls." },
];

export default function Home({ onOpenChat, onOpenTools }) {
  return (
    <Page className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="home-hero__eyebrow">Your focused learning space</span>
          <h1>Read, practice, build, and learn in one workspace.</h1>
          <p>Move between AI assistance, study tools, coding practice, transcripts, and media without breaking your flow.</p>
          <div className="ui-cluster home-hero__actions">
            <Button variant="primary" onClick={onOpenChat}>Start a conversation <FaArrowRight /></Button>
            <Button onClick={onOpenTools}>Browse all tools</Button>
          </div>
        </div>
        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-orbit home-orbit--one" />
          <div className="home-orbit home-orbit--two" />
          <div className="home-visual-card home-visual-card--main"><span>AI workspace</span><strong>Learn with momentum</strong></div>
          <div className="home-visual-card home-visual-card--small">All tools</div>
        </div>
      </section>

      <PageHeader eyebrow="Explore" title="Pick up where you left off" description="Core workspaces are one click away. Use the Tools button for specialized utilities." />
      <div className="home-grid">
        {destinations.map(({ to, icon: Icon, title, text }) => (
          <Card as={NavLink} className="home-destination" to={to} key={to}>
            <span className="home-destination__icon"><Icon aria-hidden="true" /></span>
            <div><h2>{title}</h2><p>{text}</p></div>
            <FaArrowRight className="home-destination__arrow" aria-hidden="true" />
          </Card>
        ))}
      </div>
    </Page>
  );
}
