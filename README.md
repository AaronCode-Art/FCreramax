# Tienda web Cerámax

Tienda de prueba construida con React, TypeScript, Vite y Tailwind CSS 4. La navegación usa páginas independientes y features con componentes, hooks, tipos y estilos organizados por funcionalidad.

## Requisitos

- Node.js compatible con Vite 8.
- pnpm.
- Backend `BCeramax` ejecutándose en `http://localhost:8080`; para completar pedidos de demostración también requiere `CHECKOUT_SIMULADO_ENABLED=true` y el esquema actualizado.

## Desarrollo

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

La tienda se sirve exclusivamente en `http://localhost:5173`. Vite reenvía las peticiones del mismo origen bajo `/api` a `http://localhost:8080`; si el puerto 5173 ya está ocupado, el servidor falla en vez de cambiar a otro puerto. Spring permite solicitudes de navegador únicamente desde el origen `http://localhost:5173`. `localhost` es distinto de `127.0.0.1` y de cualquier otro puerto. La política CORS limita navegadores; la API sigue aplicando autenticación y autorización en el servidor.

Es necesario iniciar sesión con una cuenta de cliente antes de agregar productos al pedido; al intentarlo sin sesión, se abre el formulario de acceso. Desde ese formulario también se puede registrar una cuenta con todos los campos editables de `clientes`: tipo y número de documento, nombres, apellidos, correo, contraseña, teléfono, departamento, provincia, distrito, dirección, código postal, referencia y UBIGEO. Todos son obligatorios; departamento, provincia y distrito se seleccionan en cascada con el catálogo que entrega `GET /api/v1/public/ubigeos`, y el código de seis dígitos se deriva del distrito. El catálogo backend se basa en los datos del paquete `peru-ubigeo` (licencia MIT), cuya licencia se conserva en los recursos del servidor. El formulario limita longitudes según la tabla, restringe documentos, teléfono y código postal a sus formatos admitidos, y el backend valida nuevamente los datos antes de registrar la cuenta. ID, código de cliente, hash de contraseña, estado activo y fechas los gestiona el backend/base de datos y no se exponen como datos editables. Catálogo, categorías, imágenes, carrito, lista de deseos e historial de pedidos se consultan y modifican desde el backend; el frontend no usa productos ni carritos de demostración, ni conserva pedidos o sesión en el almacenamiento local. La sesión se mantiene en memoria mientras la página está abierta, por lo que se debe volver a iniciar sesión al recargarla. Al completar el checkout simulado, el backend registra el pedido y vacía el carrito. El icono de usuario y **Mis pedidos** llevan a `/miperfil`, donde se consulta el perfil, el estado de compra, los comprobantes PDF y las recomendaciones basadas en el catálogo real.

Si el backend no está disponible, el catálogo informa el error y permite reintentar la conexión; no se muestran datos de demostración.

## Checkout simulado

El checkout es la página `/compra`, requiere una sesión de cliente y permite elegir Yape, Plin o tarjeta como método preferido. El backend solo registra el pedido de prueba: no se procesa ningún cobro, no se solicitan datos financieros ni se genera un QR de pago.

Antes de confirmar, el resumen solicita al backend una cotización del carrito y muestra subtotal, IGV, costo de delivery y total. La tarifa y los impuestos usan los parámetros configurados en la base de datos; el recojo en tienda cotiza el envío en cero. La cotización no crea pedidos ni modifica el inventario, y el backend vuelve a calcular los importes al confirmar.

El icono de usuario y la opción **Mis pedidos** navegan a la página `/miperfil`. Esta pantalla está compuesta por features separados: consulta los datos del cliente desde `GET /api/v1/clientes/mio`, lista los pedidos desde `GET /api/v1/pedidos/mios`, muestra el pago y el avance del pedido para delivery o recojo, y ofrece productos recomendados aleatorios del catálogo real. La ruta `/boleta/{pedidoId}` presenta el detalle del comprobante y permite descargar el PDF autenticado desde `GET /api/v1/pedidos/{pedidoId}/comprobante/pdf`; está disponible cuando el pago figura aprobado. El PDF es una representación informativa y no una emisión tributaria electrónica ante SUNAT.

## Páginas de la tienda

- `/` muestra Inicio.
- `/productos` muestra el catálogo, la búsqueda y los filtros de categoría.
- `/categorias` muestra las categorías del catálogo; el menú superior también permite abrirlas directamente.
- `/detalleproducto/{productoId}` muestra el detalle y las acciones del producto.
- `/contacto` reúne la información de contacto disponible y la sección institucional de Cerámax.
- `/miperfil` requiere sesión y muestra perfil e historial de pedidos.
- `/compra` requiere sesión y contiene el checkout completo.
- `/boleta/{pedidoId}` requiere sesión y presenta el comprobante asociado al pedido.

La navegación interna conserva la sesión en memoria y soporta atrás/adelante del navegador. Para alojar el frontend fuera de Vite, configura el servidor estático para reescribir estas rutas a `index.html`.

El modo simulado está deshabilitado por defecto. Habilítalo solo con una base de datos de desarrollo/pruebas, configurando `CHECKOUT_SIMULADO_ENABLED=true` al iniciar el backend. En PowerShell:

```powershell
Set-Location ..\BCeramax
$env:CHECKOUT_SIMULADO_ENABLED = "true"
.\mvnw.cmd spring-boot:run
```

Los pagos de proveedor `SIMULADO` se excluyen de los reportes de ingresos y ventas reales. Para una base existente, aplica primero `../BCeramax/docs/migrations/2026-10-04-pago-simulado.sql` en la base aislada.

## Verificación

```powershell
pnpm build
pnpm lint
```

## Estructura

```text
src/
  app/
    App.tsx              resolución de rutas y composición de la aplicación
  components/
    layout/             encabezado y pie compartidos
    ui/                 componentes visuales y Overlay.module.css compartido
  features/
    auth/               acceso de cliente
    cart/               carrito
    catalog/            catálogo y tarjetas de producto
    boleta/             detalle y descarga de comprobantes
    categorias/         índice de categorías
    checkout/           pedido web, pago y CheckoutDialog.module.css
    compra/             página completa de checkout
    contacto/           página de contacto
    detalleproducto/    detalle del producto
    inicio/             página de inicio
    miperfil/           perfil e historial del cliente
    orders/             historial, seguimiento y comprobantes
    profile/            perfil del cliente
    productos/          catálogo con filtros
    storefront/         secciones de la tienda
    wishlist/           lista de deseos
  context/              estado compartido de la tienda
  hooks/                estado de la tienda y acceso al contexto
  lib/                  cliente API y utilidades
  types/                contratos TypeScript
  styles/               reset, tema y estilos globales compartidos
```

Los estilos particulares se mantienen como `*.module.css` junto al TSX que los usa. `global.css` se reserva para el reset, los tokens del tema y las utilidades compartidas (botones y campos). Los layouts compartidos se encuentran en `components/layout`; `App.tsx` resuelve la URL y cada pantalla completa vive dentro de su feature correspondiente.
