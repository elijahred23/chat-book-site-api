// context/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  copyText: '',
  htmlBuilder: {
    input: '',
    generatedHTML: ''
  },
  isChatOpen: false,
  chatPrompt: '',
  selectedText: '',
  ttsText: '',
  teleprompterText: '',
  transcriptTypes: ['internal', 'external'],
  selectedTranscriptType: 'internal',
  isTeleprompterOpen: false,
};

const actionTypes = {
  SET_COPY_TEXT: 'SET_COPY_TEXT',
  SET_HTML_INPUT: 'SET_HTML_INPUT',
  SET_GENERATED_HTML: 'SET_GENERATED_HTML',
  SET_IS_CHAT_OPEN: 'SET_IS_CHAT_OPEN',
  SET_CHAT_PROMPT: 'SET_CHAT_PROMPT',
  SET_SELECTED_TEXT: 'SET_SELECTED_TEXT',
  SET_TTS_TEXT: 'SET_TTS_TEXT',
  SET_TELEPROMPTER_TEXT: 'SET_TELEPROMPTER_TEXT',
  SET_SELECTED_TRANSCRIPT_TYPE: 'SET_SELECTED_TRANSCRIPT_TYPE',
  SET_IS_TELEPROMPTER_OPEN: 'SET_IS_TELEPROMPTER_OPEN',
};

function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_COPY_TEXT:
      return { ...state, copyText: action.payload };
    case actionTypes.SET_HTML_INPUT:
      return {
        ...state,
        htmlBuilder: { ...state.htmlBuilder, input: action.payload }
      };
    case actionTypes.SET_GENERATED_HTML:
      return {
        ...state,
        htmlBuilder: { ...state.htmlBuilder, generatedHTML: action.payload }
      };
    case actionTypes.SET_IS_CHAT_OPEN:
      return { ...state, isChatOpen: action.payload };
    case actionTypes.SET_CHAT_PROMPT:
      return { ...state, chatPrompt: action.payload };
    case actionTypes.SET_SELECTED_TEXT:
      return { ...state, selectedText: action.payload };
    case actionTypes.SET_TTS_TEXT:
      return { ...state, ttsText: action.payload };
    case actionTypes.SET_TELEPROMPTER_TEXT:
      return { ...state, teleprompterText: action.payload };
    case actionTypes.SET_SELECTED_TRANSCRIPT_TYPE:
      return { ...state, selectedTranscriptType: action.payload };
    case actionTypes.SET_IS_TELEPROMPTER_OPEN:
      return { ...state, isTeleprompterOpen: action.payload };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
}

const AppStateContext = createContext();
const AppDispatchContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);

export const actions = {
  setCopyText: (text) => ({ type: actionTypes.SET_COPY_TEXT, payload: text }),
  setHtmlInput: (input) => ({ type: actionTypes.SET_HTML_INPUT, payload: input }),
  setGeneratedHtml: (html) => ({ type: actionTypes.SET_GENERATED_HTML, payload: html }),
  setIsChatOpen: (open) => ({ type: actionTypes.SET_IS_CHAT_OPEN, payload: open }),
  setChatPrompt: (prompt) => ({ type: actionTypes.SET_CHAT_PROMPT, payload: prompt }),
  setSelectedText: (selectedText) => ({ type: actionTypes.SET_SELECTED_TEXT, payload: selectedText }),
  setTtsText: (ttsText) => ({ type: actionTypes.SET_TTS_TEXT, payload: ttsText }),
  setTeleprompterText: (text) => ({ type: actionTypes.SET_TELEPROMPTER_TEXT, payload: text }),
  setSelectedTranscriptType: (transcriptType) => ({
    type: actionTypes.SET_SELECTED_TRANSCRIPT_TYPE,
    payload: transcriptType,
  }),
  setIsTeleprompterOpen: (open) => ({ type: actionTypes.SET_IS_TELEPROMPTER_OPEN, payload: open }),
};
