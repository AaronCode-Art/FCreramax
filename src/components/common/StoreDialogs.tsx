import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { ConfirmDialog } from './ConfirmDialog'

/** Diálogos globales: confirmar antes de quitar de favoritos y elegir el siguiente paso tras agregar al carrito. */
export function StoreDialogs() {
  const { cartAddedProduct, dismissCartAdded, favoriteRemoval, cancelFavoriteRemoval, confirmFavoriteRemoval } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const inCartFlow = /^\/(carrito|checkout)/.test(pathname)

  return <>
    <ConfirmDialog
      open={cartAddedProduct !== null}
      variant="success"
      title="Agregaste una pieza a tu carrito"
      description="¿Qué quieres hacer ahora?"
      confirmLabel="Ir a mi carrito"
      cancelLabel="Seguir comprando"
      onCancel={() => { dismissCartAdded(); if (inCartFlow) navigate('/productos') }}
      onConfirm={() => { dismissCartAdded(); navigate('/carrito') }}
    >
      {cartAddedProduct && <div className="store-confirm-product">
        <img src={cartAddedProduct.image} alt="" />
        <strong>{cartAddedProduct.name}</strong>
      </div>}
    </ConfirmDialog>
    <ConfirmDialog
      open={favoriteRemoval !== null}
      title={`¿Quitar «${favoriteRemoval?.name ?? 'esta pieza'}» de tu lista de deseos?`}
      description="Podrás volver a guardarla cuando quieras."
      confirmLabel="Sí, quitar"
      cancelLabel="No, conservar"
      onCancel={cancelFavoriteRemoval}
      onConfirm={confirmFavoriteRemoval}
    />
  </>
}
