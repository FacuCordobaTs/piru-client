import { StrictMode, lazy } from 'react'
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
import CheckoutPaginas from './pages/CheckoutPaginas'
import { storeSlugFromHostname } from './lib/store-domain'
import { getStoreSite } from './store-sites/registry'

// Sólo en desarrollo: una tienda inventada para mirar las plantillas (`/_ejemplo?plantilla=moderna`).
const EjemploTienda = import.meta.env.DEV ? lazy(() => import('./pages/EjemploTienda')) : null

/**
 * `<tienda>.piru.app` es una tienda: la portada es la tienda misma, con su diseño propio si está
 * registrado en `store-sites/registry.ts` o con la plantilla estándar si no. `my.piru.app` conserva
 * la portada de Piru y las tiendas bajo `/:username`.
 */
const domainSlug = storeSlugFromHostname(window.location.hostname)
const site = getStoreSite(domainSlug)
if (site?.loadingBackground) document.documentElement.style.backgroundColor = site.loadingBackground

const rutas = [
  ...(EjemploTienda ? [{ path: "/_ejemplo", element: <EjemploTienda /> }] : []),
  {
    path: "/",
    element: domainSlug ? <MenuDelivery /> : <Welcome />,
  },
  ...(domainSlug
    ? [
        { path: "/success", element: <SuccessDelivery /> },
        { path: "/c/:slug", element: <CampanaLinkResolver /> },
        { path: "/r/:token", element: <RecetaLinkResolver /> },
      ]
    : []),
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
  // Checkout de un sitio de Páginas (docs/PAGINAS_PROPIAS.md, §9).
  {
    path: "/:username/checkout",
    element: <CheckoutPaginas />,
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
