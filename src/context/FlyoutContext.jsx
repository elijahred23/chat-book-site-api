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
              borderColor: msg.type === "error" ? "#fca5a5" : "#bbf7d0",
              background: msg.type === "error"
                ? "linear-gradient(135deg, rgba(248,113,113,0.96), rgba(239,68,68,0.9))"
                : "linear-gradient(135deg, rgba(52,211,153,0.96), rgba(16,185,129,0.9))",
              boxShadow: msg.type === "error"
                ? "0 16px 32px rgba(239,68,68,0.3)"
                : "0 16px 32px rgba(16,185,129,0.25)",
            }}
          >
            <div style={styles.flyoutTitle}>{msg.type === "error" ? "Error" : "Success"}</div>
            <div style={styles.flyoutMsg}>{msg.message}</div>
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
    top: "16px",
    right: "20px",
    zIndex: 2147483647,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "400px",
  },
  flyout: {
    padding: "12px 16px",
    color: "#0b1220",
    borderRadius: "12px",
    boxShadow: "0 12px 36px rgba(0, 0, 0, 0.25)",
    fontSize: "15px",
    animation: "fadeSlide 0.35s ease-in-out",
    border: "1px solid",
    backdropFilter: "blur(12px)",
    display: "grid",
    gap: "4px",
  },
  flyoutTitle: {
    fontWeight: 800,
    fontSize: "0.9rem",
    letterSpacing: "0.02em",
    marginBottom: "2px",
  },
  flyoutMsg: {
    fontSize: "0.95rem",
    color: "#0b1220",
  },
};
