import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  FaBookReader,
  FaCode,
  FaComments,
  FaGlobe,
  FaHeadphones,
  FaKeyboard,
  FaLayerGroup,
  FaMagic,
  FaMicrophoneAlt,
  FaPlus,
  FaProjectDiagram,
  FaScroll,
  FaTimes,
  FaVolumeUp,
  FaYoutube,
} from 'react-icons/fa';
import { GiNotebook } from 'react-icons/gi';
import { SiMarkdown } from 'react-icons/si';
import ApiCheck from './ApiCheck';
import ProgressBar from './ui/ProgressBar';
import ChatTemplate from './ChatTemplate';
import YouTubeTranscript from './YouTubeTranscript';
import Wiki from './Wiki';
import GptPromptComponent from './ChatGPT';
import TextSelectionTooltip from './TextSelectionTooltip';
import DownloadCopyTextFile from './DownloadCopyTextFile.jsx';
import HtmlBuilder from './HtmlBuilder';
import WebBrowser from './WebBrowser.jsx';
import { useAppDispatch, useAppState, actions } from './context/AppContext.jsx';
import Quran from './Quran.jsx';
import TypingTest from './TypingText.jsx';
import LoopingTTS from './LoopingTTS.jsx';
import Teleprompter from './Teleprompter.jsx';
import FlashCardApp from './FlashCardApp.jsx';
import PlantUMLViewer from './PlantUML.jsx';
import PodcastTTSPlayer from './PodcastTTSPlayer.jsx';
import JSConsoleGenerator from './JSConsoleGenerator.jsx';
import ChatBookApp from './ChatBookApp.jsx';
import SideDrawer from './ui/SideDrawer.jsx';
import BengaliTutor from './BengaliTutor.jsx';
import CodingProblems from './CodingProblems.jsx';
import SystemDesignPrep from './SystemDesignPrep.jsx';
import IframeDrawer from './IframeDrawer.jsx';
import StockMarketGame from './StockMarketGame.jsx';
import PdfToText from './PdfToText.jsx';
import RegexTrainer from './RegexTrainer.jsx';
import ChatGPTDual from './ChatGPTDual.jsx';
import LargeTextChunks from './LargeTextChunks.jsx';
import GuitarTabs from './GuitarTabs.jsx';
import AsmrPromptDrawer from './AsmrPromptDrawer.jsx';
import ActionButtonStudio from './ActionButtonStudio.jsx';
import MediaPlayer from './MediaPlayer.jsx';
import CustomPromptsDrawer from './CustomPromptsDrawer.jsx';
import MarkdownViewer from './MarkdownViewer.jsx';

function AppContent() {
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isPromptVisible, setIsPromptVisible] = useState(true);
  const [showFloatingBtns, setShowFloatingBtns] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const floatingRef = useRef(null);
  const menuRef = useRef(null);
  const closeFabMenu = () => setShowFloatingBtns(false);
  const dispatch = useAppDispatch();
  const { isChat2Open, drawerStack, isChatOpen, isTeleprompterOpen, isTTSOpen, isPlantUMLOpen, isPodcastTTSOpen, isJSGeneratorOpen, isChatBookOpen, isArchitectureOpen, isYouTubeOpen, isHtmlBuilderOpen, isTypingOpen, isIframeOpen, isLargeTextOpen, isAsmrOpen, isCustomPromptsOpen, isMarkdownViewerOpen} = useAppState();

  const toggleChat = () => dispatch(actions.setIsChatOpen(false));
  const toggleWidth = () => setIsFullWidth((p) => !p);
  const setIsTeleprompterOpen = (val) => dispatch(actions.setIsTeleprompterOpen(val));
  const setIsTTSOpen = (val) => dispatch(actions.setIsTTSOpen(val));
  const setIsPlantUMLOpen = (val) => dispatch(actions.setIsPlantUMLOpen(val)); // ✅ NEW
  const setPodcastTTSOpen = (val) => dispatch(actions.setIsPodcastTTSOpen(val)); // ✅ NEW
  const setIsArchitectureOpen = (val) => dispatch(actions.setIsArchitectureOpen(val));
  const setIsYouTubeOpen = (val) => dispatch(actions.setIsYouTubeOpen(val));
  const setIsHtmlBuilderOpen = (val) => dispatch(actions.setIsHtmlBuilderOpen(val));
  const setIsTypingOpen = (val) => dispatch(actions.setIsTypingOpen(val));
  const setIsIframeOpen = (val) => dispatch(actions.setIsIframeOpen(val));
  const setIsLargeTextOpen = (val) => dispatch(actions.setIsLargeTextOpen(val));
  const setIsAsmrOpen = (val) => dispatch(actions.setIsAsmrOpen(val));
  const setIsCustomPromptsOpen = (val) => dispatch(actions.setIsCustomPromptsOpen(val));
  const setIsMarkdownViewerOpen = (val) => dispatch(actions.setIsMarkdownViewerOpen(val));


  useEffect(() => {
    const savedText = localStorage.getItem('selectedText');
    if (savedText) dispatch(actions.setSelectedText(savedText));
  }, []);

  useEffect(() => {
    if (!showFloatingBtns) return;
    const handleClickOutside = (e) => {
      if (floatingRef.current && !floatingRef.current.contains(e.target)) {
        setShowFloatingBtns(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showFloatingBtns]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  const anyDrawerOpen =
    Boolean(drawerStack?.length) ||
    isChatOpen ||
    isTTSOpen ||
    isTeleprompterOpen ||
    isPlantUMLOpen ||
    isPodcastTTSOpen ||
    isJSGeneratorOpen ||
    isChatBookOpen ||
    isArchitectureOpen ||
    isYouTubeOpen ||
    isHtmlBuilderOpen ||
    isTypingOpen ||
    isIframeOpen ||
    isLargeTextOpen ||
    isAsmrOpen ||
    isCustomPromptsOpen ||
    isMarkdownViewerOpen;

  const floatingTools = [
    {
      label: isChatOpen ? 'Chat Open' : 'Open Chat',
      icon: FaComments,
      active: isChatOpen,
      action: () => dispatch(actions.setIsChatOpen(true)),
    },
    {
      label: 'Open Chat Two',
      icon: FaComments,
      active: isChat2Open,
      action: () => dispatch(actions.setIsChat2Open(true)),
    },
    {
      label: isTTSOpen ? 'TTS Open' : 'Open TTS',
      icon: FaVolumeUp,
      active: isTTSOpen,
      action: () => setIsTTSOpen(true),
    },
    {
      label: isTeleprompterOpen ? 'Teleprompter' : 'Open Teleprompter',
      icon: FaScroll,
      active: isTeleprompterOpen,
      action: () => setIsTeleprompterOpen(true),
    },
    {
      label: isPlantUMLOpen ? 'UML Viewer' : 'Open UML',
      icon: FaProjectDiagram,
      active: isPlantUMLOpen,
      action: () => setIsPlantUMLOpen(true),
    },
    {
      label: isPodcastTTSOpen ? 'Podcast TTS' : 'Open Podcast',
      icon: FaMicrophoneAlt,
      active: isPodcastTTSOpen,
      action: () => setPodcastTTSOpen(true),
    },
    {
      label: isJSGeneratorOpen ? 'JS Generator' : 'Open JS Gen',
      icon: FaMagic,
      active: isJSGeneratorOpen,
      action: () => dispatch(actions.setIsJSGeneratorOpen(true)),
    },
    {
      label: isYouTubeOpen ? 'YT Transcript' : 'Open YT',
      icon: FaYoutube,
      active: isYouTubeOpen,
      action: () => setIsYouTubeOpen(true),
    },
    {
      label: isChatBookOpen ? 'Chat Book' : 'Open Chat Book',
      icon: GiNotebook,
      active: isChatBookOpen,
      action: () => dispatch(actions.setIsChatBookOpen(true)),
    },
    {
      label: isHtmlBuilderOpen ? 'HTML Builder' : 'Open HTML',
      icon: FaCode,
      active: isHtmlBuilderOpen,
      action: () => setIsHtmlBuilderOpen(true),
    },
    {
      label: isTypingOpen ? 'Typing Test' : 'Open Typing',
      icon: FaKeyboard,
      active: isTypingOpen,
      action: () => setIsTypingOpen(true),
    },
    {
      label: isIframeOpen ? 'Iframe Viewer' : 'Open Iframe',
      icon: FaGlobe,
      active: isIframeOpen,
      action: () => setIsIframeOpen(true),
    },
    {
      label: isLargeTextOpen ? 'Text Chunker' : 'Open Chunker',
      icon: FaBookReader,
      active: isLargeTextOpen,
      action: () => setIsLargeTextOpen(true),
    },
    {
      label: isAsmrOpen ? 'ASMR Typeout' : 'Open ASMR',
      icon: FaHeadphones,
      active: isAsmrOpen,
      action: () => setIsAsmrOpen(true),
    },
    {
      label: isMarkdownViewerOpen ? 'Markdown Viewer' : 'Open Markdown',
      icon: SiMarkdown,
      active: isMarkdownViewerOpen,
      action: () => setIsMarkdownViewerOpen(true),
    },
    {
      label: isCustomPromptsOpen ? 'Shortcuts' : 'Open Shortcuts',
      icon: FaLayerGroup,
      active: isCustomPromptsOpen,
      action: () => setIsCustomPromptsOpen(true),
    },
  ];

  return (
    <>
      {!anyDrawerOpen && (
        <div className="app-topbar">
          <h1 className="app-title">Eli Himi GPT</h1>

          {/* Dropdown Menu */}
          <div className="dropdown-nav" ref={menuRef}>
            <button
              className="dropdown-toggle"
              type="button"
              onClick={() => setIsMenuOpen((p) => !p)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              Menu <span className="dropdown-caret">▾</span>
            </button>
            {isMenuOpen && (
              <div className="dropdown-menu" role="menu" aria-label="Main menu">
                <NavLink to="/flashCards" role="menuitem" onClick={() => setIsMenuOpen(false)}>Flash Cards</NavLink>
                <NavLink to="/Quran" role="menuitem" onClick={() => setIsMenuOpen(false)}>Quran</NavLink>
                <NavLink to="/bengali" role="menuitem" onClick={() => setIsMenuOpen(false)}>Bengali Tutor</NavLink>
                <NavLink to="/coding" role="menuitem" onClick={() => setIsMenuOpen(false)}>Coding Problems</NavLink>
                <NavLink to="/system-design" role="menuitem" onClick={() => setIsMenuOpen(false)}>System Design Prep</NavLink>
                <NavLink to="/guitar-tabs" role="menuitem" onClick={() => setIsMenuOpen(false)}>Guitar Tabs</NavLink>
                <NavLink to="/market-sim" role="menuitem" onClick={() => setIsMenuOpen(false)}>Stock Market Game</NavLink>
                <NavLink to="/pdf-to-text" role="menuitem" onClick={() => setIsMenuOpen(false)}>PDF to Text</NavLink>
                <NavLink to="/regex" role="menuitem" onClick={() => setIsMenuOpen(false)}>Regex Trainer</NavLink>
                <NavLink to="/media-player" role="menuitem" onClick={() => setIsMenuOpen(false)}>Media Player</NavLink>
                <NavLink to="/action-buttons-studio" role="menuitem" onClick={() => setIsMenuOpen(false)}>Action Button Studio</NavLink>
                <button 
                  onClick={() => { setIsMarkdownViewerOpen(true); setIsMenuOpen(false); }}
                  style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', padding: '10px 12px', fontWeight: 800, color: '#0f172a', width: '100%', borderRadius: '12px' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Markdown Viewer
                </button>
                <button 
                  onClick={() => { setIsCustomPromptsOpen(true); setIsMenuOpen(false); }}
                  style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', padding: '10px 12px', fontWeight: 800, color: '#0f172a', width: '100%', borderRadius: '12px' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Shortcut Manager
                </button>
                <NavLink to="/apiCheck" role="menuitem" onClick={() => setIsMenuOpen(false)}>Settings</NavLink>
              </div>
            )}
          </div>
        </div>
      )}

        <style>{`
          .app-topbar {
            position: sticky;
            top: 0;
            z-index: 15000;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
            flex-wrap: nowrap;
            padding: 10px 12px;
            margin-bottom: 10px;
            background: rgba(248, 250, 252, 0.88);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          }
          .app-title {
            margin: 0;
            font-size: 1.15rem;
            letter-spacing: -0.02em;
            color: #0f172a;
            white-space: nowrap;
            flex: 1;
            min-width: 0;
          }
          .dropdown-nav {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: flex-end;
            margin-left: auto;
          }
          .dropdown-toggle {
            appearance: none;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            color: #0f172a;
            font-weight: 800;
            border-radius: 999px;
            padding: 10px 12px;
            min-height: 42px;
            cursor: pointer;
            box-shadow: 0 10px 22px rgba(15, 23, 42, 0.10);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            line-height: 1;
          }
          .dropdown-toggle:active {
            transform: translateY(1px);
          }
          .dropdown-toggle:focus {
            outline: 3px solid rgba(59, 130, 246, 0.35);
            outline-offset: 2px;
          }
          .dropdown-caret {
            opacity: 0.75;
            transform: translateY(1px);
          }
          .dropdown-menu {
            position: fixed;
            left: auto;
            right: 12px;
            top: 58px;
            width: min(360px, calc(100vw - 24px));
            max-height: calc(100vh - 88px);
            overflow: auto;
            -webkit-overflow-scrolling: touch;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.95);
            border-radius: 16px;
            padding: 8px;
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
            display: grid;
            gap: 6px;
          }
          .dropdown-menu a {
            text-decoration: none;
            color: #0f172a;
            font-weight: 800;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid transparent;
            background: transparent;
          }
          .dropdown-menu a:hover {
            background: #f8fafc;
            border-color: #e2e8f0;
          }
          .dropdown-menu a.active {
            background: linear-gradient(135deg, #e0f2fe, #eef2ff);
            border-color: #93c5fd;
            color: #0f172a;
          }

          .fab-container {
            position: fixed;
            right: max(16px, env(safe-area-inset-right));
            bottom: max(16px, env(safe-area-inset-bottom));
            z-index: 12000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
            pointer-events: none;
          }
          .fab-main {
            pointer-events: auto;
            width: 58px;
            height: 58px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.72);
            background:
              radial-gradient(circle at 30% 20%, rgba(255,255,255,0.38), transparent 32%),
              linear-gradient(135deg, #0f172a, #2563eb 52%, #0f766e);
            color: #fff;
            font-size: 18px;
            box-shadow: 0 18px 42px rgba(15, 23, 42, 0.34);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
          }
          .fab-main:hover {
            transform: translateY(-2px);
            box-shadow: 0 22px 50px rgba(15, 23, 42, 0.4);
            filter: saturate(1.08);
          }
          .fab-main:active {
            transform: translateY(0) scale(0.98);
          }
          .fab-main:focus-visible,
          .fab-btn:focus-visible {
            outline: 3px solid rgba(14, 165, 233, 0.34);
            outline-offset: 3px;
          }
          .fab-menu {
            pointer-events: auto;
            width: min(360px, calc(100vw - 32px));
            max-height: min(560px, calc(100vh - 112px));
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            background: rgba(255, 255, 255, 0.88);
            border: 1px solid rgba(226, 232, 240, 0.95);
            padding: 10px;
            border-radius: 18px;
            box-shadow: 0 22px 60px rgba(15, 23, 42, 0.26);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 transparent;
          }
          .fab-menu::-webkit-scrollbar {
            width: 9px;
          }
          .fab-menu::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border: 3px solid transparent;
            border-radius: 999px;
            background-clip: padding-box;
          }
          .fab-menu::-webkit-scrollbar-track {
            background: transparent;
          }
          .fab-btn {
            min-width: 0;
            min-height: 54px;
            display: grid;
            grid-template-columns: 34px minmax(0, 1fr);
            align-items: center;
            gap: 10px;
            padding: 9px 10px;
            border-radius: 14px;
            border: 1px solid rgba(203, 213, 225, 0.95);
            background: rgba(248, 250, 252, 0.9);
            color: #0f172a;
            cursor: pointer;
            font: inherit;
            font-size: 0.88rem;
            font-weight: 850;
            line-height: 1.12;
            text-align: left;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
            transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
          }
          .fab-btn:hover {
            transform: translateY(-1px);
            background: #ffffff;
            border-color: #38bdf8;
            box-shadow: 0 12px 26px rgba(15, 23, 42, 0.14);
          }
          .fab-btn.active {
            background: #0f172a;
            border-color: #0f172a;
            color: #ffffff;
          }
          .fab-btn-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #e0f2fe, #ccfbf1);
            color: #0f172a;
          }
          .fab-btn.active .fab-btn-icon {
            background: rgba(255, 255, 255, 0.14);
            color: #ffffff;
          }
          .fab-btn-label {
            min-width: 0;
            overflow-wrap: anywhere;
          }
          @media (max-width: 540px) {
            .app-topbar {
              padding: 10px;
            }
            .app-title {
              font-size: 1.05rem;
              max-width: 55vw;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .dropdown-toggle {
              padding: 10px 12px;
              min-height: 44px;
            }
            .dropdown-menu { left: 10px; right: 10px; width: auto; top: 60px; }
            .dropdown-menu a {
              padding: 12px 12px;
            }
            .fab-container {
              left: max(10px, env(safe-area-inset-left));
              right: max(10px, env(safe-area-inset-right));
              bottom: max(12px, env(safe-area-inset-bottom));
              align-items: stretch;
            }
            .fab-menu {
              width: auto;
              max-height: min(62vh, 520px);
              grid-template-columns: minmax(0, 1fr);
              padding: 8px;
              border-radius: 16px;
            }
            .fab-btn {
              min-height: 50px;
              grid-template-columns: 32px minmax(0, 1fr);
              padding: 8px 10px;
            }
            .fab-btn-icon {
              width: 32px;
              height: 32px;
              border-radius: 10px;
            }
            .fab-main {
              align-self: flex-end;
              width: 56px;
              height: 56px;
            }
          }
        `}</style>
        <div className="fab-container" ref={floatingRef}>
          {showFloatingBtns && (
            <div className="fab-menu" role="menu" aria-label="Quick tools">
              {floatingTools.map(({ label, icon: Icon, active, action }) => (
                <button
                  key={label}
                  onClick={() => {
                    action();
                    closeFabMenu();
                  }}
                  className={`fab-btn ${active ? "active" : ""}`}
                  type="button"
                  role="menuitem"
                >
                  <span className="fab-btn-icon" aria-hidden="true">
                    <Icon size={15} />
                  </span>
                  <span className="fab-btn-label">{label}</span>
                </button>
              ))}
            </div>
          )}
          {
            !isAsmrOpen && 
          <button
            onClick={() => setShowFloatingBtns((p) => !p)}
            className="fab-main"
            type="button"
            aria-label={showFloatingBtns ? "Close quick tools" : "Open quick tools"}
            aria-expanded={showFloatingBtns}
          >
            {showFloatingBtns ? <FaTimes size={18} /> : <FaPlus size={18} />}
          </button>
          }
        </div>

        <div className="content">
          <Routes>
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
            <Route path="/youTubeTranscript" element={<YouTubeTranscript />} />
            <Route path="/bengali" element={<BengaliTutor />} />
            <Route path="/coding" element={<CodingProblems />} />
            <Route path="/system-design" element={<SystemDesignPrep />} />
            <Route path="/guitar-tabs" element={<GuitarTabs />} />
            <Route path="/market-sim" element={<StockMarketGame />} />
            <Route path="/pdf-to-text" element={<PdfToText />} />
            <Route path="/regex" element={<RegexTrainer />} />
            <Route path="/media-player" element={<MediaPlayer />} />
            <Route path="/action-buttons-studio" element={<ActionButtonStudio />} />
            <Route path="/markdown-viewer" element={<MarkdownViewer />} />
          </Routes>
        </div>

        <SideDrawer
          isOpen={isChatOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="chat"
          onClose={() => dispatch(actions.setIsChatOpen(false))}
          closeLabel="✖"
        >
          <GptPromptComponent
            isOpen={isChatOpen}
            isCollapsed={!isChatVisible}
            hidePrompt={!isPromptVisible}
            onClose={() => dispatch(actions.setIsChatOpen(false))}
            onToggleCollapse={() => setIsChatVisible((prev) => !prev)}
            onTogglePrompt={() => setIsPromptVisible((prev) => !prev)}
          />
        </SideDrawer>

        <SideDrawer
          isOpen={isIframeOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="iframe"
          onToggleWidth={toggleWidth}
          onClose={() => setIsIframeOpen(false)}
          closeLabel="✖ Close Iframe Viewer"
        >
          <IframeDrawer />
        </SideDrawer>

        <SideDrawer
          isOpen={isTTSOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="tts"
          onToggleWidth={toggleWidth}
          onClose={() => setIsTTSOpen(false)}
          closeLabel="✖"
        >
          <LoopingTTS />
        </SideDrawer>

        <SideDrawer
          isOpen={isTeleprompterOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="teleprompter"
          onToggleWidth={toggleWidth}
          onClose={() => setIsTeleprompterOpen(false)}
          closeLabel="✖ Close Teleprompter"
        >
          <Teleprompter />
        </SideDrawer>

        <SideDrawer
          isOpen={isPlantUMLOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="plantuml"
          onToggleWidth={toggleWidth}
          onClose={() => setIsPlantUMLOpen(false)}
          closeLabel="✖ Close UML Viewer"
        >
          <PlantUMLViewer />
        </SideDrawer>

        <SideDrawer
          isOpen={isPodcastTTSOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="podcast"
          onToggleWidth={toggleWidth}
          onClose={() => setPodcastTTSOpen(false)}
          closeLabel="✖ Close Podcast TTS Player"
        >
          <PodcastTTSPlayer />
        </SideDrawer>

        <SideDrawer
          isOpen={isHtmlBuilderOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="html"
          onToggleWidth={toggleWidth}
          onClose={() => setIsHtmlBuilderOpen(false)}
          closeLabel="✖ Close HTML Builder"
        >
          <HtmlBuilder />
        </SideDrawer>

        <SideDrawer
          isOpen={isTypingOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="typing"
          onToggleWidth={toggleWidth}
          onClose={() => setIsTypingOpen(false)}
          closeLabel="✖ Close Typing Test"
        >
          <TypingTest />
        </SideDrawer>

        <SideDrawer
          isOpen={isYouTubeOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="youtube"
          onToggleWidth={toggleWidth}
          onClose={() => setIsYouTubeOpen(false)}
          closeLabel="✖ Close YouTube Transcript"
        >
          <YouTubeTranscript />
        </SideDrawer>

        <SideDrawer
          isOpen={isJSGeneratorOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="jsgen"
          onToggleWidth={toggleWidth}
          onClose={() => dispatch(actions.setIsJSGeneratorOpen(false))}
          closeLabel="✖ Close JS Console Generator"
        >
          <JSConsoleGenerator />
        </SideDrawer>

        <SideDrawer
          isOpen={isChatBookOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="chatbook"
          onToggleWidth={toggleWidth}
          onClose={() => dispatch(actions.setIsChatBookOpen(false))}
          closeLabel="✖ Close Chat Book"
        >
          <ChatBookApp />
        </SideDrawer>

        <SideDrawer
          isOpen={isLargeTextOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="large"
          onToggleWidth={toggleWidth}
          onClose={() => setIsLargeTextOpen(false)}
          closeLabel="✖ Close ActionButton Chunker"
        >
          <LargeTextChunks />
        </SideDrawer>

        <SideDrawer
          isOpen={isAsmrOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="asmr"
          onToggleWidth={toggleWidth}
          onClose={() => setIsAsmrOpen(false)}
          closeLabel="✖ Close ASMR Typeout"
        >
          <AsmrPromptDrawer />
        </SideDrawer>

        <SideDrawer
          isOpen={isChat2Open}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="chat2"
          onToggleWidth={toggleWidth}
          onClose={() => dispatch(actions.setIsChat2Open(false))}
          closeLabel="✖ Close Chat 2"
        >
          <ChatGPTDual isOpen={true} />
        </SideDrawer>

        <SideDrawer
          isOpen={isMarkdownViewerOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="markdown"
          onToggleWidth={toggleWidth}
          onClose={() => setIsMarkdownViewerOpen(false)}
          closeLabel="✖ Close Markdown Viewer"
        >
          <MarkdownViewer />
        </SideDrawer>

        <SideDrawer
          isOpen={isCustomPromptsOpen}
          isFullWidth={isFullWidth}
          stack={drawerStack}
          currentKey="custom"
          onToggleWidth={toggleWidth}
          onClose={() => setIsCustomPromptsOpen(false)}
          closeLabel="✖ Close Shortcut Manager"
        >
          <CustomPromptsDrawer />
        </SideDrawer>
      

      <DownloadCopyTextFile />
      <TextSelectionTooltip
        onAskAI={(text) => {
          dispatch(actions.setIsChatOpen(true));
          dispatch(actions.setSelectedText(text));
        }}
        onSendToTTS={(text) => {
          dispatch(actions.setTtsText(text));
          setIsTTSOpen(true);
        }}
        onSendToTeleprompter={(text) => {
          dispatch(actions.setTeleprompterText(text));
          setIsTeleprompterOpen(true);
        }}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
