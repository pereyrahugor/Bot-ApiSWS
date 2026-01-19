# Ejemplos Completos

Ejemplos de uso completo de la API en diferentes escenarios.

## Ejemplo 1: Flujo Completo de Nuevo Cliente

```javascript
// 1. Autenticarse
const authResponse = await fetch('http://demo.chatbot.sistemaws.com/api/Session/GetToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'demo2024'
  })
});

const { tokenValido } = await authResponse.json();

// 2. Buscar si el cliente ya existe
const searchResponse = await fetch('http://demo.chatbot.sistemaws.com/api/Clientes/BusquedaRapidaResultJson', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CURRENTTOKENVALUE': tokenValido
  },
  body: JSON.stringify({
    datosCliente: 'Juan Pérez',
    telefono: '',
    domicilio: ''
  })
});

const searchData = await searchResponse.json();

// 3. Si no existe, crear nuevo cliente
if (searchData.data.length === 0) {
  const createResponse = await fetch('http://demo.chatbot.sistemaws.com/Clientes/CrearNuevoClientePorChatBot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': tokenValido
    },
    body: JSON.stringify({
      cliente: {
        nombre: 'Juan Pérez',
        tipoDeClienteId: 1,
        condicionIvaId: 2,
        dniCuit: '12345678',
        telefono: '3512345678',
        email: 'juan.perez@email.com',
        listaDePreciosId: 1,
        domicilio: {
          provincia: 'Cordoba',
          pais: 'Argentina',
          ciudad: 'Córdoba Capital',
          calle: 'Av. Colón 1234',
          cp: '5000'
        }
      },
      reparto_id: 1
    })
  });
  
  const newClient = await createResponse.json();
  console.log('Cliente creado:', newClient);
}
```

## Ejemplo 2: Consultar Historial de Cliente

```javascript
// Obtener datos del cliente
const clienteResponse = await fetch('http://demo.chatbot.sistemaws.com/api/Clientes/ObtenerDatosCliente', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CURRENTTOKENVALUE': token
  },
  body: JSON.stringify({ cliente_id: 208 })
});

const cliente = await clienteResponse.json();

// Obtener historial de facturas
const facturasResponse = await fetch('http://demo.chatbot.sistemaws.com/Facturacion/ObtenerHistorialDeFacturas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CURRENTTOKENVALUE': token
  },
  body: JSON.stringify({
    cliente_id: 208,
    fechaDesde: '01/01/2026',
    fechaHasta: '31/01/2026',
    saldoPendiente: false
  })
});

const facturas = await facturasResponse.json();

// Obtener remitos
const remitosResponse = await fetch('http://demo.chatbot.sistemaws.com/Movimientos/ObtenerVentasPorCliente', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CURRENTTOKENVALUE': token
  },
  body: JSON.stringify({
    cliente_id: 208,
    fechaDesde: '01/01/2026',
    fechaHasta: '31/01/2026',
    consumosSinFacturar: false
  })
});

const remitos = await remitosResponse.json();

console.log('Historial completo:', { cliente, facturas, remitos });
```

## Ejemplo 3: Optimización de Rutas de Reparto

```javascript
// Buscar clientes cercanos a una dirección
const direccion = 'Av. Colón 1234, Córdoba';
let radio = 500;
let clientes = [];

// Incrementar radio hasta encontrar clientes
while (clientes.length === 0 && radio <= 2500) {
  const response = await fetch(
    `http://demo.chatbot.sistemaws.com/Repartos/BusquedaClientesCercanosResultJson?address=${encodeURIComponent(direccion)}&metros=${radio}`,
    {
      headers: { 'CURRENTTOKENVALUE': token }
    }
  );
  
  const data = await response.json();
  if (data.error === 0 && data.data.length > 0) {
    clientes = data.data;
  } else {
    radio += 250;
  }
}

// Ordenar por distancia
clientes.sort((a, b) => a.distanciaMetros - b.distanciaMetros);

console.log(`Encontrados ${clientes.length} clientes en un radio de ${radio}m`);
console.log('Ruta optimizada:', clientes);
```

## Ejemplo 4: Gestión de Incidentes

```javascript
// Crear incidente
const incidenteResponse = await fetch('http://demo.chatbot.sistemaws.com/api/Incidentes/Save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CURRENTTOKENVALUE': token
  },
  body: JSON.stringify({
    cliente_id: 208,
    titulo: 'Bidón con pérdida de agua',
    descripcion: '<p>El cliente informa que el bidón entregado hoy presenta una fisura en la base.</p>',
    tipoIncidente_ids: 2,
    subTipoIncidente_ids: 9,
    severidad_ids: 3,
    centroDistribucion_id: 1,
    usuarioResponsable_id: 12,
    fechaCierreEstimado: '23/07/2025'
  })
});

const incidente = await incidenteResponse.json();

if (incidente.error === 0) {
  console.log('Incidente creado:', incidente.incidente.numero);
  
  // Enviar notificación al cliente
  // ... lógica de notificación
}
```

## Ejemplo 5: Wrapper de API con Manejo de Errores

```javascript
class SWSAPI {
  constructor(username, password) {
    this.baseUrl = 'http://demo.chatbot.sistemaws.com';
    this.username = username;
    this.password = password;
    this.token = null;
    this.tokenExpiration = null;
  }
  
  async ensureToken() {
    if (this.token && this.tokenExpiration && new Date(this.tokenExpiration) > new Date()) {
      return this.token;
    }
    
    const response = await fetch(`${this.baseUrl}/api/Session/GetToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password
      })
    });
    
    const data = await response.json();
    this.token = data.tokenValido;
    this.tokenExpiration = data.vencimiento;
    return this.token;
  }
  
  async request(endpoint, method = 'POST', body = null) {
    await this.ensureToken();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CURRENTTOKENVALUE': this.token
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();
    
    if (data.error === 401) {
      // Token expirado, renovar y reintentar
      this.token = null;
      return this.request(endpoint, method, body);
    }
    
    return data;
  }
  
  // Métodos de conveniencia
  async buscarCliente(datosCliente) {
    return this.request('/api/Clientes/BusquedaRapidaResultJson', 'POST', {
      datosCliente,
      telefono: '',
      domicilio: ''
    });
  }
  
  async obtenerFacturas(cliente_id, fechaDesde, fechaHasta) {
    return this.request('/Facturacion/ObtenerHistorialDeFacturas', 'POST', {
      cliente_id,
      fechaDesde,
      fechaHasta,
      saldoPendiente: false
    });
  }
}

// Uso
const api = new SWSAPI('admin', 'demo2024');
const clientes = await api.buscarCliente('Juan Pérez');
console.log(clientes);
```

## Ver También

- [Autenticación](../autenticacion/obtener-token.md)
- [Códigos de Error](codigos-error.md)
