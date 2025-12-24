import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/ThemeProvider'
import Welcome from './pages/Welcome'
import Nombre from './pages/Nombre'
import Menu from './pages/Menu'
import Pago from './pages/Pago'
import Factura from './pages/Factura'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Welcome />,
  },
  {
    path: "/mesa/:qrToken",
    element: <Nombre />,
  },
  {
    path: "/menu",
    element: <Menu />,
  },
  {
    path: "/pago",
    element: <Pago />,
  },
  {
    path: "/factura",
    element: <Factura />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="piru-ui-theme">
      <RouterProvider router={router} />
      <Toaster 
        position="top-center"
        richColors
        closeButton
      />
    </ThemeProvider>
  </StrictMode>,
)
