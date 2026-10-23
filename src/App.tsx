import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreLayout } from './components/layout/StoreLayout'
import CarritoPage from './pages/carrito/CarritoPage'
import CategoriasPage from './pages/categorias/CategoriasPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import ContactoPage from './pages/contacto/ContactoPage'
import CuponesPage from './pages/cupones/CuponesPage'
import DetalleProductoPage from './pages/detalleproducto/DetalleProductoPage'
import FavoritosPage from './pages/favoritos/FavoritosPage'
import InicioPage from './pages/inicio/InicioPage'
import MiCuentaPage from './pages/micuenta/MiCuentaPage'
import NoEncontradoPage from './pages/notfound/NoEncontradoPage'
import PedidosPage from './pages/pedidos/PedidosPage'
import ProductosPage from './pages/productos/ProductosPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="categoria/:slug" element={<CategoriasPage />} />
          <Route path="producto/:id" element={<DetalleProductoPage />} />
          <Route path="carrito" element={<CarritoPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="mi-cuenta" element={<MiCuentaPage />} />
          <Route path="favoritos" element={<FavoritosPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="contacto" element={<ContactoPage />} />
          <Route path="cupones" element={<CuponesPage />} />
          <Route path="404" element={<NoEncontradoPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
