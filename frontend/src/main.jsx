import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { QRProvider } from './context/QRContext'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QRProvider>
        <App />
      </QRProvider>
    </BrowserRouter>
  </React.StrictMode>
)
