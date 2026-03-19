# Guía de Migración de Paginación para Backoffice

Este documento detalla los pasos para implementar el sistema de **Paginación e Infinite Scroll** en cualquier repositorio basado en la arquitectura de `bot-skeleton`.

## Resumen de Cambios
La paginación requiere cambios en tres capas:
1.  **Backend (DB Handler)**: Adaptar las consultas para soportar rangos.
2.  **API (Rutas)**: Exponer parámetros `limit` y `offset`.
3.  **Frontend (JS)**: Detectar el scroll y cargar datos bajo demanda.

---

## 1. Backend (`src/utils/historyHandler.ts`)

Modifica los métodos `listChats` y `getMessages` para usar la función `.range()` de Supabase.

```typescript
// En listChats
static async listChats(limit: number = 20, offset: number = 0) {
    const { data, error } = await supabase
        .from('chats')
        .select('*, chat_tags(*, tags(*))')
        .eq('project_id', PROJECT_ID)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1); // <--- CLAVE
    return data;
}

// En getMessages
static async getMessages(chatId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false }) // Traer los últimos primero
        .range(offset, offset + limit - 1);
        
    return (data || []).reverse(); // Revertir para mostrar en orden cronológico
}
```

---

## 2. API (`src/routes/backoffice.routes.ts`)

Captura los parámetros de la URL y pásalos al handler.

```typescript
// GET /api/backoffice/chats
app.get('/api/backoffice/chats', backofficeAuth, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const chats = await HistoryHandler.listChats(limit, offset);
    res.json(chats);
});

// GET /api/backoffice/messages/:chatId
app.get('/api/backoffice/messages/:chatId', backofficeAuth, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const messages = await HistoryHandler.getMessages(req.params.chatId, limit, offset);
    res.json(messages);
});
```

---

## 3. Frontend (`src/js/backoffice.js`)

Aquí es donde ocurre la magia del **Infinite Scroll**.

### A. Definir Variables de Estado
```javascript
let chatOffset = 0;
const CHAT_LIMIT = 20;
let loadingChats = false;
let allChatsLoaded = false;

let messageOffset = 0;
const MSG_LIMIT = 50;
let loadingMessages = false;
let allMessagesLoaded = false;
```

### B. Refactorizar `fetchChats`
Asegúrate de que si `refresh` es `false`, los nuevos chats se concatenen a la lista actual en lugar de reemplazarla.

```javascript
async function fetchChats(refresh = false) {
    if (loadingChats) return;
    if (refresh) {
        chatOffset = 0;
        allChatsLoaded = false;
    }
    if (allChatsLoaded && !refresh) return;

    loadingChats = true;
    const res = await fetch(`/api/backoffice/chats?token=${token}&limit=${CHAT_LIMIT}&offset=${chatOffset}`);
    const newChats = await res.json();

    if (newChats.length < CHAT_LIMIT) allChatsLoaded = true;
    
    chats = refresh ? newChats : [...chats, ...newChats];
    chatOffset = chats.length;
    
    renderChatList(chats);
    loadingChats = false;
}
```

### C. Detectar el Scroll (Infinite Scroll)
Añade listeners para disparar la carga cuando el usuario se acerque a los límites de la ventana actual.

```javascript
// Para la lista de chats (Scroll hacia abajo)
document.getElementById('chat-list').addEventListener('scroll', function() {
    const { scrollTop, scrollHeight, clientHeight } = this;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
        if (!loadingChats && !allChatsLoaded) fetchChats();
    }
});

// Para los mensajes (Scroll hacia arriba para historial)
document.getElementById('messages').addEventListener('scroll', function() {
    if (this.scrollTop < 50 && !loadingMessages && !allMessagesLoaded) {
        fetchMessages(activeChatId);
    }
});
```

---

## Conclusiones 💡
Portar esto requiere que en el nuevo repositorio el `HistoryHandler` ya esté usando Supabase (o similar con soporte de `.range()`). Si usas un arreglo local u otro DB, la lógica de `limit` y `offset` debe aplicarse manualmente mediante `.slice()`.
