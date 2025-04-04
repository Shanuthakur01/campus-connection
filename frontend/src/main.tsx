import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { MatchProvider } from './context/MatchContext.tsx'
import { MessageProvider } from './context/MessageContext.tsx'
import { QuizProvider } from './context/QuizContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MatchProvider>
          <MessageProvider>
            <QuizProvider>
              <App />
              <ToastContainer position="bottom-right" />
            </QuizProvider>
          </MessageProvider>
        </MatchProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)