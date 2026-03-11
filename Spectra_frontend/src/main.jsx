import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
   
    <GoogleOAuthProvider clientId="759916802366-6u7tb9b095h0ussir3s33diasn99kaq0.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)