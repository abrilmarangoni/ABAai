# WhatsApp AI Ordering Bot - Frontend

React dashboard para gestionar pedidos del WhatsApp AI Ordering Bot.

## Características

- 📊 Dashboard en tiempo real con estadísticas de pedidos
- 📋 Tabla de pedidos con filtros y actualización de estado
- 🎨 Interfaz moderna con Tailwind CSS
- 🔄 Actualización automática cada 30 segundos
- 📱 Diseño responsive para móviles y desktop

## Tecnologías

- **React 18** - Framework frontend
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos y diseño
- **Fetch API** - Comunicación con backend

## Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crear archivo `.env.local` con:
   ```
   VITE_API_URL=http://localhost:3001
   ```

## Desarrollo

**Iniciar servidor de desarrollo:**
```bash
npm run dev
```

El dashboard estará disponible en `http://localhost:3000`

## Producción

**Construir para producción:**
```bash
npm run build
```

**Previsualizar build:**
```bash
npm run preview
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── OrdersTable.jsx    # Tabla de pedidos
│   │   └── OrderStats.jsx     # Estadísticas
│   ├── App.jsx               # Componente principal
│   ├── main.jsx              # Punto de entrada
│   └── index.css             # Estilos globales
├── public/                   # Archivos estáticos
├── package.json
└── vite.config.js           # Configuración de Vite
```

## Funcionalidades

### Dashboard Principal
- Estadísticas en tiempo real (total, pendientes, pagados, entregados)
- Ingresos totales calculados automáticamente
- Botón de actualización manual

### Tabla de Pedidos
- Lista completa de pedidos con información detallada
- Dropdown para cambiar estado de pedidos
- Formato de fecha y hora localizado
- Números de teléfono formateados
- Items del pedido mostrados de forma clara

### Actualización en Tiempo Real
- Refresco automático cada 30 segundos
- Indicador de última actualización
- Manejo de errores con mensajes informativos

## API Endpoints Utilizados

- `GET /api/orders` - Obtener todos los pedidos
- `PUT /api/orders/:id` - Actualizar estado de pedido

## Notas de Desarrollo

- El frontend se conecta al backend a través de proxy configurado en Vite
- Tailwind CSS se carga desde CDN para desarrollo rápido
- Componentes modulares para fácil mantenimiento
- Manejo de estados de carga y errores
