# Integración de Mercado Pago - Guía para Frontend

## 📋 Resumen

Esta guía explica cómo integrar el flujo de pago con Mercado Pago desde el frontend.

## 🔄 Flujo de Pago Completo

### 1. Crear Orden y Obtener URL de Pago

**Endpoint:** `POST /api/orders`

**Request:**
```json
{
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+5491123456789"
  },
  "items": [
    {
      "productId": "abc123",
      "size": "M",
      "color": "Azul",
      "quantity": 2
    }
  ],
  "paymentMethod": "mercadopago"
}
```

**Response (201 Created):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order123",
    "orderNumber": "ORD-2024-001",
    "customer": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+5491123456789"
    },
    "items": [
      {
        "productId": "abc123",
        "productName": "Remera Básica",
        "size": "M",
        "color": "Azul",
        "quantity": 2,
        "price": 1500,
        "reservedStock": true
      }
    ],
    "status": "pending-payment",
    "total": 3000,
    "paymentMethod": "mercadopago",
    "preferenceId": "1234567890-abc123-def456",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-18T10:30:00.000Z"
  },
  "paymentUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=1234567890-abc123-def456",
  "preferenceId": "1234567890-abc123-def456"
}
```

**Acción del Frontend:**
- Guardar el `order.id` y `orderNumber` en el estado/localStorage
- Redirigir al usuario a `paymentUrl` usando `window.location.href = paymentUrl`

---

### 2. Usuario Completa el Pago en Mercado Pago

Mercado Pago redirige al usuario de vuelta a tu sitio según el resultado:

- **Éxito:** `${FRONTEND_URL}/order/${orderId}?status=success`
- **Fallo:** `${FRONTEND_URL}/order/${orderId}?status=failure`
- **Pendiente:** `${FRONTEND_URL}/order/${orderId}?status=pending`

---

### 3. Consultar Estado de Pago (Polling Opcional)

Si necesitas verificar el estado del pago en tiempo real (útil mientras el usuario está en la página de confirmación):

**Endpoint:** `GET /api/orders/:orderId/payment-status`

**Request:**
```
GET /api/orders/order123/payment-status
```

**Response (200 OK):**
```json
{
  "orderId": "order123",
  "orderStatus": "payment-confirmed",
  "paymentId": "12345678901",
  "paymentStatus": "approved",
  "paymentStatusDetail": "accredited",
  "transactionAmount": 3000,
  "dateCreated": "2024-01-15T10:30:00.000Z",
  "dateApproved": "2024-01-15T10:31:00.000Z"
}
```

**Estados posibles de `paymentStatus`:**
- `pending`: Pago pendiente
- `approved`: Pago aprobado
- `rejected`: Pago rechazado
- `cancelled`: Pago cancelado

**Ejemplo de Polling (JavaScript):**
```javascript
async function checkPaymentStatus(orderId) {
  const maxAttempts = 30; // 30 intentos máximo
  const interval = 2000; // 2 segundos entre intentos
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/orders/${orderId}/payment-status`);
    const data = await response.json();
    
    if (data.paymentStatus === 'approved') {
      // Pago confirmado, redirigir a página de éxito
      window.location.href = `/order/${orderId}?status=success`;
      return;
    } else if (data.paymentStatus === 'rejected' || data.paymentStatus === 'cancelled') {
      // Pago rechazado, mostrar error
      showError('El pago fue rechazado');
      return;
    }
    
    // Esperar antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  // Si llegamos aquí, el pago sigue pendiente después de 1 minuto
  showWarning('El pago está pendiente. Te notificaremos cuando se confirme.');
}
```

---

### 4. Obtener Detalles de la Orden

**Endpoint:** `GET /api/orders/number/:orderNumber`

**Request:**
```
GET /api/orders/number/ORD-2024-001
```

**Response (200 OK):**
```json
{
  "message": "Order fetched successfully",
  "order": {
    "id": "order123",
    "orderNumber": "ORD-2024-001",
    "customer": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+5491123456789"
    },
    "items": [...],
    "status": "payment-confirmed",
    "total": 3000,
    "paymentMethod": "mercadopago",
    "paymentId": "12345678901",
    "paymentStatus": "approved",
    "paymentDate": "2024-01-15T10:31:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:31:00.000Z"
  }
}
```

---

## 🎯 Estados de Orden

### OrderStatus (estado de la orden en el sistema):
- `pending-payment`: Esperando pago (stock reservado)
- `payment-confirmed`: Pago confirmado
- `manually-cancelled`: Cancelada manualmente
- `cancelled-by-time`: Cancelada por expiración (3 días sin pago)
- `delivered`: Entregada

### PaymentStatus (estado del pago en Mercado Pago):
- `pending`: Pendiente
- `approved`: Aprobado
- `rejected`: Rechazado
- `cancelled`: Cancelado

---

## 🔄 Flujo Recomendado en el Frontend

### Opción 1: Redirección Simple (Recomendado)

```javascript
// 1. Crear orden
const createOrder = async (cart, customer) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer,
      items: cart.items,
      paymentMethod: 'mercadopago'
    })
  });
  
  const data = await response.json();
  
  if (data.paymentUrl) {
    // Guardar orderNumber para mostrar después
    localStorage.setItem('lastOrderNumber', data.order.orderNumber);
    
    // Redirigir a Mercado Pago
    window.location.href = data.paymentUrl;
  }
};

// 2. En la página de retorno (/order/:id?status=success)
const OrderConfirmationPage = ({ orderId, status }) => {
  useEffect(() => {
    if (status === 'success') {
      // El webhook ya procesó el pago automáticamente
      // Solo mostrar confirmación
      fetchOrderDetails(orderId);
    } else if (status === 'failure') {
      showError('El pago fue rechazado');
    } else if (status === 'pending') {
      showWarning('El pago está pendiente de confirmación');
      // Opcional: iniciar polling
      checkPaymentStatus(orderId);
    }
  }, [orderId, status]);
};
```

### Opción 2: Con Polling Activo

```javascript
// Después de crear la orden, iniciar polling inmediatamente
const createOrderWithPolling = async (cart, customer) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer,
      items: cart.items,
      paymentMethod: 'mercadopago'
    })
  });
  
  const data = await response.json();
  
  if (data.paymentUrl) {
    // Abrir Mercado Pago en nueva ventana/pestaña
    const paymentWindow = window.open(data.paymentUrl, '_blank');
    
    // Iniciar polling
    const pollInterval = setInterval(async () => {
      const statusResponse = await fetch(`/api/orders/${data.order.id}/payment-status`);
      const statusData = await statusResponse.json();
      
      if (statusData.paymentStatus === 'approved') {
        clearInterval(pollInterval);
        paymentWindow?.close();
        showSuccess('¡Pago confirmado!');
        // Redirigir a página de confirmación
        window.location.href = `/order/${data.order.id}?status=success`;
      } else if (statusData.paymentStatus === 'rejected' || statusData.paymentStatus === 'cancelled') {
        clearInterval(pollInterval);
        paymentWindow?.close();
        showError('El pago fue rechazado');
      }
    }, 2000); // Verificar cada 2 segundos
    
    // Limpiar polling después de 5 minutos máximo
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  }
};
```

---

## ⚠️ Manejo de Errores

### Error al Crear Orden

**Response (400 Bad Request):**
```json
{
  "error": "Customer, items and payment method are required"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Product abc123 not found"
}
```

**Response (400 Bad Request - Stock):**
```json
{
  "message": "Not enough stock for the Remera Básica in size M and color Azul"
}
```

### Error al Crear Preferencia de Pago

Si falla la creación de la preferencia, la orden se crea igualmente pero sin `paymentUrl`:

**Response (201 Created):**
```json
{
  "message": "Order created successfully, but payment URL could not be generated",
  "order": { ... },
  "error": "Failed to create payment preference: ..."
}
```

En este caso, el admin puede crear el pago manualmente después.

---

## 📝 Endpoints Disponibles

### Públicos (sin autenticación):

1. **POST** `/api/orders` - Crear orden
2. **GET** `/api/orders/number/:orderNumber` - Obtener orden por número
3. **GET** `/api/orders/:orderId/payment-status` - Consultar estado de pago
4. **POST** `/api/orders/cancel` - Cancelar orden (solo si está en `pending-payment`)
5. **POST** `/api/orders/confirm-payment` - Confirmar pago manualmente (rara vez necesario)

### Privados (requieren JWT de admin):

1. **GET** `/api/orders` - Listar todas las órdenes
2. **GET** `/api/orders/:id` - Obtener orden por ID
3. **POST** `/api/orders/mark-delivered` - Marcar como entregada
4. **GET** `/api/orders/expiting-soon` - Órdenes próximas a expirar

---

## 🔔 Webhook (Backend)

El webhook se procesa automáticamente en el backend. Cuando Mercado Pago notifica un cambio de estado:

- **Pago aprobado:** La orden cambia automáticamente a `payment-confirmed`
- **Pago rechazado/cancelado:** La orden se cancela y el stock se devuelve

**No necesitas hacer nada en el frontend** - el webhook maneja todo automáticamente.

---

## ✅ Checklist de Integración

- [ ] Crear orden con `paymentMethod: "mercadopago"`
- [ ] Redirigir usuario a `paymentUrl` recibido
- [ ] Manejar páginas de retorno (`/order/:id?status=success/failure/pending`)
- [ ] Mostrar confirmación cuando `status=success`
- [ ] Manejar errores de stock insuficiente
- [ ] Manejar errores de creación de preferencia
- [ ] (Opcional) Implementar polling para verificar estado en tiempo real
- [ ] Guardar `orderNumber` para permitir consultas posteriores

---

## 🧪 Testing

### Modo Test de Mercado Pago

Si estás usando credenciales de test (`TEST-...`), puedes usar estas tarjetas de prueba:

**Tarjeta aprobada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: Cualquier nombre

**Tarjeta rechazada:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Fecha: Cualquier fecha futura

Más tarjetas de prueba: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/testing

### 👤 Usuarios de Prueba (Test Users)

Para probar el flujo completo de pago, Mercado Pago requiere que uses **usuarios de prueba**. Estos usuarios simulan compradores reales.

#### Crear Usuario de Prueba

1. Ve a tu panel de Mercado Pago: https://www.mercadopago.com.ar/developers/panel/app
2. Selecciona tu aplicación de prueba
3. Ve a la sección **"Usuarios de prueba"** o **"Test Users"**
4. Crea un nuevo usuario de prueba (buyer/test user)

#### Código de Verificación por Email

Cuando intentas pagar con un usuario de prueba, Mercado Pago puede pedirte un **código de verificación** que se envía por email.

**¿Dónde encontrar el código?**

1. **Email del usuario de prueba**: El código se envía al email que configuraste para el usuario de prueba (ej: `test_user_1920172413@testuser.com`)

2. **Panel de Mercado Pago**: 
   - Ve a tu panel de desarrolladores
   - Selecciona tu aplicación
   - Ve a **"Usuarios de prueba"**
   - Haz clic en el usuario que estás usando
   - Busca la sección **"Códigos de verificación"** o **"Verification Codes"**

3. **Código de prueba estándar**: En algunos casos, Mercado Pago usa códigos predefinidos para usuarios de prueba:
   - Código común: `123456`
   - O el código que aparece en el panel de usuarios de prueba

#### Pasos para Completar un Pago de Prueba

1. **Crear la orden** desde tu frontend (POST `/api/orders`)
2. **Redirigir al usuario** a la `paymentUrl` recibida
3. **En la página de Mercado Pago**:
   - Selecciona "Pagar con cuenta de Mercado Pago" o "Pagar con tarjeta"
   - Si te pide iniciar sesión, usa las credenciales del usuario de prueba
   - Si te pide código de verificación:
     - Revisa el email del usuario de prueba
     - O usa el código del panel de desarrolladores
     - O intenta con `123456` (código común de prueba)
4. **Completar el pago** con una tarjeta de prueba (ver arriba)

#### Usuarios de Prueba Predefinidos

Mercado Pago también proporciona usuarios de prueba predefinidos. Puedes encontrarlos en:
- Documentación: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/testing
- Panel de desarrolladores → Usuarios de prueba

**Nota importante**: Los usuarios de prueba solo funcionan con credenciales de test (`TEST-...`). No funcionan con credenciales de producción.

---

## 📞 Soporte

Si tienes problemas con la integración:
1. Verifica que las variables de entorno estén configuradas (`FRONTEND_URL`, `API_URL`)
2. Revisa los logs del backend para ver errores específicos
3. Verifica que el webhook esté configurado en Mercado Pago: `${API_URL}/api/payments/webhook`

