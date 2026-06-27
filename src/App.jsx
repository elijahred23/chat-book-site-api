import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  FaBookReader,
  FaCode,
  FaComments,
  FaGlobe,
  FaHeadphones,
  FaKeyboard,
  FaMagic,
  FaMicrophoneAlt,
  FaProjectDiagram,
  FaScroll,
  FaVolumeUp,
  FaYoutube,
} from "react-icons/fa";
import { GiNotebook } from "react-icons/gi";
import { SiMarkdown } from "react-icons/si";
import ActionButtonStudio from "./ActionButtonStudio.jsx";
import ApiCheck from "./ApiCheck.jsx";
import AsmrPromptDrawer from "./AsmrPromptDrawer.jsx";
import BengaliTutor from "./BengaliTutor.jsx";
import ChatBookApp from "./ChatBookApp.jsx";
import ChatGPTDual from "./ChatGPTDual.jsx";
import GptPromptComponent from "./ChatGPT.jsx";
import ChatTemplate from "./ChatTemplate.jsx";
import CodingProblems from "./CodingProblems.jsx";
import DownloadCopyTextFile from "./DownloadCopyTextFile.jsx";
import FlashCardApp from "./FlashCardApp.jsx";
import Home from "./Home.jsx";
import HtmlBuilder from "./HtmlBuilder.jsx";
import IframeDrawer from "./IframeDrawer.jsx";
import JSConsoleGenerator from "./JSConsoleGenerator.jsx";
import LargeTextChunks from "./LargeTextChunks.jsx";
import LoopingTTS from "./LoopingTTS.jsx";
import MarkdownViewer from "./MarkdownViewer.jsx";
import MediaPlayer from "./MediaPlayer.jsx";
import PdfToText from "./PdfToText.jsx";
import PlantUMLViewer from "./PlantUML.jsx";
import PodcastTTSPlayer from "./PodcastTTSPlayer.jsx";
import ProgressBar from "./ui/ProgressBar.jsx";
import Quran from "./Quran.jsx";
import SystemDesignPrep from "./SystemDesignPrep.jsx";
import Teleprompter from "./Teleprompter.jsx";
import TextSelectionTooltip from "./TextSelectionTooltip.jsx";
import TypingTest from "./TypingText.jsx";
import WebBrowser from "./WebBrowser.jsx";
import Wiki from "./Wiki.jsx";
import YouTubeTranscript from "./YouTubeTranscript.jsx";
import { actions, useAppDispatch, useAppState } from "./context/AppContext.jsx";
import AppHeader from "./ui/AppHeader.jsx";
import SideDrawer from "./ui/SideDrawer.jsx";
import ToolLauncher from "./ui/ToolLauncher.jsx";

function AppContent() {
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isPromptVisible, setIsPromptVisible] = useState(true);
  const [isToolLauncherOpen, setIsToolLauncherOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const dispatch = useAppDispatch();
  const state = useAppState();
  const {
    drawerStack,
    isAsmrOpen,
    isChat2Open,
    isChatBookOpen,
    isChatOpen,
    isHtmlBuilderOpen,
    isIframeOpen,
    isJSGeneratorOpen,
    isLargeTextOpen,
    isMarkdownViewerOpen,
    isPlantUMLOpen,
    isPodcastTTSOpen,
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
    isPodcastTTSOpen ||
    isJSGeneratorOpen ||
    isChatBookOpen ||
    isYouTubeOpen ||
    isHtmlBuilderOpen ||
    isTypingOpen ||
    isIframeOpen ||
    isLargeTextOpen ||
    isAsmrOpen ||
    isMarkdownViewerOpen
  );

  const tools = [
    { key: "chat", label: "AI Chat", icon: FaComments, active: isChatOpen, action: () => setPanel(actions.setIsChatOpen, true) },
    { key: "chat2", label: "Dual Chat", icon: FaComments, active: isChat2Open, action: () => setPanel(actions.setIsChat2Open, true) },
    { key: "tts", label: "Text to Speech", icon: FaVolumeUp, active: isTTSOpen, action: () => setPanel(actions.setIsTTSOpen, true) },
    { key: "teleprompter", label: "Teleprompter", icon: FaScroll, active: isTeleprompterOpen, action: () => setPanel(actions.setIsTeleprompterOpen, true) },
    { key: "plantuml", label: "UML Viewer", icon: FaProjectDiagram, active: isPlantUMLOpen, action: () => setPanel(actions.setIsPlantUMLOpen, true) },
    { key: "podcast", label: "Podcast TTS", icon: FaMicrophoneAlt, active: isPodcastTTSOpen, action: () => setPanel(actions.setIsPodcastTTSOpen, true) },
    { key: "jsgen", label: "JS Generator", icon: FaMagic, active: isJSGeneratorOpen, action: () => setPanel(actions.setIsJSGeneratorOpen, true) },
    { key: "youtube", label: "YouTube Transcript", icon: FaYoutube, active: isYouTubeOpen, action: () => setPanel(actions.setIsYouTubeOpen, true) },
    { key: "chatbook", label: "Chat Book", icon: GiNotebook, active: isChatBookOpen, action: () => setPanel(actions.setIsChatBookOpen, true) },
    { key: "html", label: "HTML Builder", icon: FaCode, active: isHtmlBuilderOpen, action: () => setPanel(actions.setIsHtmlBuilderOpen, true) },
    { key: "typing", label: "Typing Test", icon: FaKeyboard, active: isTypingOpen, action: () => setPanel(actions.setIsTypingOpen, true) },
    { key: "iframe", label: "Iframe Viewer", icon: FaGlobe, active: isIframeOpen, action: () => setPanel(actions.setIsIframeOpen, true) },
    { key: "large", label: "Text Chunker", icon: FaBookReader, active: isLargeTextOpen, action: () => setPanel(actions.setIsLargeTextOpen, true) },
    { key: "asmr", label: "ASMR Typeout", icon: FaHeadphones, active: isAsmrOpen, action: () => setPanel(actions.setIsAsmrOpen, true) },
    { key: "markdown", label: "Markdown Viewer", icon: SiMarkdown, active: isMarkdownViewerOpen, action: () => setPanel(actions.setIsMarkdownViewerOpen, true) },
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
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/htmlBuilder" element={<HtmlBuilder />} />
          <Route path="/webBrowser" element={<WebBrowser />} />
          <Route path="/Quran" element={<Quran />} />
          <Route path="/typingTest" element={<TypingTest />} />
          <Route path="/flashCards" element={<FlashCardApp />} />
          <Route path="/plantUML" element={<PlantUMLViewer />} />
          <Route path="/jsGenerator" element={<JSConsoleGenerator />} />
          <Route path="/bengali" element={<BengaliTutor />} />
          <Route path="/coding" element={<CodingProblems />} />
          <Route path="/system-design" element={<SystemDesignPrep />} />
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
        hidden={anyDrawerOpen || isAsmrOpen}
      />

      <SideDrawer isOpen={isChatOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="chat" title="AI Chat" onClose={() => setPanel(actions.setIsChatOpen, false)}>
        <GptPromptComponent
          isOpen={isChatOpen}
          isCollapsed={!isChatVisible}
          hidePrompt={!isPromptVisible}
          onClose={() => setPanel(actions.setIsChatOpen, false)}
          onToggleCollapse={() => setIsChatVisible((current) => !current)}
          onTogglePrompt={() => setIsPromptVisible((current) => !current)}
        />
      </SideDrawer>

      <SideDrawer isOpen={isIframeOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="iframe" title="Iframe Viewer" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsIframeOpen, false)}><IframeDrawer /></SideDrawer>
      <SideDrawer isOpen={isTTSOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="tts" title="Text to Speech" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsTTSOpen, false)}><LoopingTTS /></SideDrawer>
      <SideDrawer isOpen={isTeleprompterOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="teleprompter" title="Teleprompter" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsTeleprompterOpen, false)}><Teleprompter /></SideDrawer>
      <SideDrawer isOpen={isPlantUMLOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="plantuml" title="PlantUML Viewer" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsPlantUMLOpen, false)}><PlantUMLViewer /></SideDrawer>
      <SideDrawer isOpen={isPodcastTTSOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="podcast" title="Podcast TTS" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsPodcastTTSOpen, false)}><PodcastTTSPlayer /></SideDrawer>
      <SideDrawer isOpen={isHtmlBuilderOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="html" title="HTML Builder" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsHtmlBuilderOpen, false)}><HtmlBuilder /></SideDrawer>
      <SideDrawer isOpen={isTypingOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="typing" title="Typing Test" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsTypingOpen, false)}><TypingTest /></SideDrawer>
      <SideDrawer isOpen={isYouTubeOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="youtube" title="YouTube Transcript" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsYouTubeOpen, false)}><YouTubeTranscript /></SideDrawer>
      <SideDrawer isOpen={isJSGeneratorOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="jsgen" title="JavaScript Generator" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsJSGeneratorOpen, false)}><JSConsoleGenerator /></SideDrawer>
      <SideDrawer isOpen={isChatBookOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="chatbook" title="Chat Book" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsChatBookOpen, false)}><ChatBookApp /></SideDrawer>
      <SideDrawer isOpen={isLargeTextOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="large" title="Text Chunker" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsLargeTextOpen, false)}><LargeTextChunks /></SideDrawer>
      <SideDrawer isOpen={isAsmrOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="asmr" title="ASMR Typeout" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsAsmrOpen, false)}><AsmrPromptDrawer /></SideDrawer>
      <SideDrawer isOpen={isChat2Open} isFullWidth={isFullWidth} stack={drawerStack} currentKey="chat2" title="Dual Chat" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsChat2Open, false)}><ChatGPTDual isOpen /></SideDrawer>
      <SideDrawer isOpen={isMarkdownViewerOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="markdown" title="Markdown Viewer" onToggleWidth={toggleWidth} onClose={() => setPanel(actions.setIsMarkdownViewerOpen, false)}><MarkdownViewer /></SideDrawer>

      <DownloadCopyTextFile />
      <TextSelectionTooltip
        onAskAI={(text) => {
          setPanel(actions.setIsChatOpen, true);
          dispatch(actions.setSelectedText(text));
        }}
        onSendToTTS={(text) => {
          dispatch(actions.setTtsText(text));
          setPanel(actions.setIsTTSOpen, true);
        }}
        onSendToTeleprompter={(text) => {
          dispatch(actions.setTeleprompterText(text));
          setPanel(actions.setIsTeleprompterOpen, true);
        }}
      />
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}
