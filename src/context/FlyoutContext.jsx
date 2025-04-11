import React, { createContext, useContext, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const FlyoutContext = createContext();

export const FlyoutProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const showMessage = useCallback(({ type = "success", message, duration = 3000 }) => {
    const id = uuidv4();
    const newMessage = { id, type, message };

    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, duration);
  }, []);

  return (
    <FlyoutContext.Provider value={{ showMessage }}>
      {children}
      <div style={styles.flyoutContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.flyout,
              backgroundColor: msg.type === "error" ? "#ff4d4f" : "#52c41a",
            }}
          >
            {msg.message}
          </div>
        ))}
      </div>
    </FlyoutContext.Provider>
  );
};

export const useFlyout = () => {
  const context = useContext(FlyoutContext);
  if (!context) {
    throw new Error("useFlyout must be used within a FlyoutProvider");
  }
  return context;
};

const styles = {
  flyoutContainer: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "400px",
  },
  flyout: {
    padding: "12px 20px",
    color: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    fontSize: "16px",
    animation: "fadeSlide 0.3s ease-in-out",
  },
};
