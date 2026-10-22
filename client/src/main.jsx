import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import  GeneralContextProvider  from './context/GeneralContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GeneralContextProvider>
        <App />
      </GeneralContextProvider>
      <Toaster position="top-right" richColors closeButton expand={false} duration={4000} />
    </BrowserRouter>
  </StrictMode>,
)
