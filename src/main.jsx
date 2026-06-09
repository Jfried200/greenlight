import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Greenlight from './greenlight.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Greenlight />
  </StrictMode>
)
