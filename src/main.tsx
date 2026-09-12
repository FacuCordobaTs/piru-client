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
import MenuDelivery from './pages/MenuDelivery'
import SuccessDelivery from './pages/SuccessDelivery'
import SuccessGrupal from './pages/SuccessGrupal'
import PedidoStatus from './pages/PedidoStatus'
import { TrackingBootstrap } from './components/TrackingBootstrap'
import { CampanaLinkResolver, RecetaLinkResolver } from './pages/MarketingLinkResolver'

const rutas = [
  {
    path: "/",
    element: <Welcome />,
  },
  {
    path: "/mesa/:qrToken",
    element: <Nombre />,
  },
  {
    path: "/sala/:qrToken/nombre",
    element: <Nombre />,
  },
  {
    path: "/sala/:qrToken",
    element: <Menu />,
  },
  {
    path: "/sala/:qrToken/success",
    element: <SuccessGrupal />,
  },
  {
    path: "/pedido/:id",
    element: <PedidoStatus />,
  },
  // Deben estar antes de /:username, que es la ruta genérica de tienda.
  {
    path: "/:username/c/:slug",
    element: <CampanaLinkResolver />,
  },
  {
    path: "/:username/r/:token",
    element: <RecetaLinkResolver />,
  },
  {
    path: "/:username",
    element: <MenuDelivery />,
  },
  {
    path: "/:username/success",
    element: <SuccessDelivery />,
  },
]

const router = createBrowserRouter([{ element: <TrackingBootstrap />, children: rutas }])

if (window.location.hostname === 'piru.app' && window.location.pathname === '/') {
  window.location.replace('https://info.piru.app')
} else {
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
}
