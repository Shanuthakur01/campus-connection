import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { MatchProvider } from './context/MatchContext';
import { QuizProvider } from './context/QuizContext';
import './index.css';

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // You could send these errors to a monitoring service here
  // or take appropriate action based on the error type
});

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MessageProvider>
          <QuizProvider>
            <MatchProvider>
              <App />
            </MatchProvider>
          </QuizProvider>
        </MessageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
); 