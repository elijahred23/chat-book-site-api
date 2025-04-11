import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { FlyoutProvider } from './context/FlyoutContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FlyoutProvider>
      <App />
    </FlyoutProvider>
  </React.StrictMode>,
)
