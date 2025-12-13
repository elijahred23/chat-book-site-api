import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
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
import ArchitectureDiagram from './ArchitectureDiagram.jsx';

function AppContent() {
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isPromptVisible, setIsPromptVisible] = useState(true);
  const [showFloatingBtns, setShowFloatingBtns] = useState(false);
  const floatingRef = useRef(null);
  const closeFabMenu = () => setShowFloatingBtns(false);
  const dispatch = useAppDispatch();
  const { isChatOpen, isTeleprompterOpen, isTTSOpen, isPlantUMLOpen, isPodcastTTSOpen, isJSGeneratorOpen, isChatBookOpen, isArchitectureOpen, isYouTubeOpen, isHtmlBuilderOpen, isTypingOpen } = useAppState();

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

  return (
    <>
      <h1>Eli Himi GPT</h1>

        {/* Dropdown Menu */}
        <div className="dropdown-nav">
          <button className="dropdown-toggle">Menu ▾</button>
          <div className="dropdown-menu">
            <NavLink to="/flashCards">Flash Cards</NavLink>
            <NavLink to="/Quran">Quran</NavLink>
            <NavLink to="/apiCheck">Settings</NavLink>
          </div>
        </div>

        <style>{`
          .fab-container {
            position: fixed;
            bottom: 16px;
            right: 16px;
            z-index: 12000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
          }
          .fab-main {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #2563eb, #60a5fa);
            color: #fff;
            font-size: 22px;
            box-shadow: 0 12px 30px rgba(37,99,235,0.35);
            cursor: pointer;
          }
          .fab-menu {
            display: flex;
            flex-direction: column;
            gap: 6px;
            background: rgba(15,23,42,0.92);
            padding: 8px;
            border-radius: 14px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.35);
            backdrop-filter: blur(8px);
          }
          .fab-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 12px;
            border: 1px solid #1f2937;
            background: #111827;
            color: #e2e8f0;
            cursor: pointer;
            min-width: 140px;
            font-size: 0.95rem;
            justify-content: flex-start;
          }
          .fab-btn span {
            font-size: 1.05rem;
          }
          @media (max-width: 540px) {
            .fab-btn {
              min-width: 120px;
            }
          }
        `}</style>
        <div className="fab-container" ref={floatingRef}>
          {showFloatingBtns && (
            <div className="fab-menu">
              <button onClick={()=>{dispatch(actions.setIsChatOpen(true)); closeFabMenu();}} className="fab-btn">
                <span>💬</span>{isChatOpen ? 'Chat Open' : 'Open Chat'}
              </button>
              <button onClick={() => {setIsTTSOpen(true); closeFabMenu();}} className="fab-btn">
                <span>🔊</span>{isTTSOpen ? 'TTS Open' : 'Open TTS'}
              </button>
              <button onClick={() => {setIsTeleprompterOpen(true); closeFabMenu();}} className="fab-btn">
                <span>📜</span>{isTeleprompterOpen ? 'Teleprompter' : 'Open Teleprompter'}
              </button>
              <button onClick={() => {setIsPlantUMLOpen(true); closeFabMenu();}} className="fab-btn">
                <span>🧩</span>{isPlantUMLOpen ? 'UML Viewer' : 'Open UML'}
              </button>
              <button onClick={() => {setPodcastTTSOpen(true); closeFabMenu();}} className="fab-btn">
                <span>🎙️</span>{isPodcastTTSOpen ? 'Podcast TTS' : 'Open Podcast'}
              </button>
              <button onClick={() => {dispatch(actions.setIsJSGeneratorOpen(true)); closeFabMenu();}} className="fab-btn">
                <span>💻</span>{isJSGeneratorOpen ? 'JS Generator' : 'Open JS Gen'}
              </button>
              <button onClick={() => {setIsYouTubeOpen(true); closeFabMenu();}} className="fab-btn">
                <span>🎞️</span>{isYouTubeOpen ? 'YT Transcript' : 'Open YT'}
              </button>
              <button onClick={() => {dispatch(actions.setIsChatBookOpen(true)); closeFabMenu();}} className="fab-btn">
                <span>📓</span>{isChatBookOpen ? 'Chat Book' : 'Open Chat Book'}
              </button>
              <button onClick={() => {setIsHtmlBuilderOpen(true); closeFabMenu();}} className="fab-btn">
                <span>🌐</span>{isHtmlBuilderOpen ? 'HTML Builder' : 'Open HTML'}
              </button>
              <button onClick={() => {setIsTypingOpen(true); closeFabMenu();}} className="fab-btn">
                <span>⌨️</span>{isTypingOpen ? 'Typing Test' : 'Open Typing'}
              </button>
              <button onClick={() => {setIsArchitectureOpen(true); closeFabMenu();}} className="fab-btn">
                <span>🗺️</span>{isArchitectureOpen ? 'Diagram Open' : 'Open Diagram'}
              </button>
            </div>
          )}
          <button onClick={() => setShowFloatingBtns((p) => !p)} className="fab-main">
            {showFloatingBtns ? '–' : '+'}
          </button>
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
          </Routes>
        </div>

        <div className={`chat-drawer ${isChatOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
            <div className="chat-drawer-header">
              <button className="close-chat-btn" onClick={() => dispatch(actions.setIsChatOpen(false))}>✖</button>
            </div>
            <GptPromptComponent
              isCollapsed={!isChatVisible}
              hidePrompt={!isPromptVisible}
              onClose={() => dispatch(actions.setIsChatOpen(false))}
              onToggleCollapse={() => setIsChatVisible((prev) => !prev)}
              onTogglePrompt={() => setIsPromptVisible((prev) => !prev)}
            />
          </div>

        {/* TTS Drawer */}
        <div className={`chat-drawer ${isTTSOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={toggleWidth}>
              {isFullWidth ? '↔ Half Width' : '↔ Full Width'}
            </button>
            <button className="close-chat-btn" onClick={() => setIsTTSOpen(false)}>✖</button>
          </div>
          <LoopingTTS />
        </div>

        {/* Teleprompter Drawer */}
        <div className={`chat-drawer ${isTeleprompterOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => setIsTeleprompterOpen(false)}>
              ✖ Close Teleprompter
            </button>
          </div>
          <Teleprompter />
        </div>

        {/* ✅ NEW PlantUML Drawer */}
        <div className={`chat-drawer ${isPlantUMLOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => setIsPlantUMLOpen(false)}>
              ✖ Close UML Viewer
            </button>
          </div>
          <PlantUMLViewer />
        </div>

        {/* ✅ NEW Podcast TTS Drawer */}
        <div className={`chat-drawer ${isPodcastTTSOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => setPodcastTTSOpen(false)}>
              ✖ Close Podcast TTS Player
            </button>
          </div>
          <PodcastTTSPlayer />
        </div>
        {/* HTML Builder Drawer */}
        <div className={`chat-drawer ${isHtmlBuilderOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => setIsHtmlBuilderOpen(false)}>
              ✖ Close HTML Builder
            </button>
          </div>
          <HtmlBuilder />
        </div>
        {/* Typing Test Drawer */}
        <div className={`chat-drawer ${isTypingOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => setIsTypingOpen(false)}>
              ✖ Close Typing Test
            </button>
          </div>
          <TypingTest />
        </div>
        {/* YouTube Transcript Drawer */}
        <div className={`chat-drawer ${isYouTubeOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => setIsYouTubeOpen(false)}>
              ✖ Close YouTube Transcript
            </button>
          </div>
          <YouTubeTranscript />
        </div>
        {/* New JS Console Generator Drawer */}
        <div className={`chat-drawer ${isJSGeneratorOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => dispatch(actions.setIsJSGeneratorOpen(false))}>
              ✖ Close JS Console Generator
            </button>
          </div>
          <JSConsoleGenerator />
        </div>
        {/* Chat Book Drawer */}
        <div className={`chat-drawer ${isChatBookOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => dispatch(actions.setIsChatBookOpen(false))}>
              ✖ Close Chat Book
            </button>
          </div>
          <ChatBookApp />
        </div>
        {/* Architecture Diagram Drawer */}
        <div className={`chat-drawer ${isArchitectureOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
          <div className="chat-drawer-header">
            <button className="width-toggle-btn" onClick={() => setIsArchitectureOpen(false)}>
              ✖ Close Architecture Diagram
            </button>
          </div>
          <ArchitectureDiagram />
        </div>
      

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
