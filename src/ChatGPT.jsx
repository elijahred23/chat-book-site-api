import { useEffect } from "react";
import AIChat from "./AIChat";
import { actions, useAppDispatch, useAppState } from "./context/AppContext";

const STORAGE_KEYS = {
  messages: "messages",
  suggestionGroup: "suggestionGroup",
  responseFormat: "chatResponseFormat",
  persistentContext: "chatPersistentContext",
};

export default function GptPromptComponent(props) {
  const dispatch = useAppDispatch();
  const { chatPrompt, selectedText } = useAppState();
  const setPromptText = (text) => dispatch(actions.setChatPrompt(text));

  useEffect(() => {
    if (selectedText) {
      dispatch(actions.setChatPrompt(selectedText));
    }
  }, [dispatch, selectedText]);

  return (
    <AIChat
      {...props}
      promptText={chatPrompt}
      setPromptText={setPromptText}
      storageKeys={STORAGE_KEYS}
    />
  );
}
