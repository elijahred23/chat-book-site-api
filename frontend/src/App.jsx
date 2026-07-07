import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  FaBookReader,
  FaCode,
  FaComments,
  FaGlobe,
  FaKeyboard,
  FaScroll,
  FaVolumeUp,
  FaYoutube,
} from "react-icons/fa";
import { GiNotebook } from "react-icons/gi";
import { SiMarkdown } from "react-icons/si";
import ChatBookApp from "./components/chat/ChatBookApp.jsx";
import FlashCardApp from "./components/flashcards/FlashCardApp.jsx";
import HtmlBuilder from "./components/html/HtmlBuilder.jsx";
import WebBrowser from "./components/iframe/WebBrowser.jsx";
import MarkdownViewer from "./components/markdown/MarkdownViewer.jsx";
import MediaPlayer from "./components/media/MediaPlayer.jsx";
import PdfToText from "./components/media/PdfToText.jsx";
import PlantUMLViewer from "./components/plantuml/PlantUML.jsx";
import TypingTest from "./components/text/TypingText.jsx";
import YouTubeTranscript from "./components/youtube/YouTubeTranscript.jsx";
import AppDrawers from "./layouts/AppDrawers.jsx";
import ActionButtonStudio from "./pages/ActionButtonStudio.jsx";
import ApiCheck from "./pages/ApiCheck.jsx";
import BengaliTutor from "./pages/BengaliTutor.jsx";
import ChatTemplate from "./pages/ChatTemplate.jsx";
import CodingProblems from "./pages/CodingProblems.jsx";
import CorrespondentBankingGuide from "./pages/CorrespondentBankingGuide.jsx";
import Home from "./pages/Home.jsx";
import ProgressBar from "./ui/ProgressBar.jsx";
import Quran from "./pages/Quran.jsx";
import SystemDesignPrep from "./pages/SystemDesignPrep.jsx";
import { actions, useAppDispatch, useAppState } from "./context/AppContext.jsx";
import AppHeader from "./ui/AppHeader.jsx";
import ToolLauncher from "./ui/ToolLauncher.jsx";

const CpuSimulatorWithOutputHistory = lazy(() => import("./components/cpu/CpuSimulatorWithOutputHistory.jsx"));

function AppContent() {
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [isToolLauncherOpen, setIsToolLauncherOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const dispatch = useAppDispatch();
  const state = useAppState();
  const {
    drawerStack,
    isChat2Open,
    isChatBookOpen,
    isChatOpen,
    isHtmlBuilderOpen,
    isIframeOpen,
    isLargeTextOpen,
    isMarkdownViewerOpen,
    isPlantUMLOpen,
    isTTSOpen,
    isTeleprompterOpen,
    isTypingOpen,
    isYouTubeOpen,
  } = state;

  const toggleWidth = () => setIsFullWidth((current) => !current);
  const setPanel = (action, value) => dispatch(action(value));

  useEffect(() => {
    const savedText = localStorage.getItem("selectedText");
    if (savedText) dispatch(actions.setSelectedText(savedText));
  }, [dispatch]);

  const anyDrawerOpen = Boolean(
    drawerStack?.length ||
    isChatOpen ||
    isChat2Open ||
    isTTSOpen ||
    isTeleprompterOpen ||
    isPlantUMLOpen ||
    isChatBookOpen ||
    isYouTubeOpen ||
    isHtmlBuilderOpen ||
    isTypingOpen ||
    isIframeOpen ||
    isLargeTextOpen ||
    isMarkdownViewerOpen
  );

  const tools = [
    { key: "chat", label: "AI Chat", icon: FaComments, active: isChatOpen, action: () => setPanel(actions.setIsChatOpen, true) },
    { key: "chat2", label: "Dual Chat", icon: FaComments, active: isChat2Open, action: () => setPanel(actions.setIsChat2Open, true) },
    { key: "tts", label: "Text to Speech", icon: FaVolumeUp, active: isTTSOpen, action: () => setPanel(actions.setIsTTSOpen, true) },
    { key: "markdown", label: "Markdown Viewer", icon: SiMarkdown, active: isMarkdownViewerOpen, action: () => setPanel(actions.setIsMarkdownViewerOpen, true) },
    { key: "teleprompter", label: "Teleprompter", icon: FaScroll, active: isTeleprompterOpen, action: () => setPanel(actions.setIsTeleprompterOpen, true) },
    { key: "chatbook", label: "Chat Book", icon: GiNotebook, active: isChatBookOpen, action: () => setPanel(actions.setIsChatBookOpen, true) },
    { key: "iframe", label: "Iframe Viewer", icon: FaGlobe, active: isIframeOpen, action: () => setPanel(actions.setIsIframeOpen, true) },
    { key: "youtube", label: "YouTube Transcript", icon: FaYoutube, active: isYouTubeOpen, action: () => setPanel(actions.setIsYouTubeOpen, true) },
    { key: "large", label: "Text Chunker", icon: FaBookReader, active: isLargeTextOpen, action: () => setPanel(actions.setIsLargeTextOpen, true) },
    { key: "html", label: "HTML Builder", icon: FaCode, active: isHtmlBuilderOpen, action: () => setPanel(actions.setIsHtmlBuilderOpen, true) },
    { key: "typing", label: "Typing Test", icon: FaKeyboard, active: isTypingOpen, action: () => setPanel(actions.setIsTypingOpen, true) },
  ];

  return (
    <div className="app-shell">
      {!anyDrawerOpen && (
        <AppHeader
          isOpen={isNavigationOpen}
          onToggle={() => setIsNavigationOpen((current) => !current)}
          onClose={() => setIsNavigationOpen(false)}
        />
      )}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home onOpenChat={() => setPanel(actions.setIsChatOpen, true)} onOpenTools={() => setIsToolLauncherOpen(true)} />} />
          <Route path="/chatBook" element={<ChatBookApp />} />
          <Route path="/apiCheck" element={<ApiCheck />} />
          <Route path="/progressBar" element={<ProgressBar progress={100} />} />
          <Route path="/chatTemplate" element={<ChatTemplate />} />
          <Route path="/youTubeTranscript" element={<YouTubeTranscript />} />
          <Route path="/htmlBuilder" element={<HtmlBuilder />} />
          <Route path="/webBrowser" element={<WebBrowser />} />
          <Route path="/Quran" element={<Quran />} />
          <Route path="/typingTest" element={<TypingTest />} />
          <Route path="/flashCards" element={<FlashCardApp />} />
          <Route path="/plantUML" element={<PlantUMLViewer />} />
          <Route path="/bengali" element={<BengaliTutor />} />
          <Route path="/coding" element={<CodingProblems />} />
          <Route path="/cpu-simulator" element={<Suspense fallback={null}><CpuSimulatorWithOutputHistory /></Suspense>} />
          <Route path="/system-design" element={<SystemDesignPrep />} />
          <Route path="/correspondent-banking" element={<CorrespondentBankingGuide />} />
          <Route path="/pdf-to-text" element={<PdfToText />} />
          <Route path="/media-player" element={<MediaPlayer />} />
          <Route path="/action-buttons-studio" element={<ActionButtonStudio />} />
          <Route path="/markdown-viewer" element={<MarkdownViewer />} />
        </Routes>
      </main>

      <ToolLauncher
        tools={tools}
        isOpen={isToolLauncherOpen}
        onToggle={() => setIsToolLauncherOpen((current) => !current)}
        onClose={() => setIsToolLauncherOpen(false)}
        hidden={anyDrawerOpen}
      />

      <AppDrawers state={state} isFullWidth={isFullWidth} onToggleWidth={toggleWidth} setPanel={setPanel} />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}
