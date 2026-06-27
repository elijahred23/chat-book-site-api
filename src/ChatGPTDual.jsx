import { useEffect } from "react";
import AIChat from "./AIChat";
import { actions, useAppDispatch, useAppState } from "./context/AppContext";
import useLocalStorageState from "./hooks/useLocalStorageState";

const STORAGE_PREFIX = "chat2_dual_";
const STORAGE_KEYS = {
  messages: `${STORAGE_PREFIX}messages`,
  suggestionGroup: `${STORAGE_PREFIX}suggestionGroup`,
  responseFormat: `${STORAGE_PREFIX}responseFormat`,
  persistentContext: `${STORAGE_PREFIX}persistentContext`,
};

export default function ChatGPTDual(props) {
  const dispatch = useAppDispatch();
  const { chat2Prompt } = useAppState();
  const [promptText, setStoredPromptText] = useLocalStorageState(`${STORAGE_PREFIX}prompt`, "");
  const setPromptText = (text) => {
    setStoredPromptText(text);
    dispatch(actions.setChat2Prompt(text));
  };

  useEffect(() => {
    if (chat2Prompt !== undefined && chat2Prompt !== promptText) setStoredPromptText(chat2Prompt);
  }, [chat2Prompt, promptText, setStoredPromptText]);

  return (
    <AIChat
      {...props}
      promptText={promptText}
      setPromptText={setPromptText}
      storageKeys={STORAGE_KEYS}
      mode="dual"
      theme="green"
    />
  );
}
