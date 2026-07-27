/* eslint-disable react/prop-types */
import { useState } from "react";
import BengaliCharacterBreakdown from "../components/bengali/BengaliCharacterBreakdown.jsx";
import ChatBookApp from "../components/chat/ChatBookApp.jsx";
import ChatGPTDual from "../components/chat/ChatGPTDual.jsx";
import GptPromptComponent from "../components/chat/ChatGPT.jsx";
import DownloadCopyTextFile from "../components/common/DownloadCopyTextFile.jsx";
import LargeTextChunks from "../components/common/LargeTextChunks.jsx";
import TextSelectionTooltip from "../components/common/TextSelectionTooltip.jsx";
import HtmlBuilder from "../components/html/HtmlBuilder.jsx";
import IframeDrawer from "../components/iframe/IframeDrawer.jsx";
import MarkdownViewer from "../components/markdown/MarkdownViewer.jsx";
import PlantUMLViewer from "../components/plantuml/PlantUML.jsx";
import Teleprompter from "../components/text/Teleprompter.jsx";
import TypingTest from "../components/text/TypingText.jsx";
import LoopingTTS from "../components/tts/LoopingTTS.jsx";
import YouTubeTranscript from "../components/youtube/YouTubeTranscript.jsx";
import { actions, useAppDispatch } from "../context/AppContext.jsx";
import SideDrawer from "../ui/SideDrawer.jsx";

export default function AppDrawers({ state, isFullWidth, onToggleWidth, setPanel }) {
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isPromptVisible, setIsPromptVisible] = useState(true);
  const dispatch = useAppDispatch();
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
    isBengaliBreakdownOpen,
  } = state;

  return (
    <>
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

      <SideDrawer isOpen={isIframeOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="iframe" title="Iframe Viewer" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsIframeOpen, false)}><IframeDrawer /></SideDrawer>
      <SideDrawer isOpen={isTTSOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="tts" title="Text to Speech" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsTTSOpen, false)}><LoopingTTS /></SideDrawer>
      <SideDrawer isOpen={isTeleprompterOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="teleprompter" title="Teleprompter" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsTeleprompterOpen, false)}><Teleprompter /></SideDrawer>
      <SideDrawer isOpen={isPlantUMLOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="plantuml" title="PlantUML Viewer" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsPlantUMLOpen, false)}><PlantUMLViewer /></SideDrawer>
      <SideDrawer isOpen={isHtmlBuilderOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="html" title="HTML Builder" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsHtmlBuilderOpen, false)}><HtmlBuilder /></SideDrawer>
      <SideDrawer isOpen={isTypingOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="typing" title="Typing Test" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsTypingOpen, false)}><TypingTest /></SideDrawer>
      <SideDrawer isOpen={isYouTubeOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="youtube" title="YouTube Transcript" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsYouTubeOpen, false)}><YouTubeTranscript /></SideDrawer>
      <SideDrawer isOpen={isChatBookOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="chatbook" title="Chat Book" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsChatBookOpen, false)}><ChatBookApp /></SideDrawer>
      <SideDrawer isOpen={isLargeTextOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="large" title="Text Chunker" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsLargeTextOpen, false)}><LargeTextChunks /></SideDrawer>
      <SideDrawer isOpen={isChat2Open} isFullWidth={isFullWidth} stack={drawerStack} currentKey="chat2" title="Dual Chat" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsChat2Open, false)}><ChatGPTDual isOpen /></SideDrawer>
      <SideDrawer isOpen={isMarkdownViewerOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="markdown" title="Markdown Viewer" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsMarkdownViewerOpen, false)}><MarkdownViewer /></SideDrawer>
      <SideDrawer isOpen={isBengaliBreakdownOpen} isFullWidth={isFullWidth} stack={drawerStack} currentKey="bengaliBreakdown" title="Bengali Breakdown" onToggleWidth={onToggleWidth} onClose={() => setPanel(actions.setIsBengaliBreakdownOpen, false)}><BengaliCharacterBreakdown /></SideDrawer>

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
    </>
  );
}
