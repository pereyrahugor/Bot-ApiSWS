/**
 * Backoffice Logic
 */

const token = localStorage.getItem('backoffice_token');
if (!token) window.location.href = '/login';

let activeChatId = null;
let chats = [];
let botTags = [];
let selectedFile = null;

// Inicializar Socket.IO para tiempo real
const socket = io();

socket.on('connect', () => {
    console.log('✅ Conectado al servidor de tiempo real');
});

socket.on('new_message', (payload) => {
    console.log('📡 Nuevo mensaje recibido:', payload);
    if (activeChatId === payload.chatId) {
        fetchMessages(activeChatId);
    }
    fetchChats();
});

socket.on('bot_toggled', (payload) => {
    console.log('📡 Bot toggled:', payload);
    if (activeChatId === payload.chatId) {
        const toggle = document.getElementById('bot-toggle');
        if (toggle) {
            toggle.checked = payload.enabled;
            updateBotStatusText(payload.enabled);
            updateInputState(payload.enabled);
        }
    }
    fetchChats();
});

async function fetchChats() {
    try {
        const res = await fetch(`/api/backoffice/chats?token=${token}`);
        if (res.status === 401) logout();
        chats = await res.json();
        handleSearch();
    } catch (e) { console.error(e); }
}

async function fetchBotTags() {
    try {
        const res = await fetch(`/api/backoffice/tags?token=${token}`);
        botTags = await res.json();
        renderTagManager();
        renderFilterDropdown();
    } catch (e) { console.error(e); }
}

function handleSearch() {
    const query = (document.getElementById('search-input').value || "").toLowerCase();
    const tagFilter = document.getElementById('filter-tag').value;
    
    const filtered = chats.filter(chat => {
        const matchesSearch = chat.id.toLowerCase().includes(query) || (chat.name && chat.name.toLowerCase().includes(query));
        const matchesTag = !tagFilter || (chat.tags && chat.tags.some(t => t.id === tagFilter));
        return matchesSearch && matchesTag;
    });

    renderChatList(filtered);
}

function renderFilterDropdown() {
    const select = document.getElementById('filter-tag');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Todas las etiquetas</option>' + 
        botTags.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    select.value = currentValue;
}

function renderChatList(listToRender = chats) {
    const list = document.getElementById('chat-list');
    list.innerHTML = listToRender.map(chat => {
        const initial = (chat.name || chat.id).charAt(0).toUpperCase();
        const avatarUrl = `/api/backoffice/profile-pic/${chat.id}?token=${token}`;
        
        const tagsHtml = (chat.tags || []).map(t => 
            `<span class="tag-pill" style="background:${t.color || '#6366f1'}">${t.name}</span>`
        ).join('');

        const statusBadge = chat.bot_enabled 
            ? `<span style="color: var(--wa-accent); font-size: 0.75rem;">🤖 Bot</span>`
            : `<span style="color: #f87171; font-size: 0.75rem;">👤 Humano</span>`;

        // Atribudo data-id para delegación de eventos
        return `
            <div class="chat-item ${activeChatId === chat.id ? 'active' : ''}" data-id="${chat.id}">
                <div class="chat-avatar">
                    <span style="position:relative; z-index:1;">${initial}</span>
                    <img src="${avatarUrl}" onerror="this.style.display='none'">
                </div>
                <div class="chat-info">
                    <div style="display:flex; justify-content:space-between; align-items: baseline;">
                        <div class="chat-phone">${chat.id.split('@')[0]}</div>
                        ${statusBadge}
                    </div>
                    <div class="chat-name-small">${chat.name || ''}</div>
                    <div class="chat-tags-list" style="display:flex; flex-wrap:wrap; margin-top:2px;">${tagsHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function selectChat(id) {
    activeChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    
    document.getElementById('active-chat-phone').innerText = chat.id.split('@')[0];
    document.getElementById('active-chat-name').innerText = chat.name || 'Sin nombre';
    
    const headerAvatar = document.getElementById('active-chat-avatar');
    const initial = (chat.name || chat.id).charAt(0).toUpperCase();
    const avatarUrl = `/api/backoffice/profile-pic/${chat.id}?token=${token}`;
    
    headerAvatar.innerHTML = `
        <span style="position:relative; z-index:1;">${initial}</span>
        <img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:2;" onerror="this.style.display='none'">
    `;
    
    const botToggle = document.getElementById('bot-toggle');
    botToggle.disabled = false;
    botToggle.checked = chat.bot_enabled;
    updateBotStatusText(chat.bot_enabled);
    updateInputState(chat.bot_enabled);

    renderActiveChatTags();
    if (document.getElementById('tag-manager').style.display === 'block') {
        renderTagManager();
    }

    renderChatList();
    fetchMessages(id);
}

function renderActiveChatTags() {
    const chat = chats.find(c => c.id === activeChatId);
    const container = document.getElementById('active-chat-tags');
    if (chat && chat.tags) {
        container.innerHTML = chat.tags.map(t => 
            `<span class="tag-pill" style="background:${t.color}">${t.name}</span>`
        ).join('');
    } else {
        container.innerHTML = '';
    }
}

function updateBotStatusText(enabled) {
    const txt = document.getElementById('bot-status-text');
    txt.innerText = enabled ? 'Bot Activo' : 'Intervención Humana';
    txt.className = enabled ? 'status-bot' : 'status-human';
}

function updateInputState(botEnabled) {
    const input = document.getElementById('message-input');
    const btn = document.getElementById('send-btn');
    const attachBtn = document.getElementById('attach-btn');
    input.disabled = botEnabled;
    btn.disabled = botEnabled;
    attachBtn.disabled = botEnabled;
}

async function fetchMessages(chatId) {
    const res = await fetch(`/api/backoffice/messages/${chatId}?token=${token}`);
    const messages = await res.json();
    const container = document.getElementById('messages');
    
    let html = '';
    let lastDate = null;

    messages.forEach(m => {
        const date = new Date(m.created_at);
        const dateStr = date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
        
        if (dateStr !== lastDate) {
            html += `<div class="date-separator"><span>${dateStr}</span></div>`;
            lastDate = dateStr;
        }

        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let contentHtml = m.content;
        const isImageUrl = typeof m.content === 'string' && (m.content.match(/\.(jpeg|jpg|gif|png|webp)$/i) || m.content.includes('/assets/'));
        const isVideoUrl = typeof m.content === 'string' && m.content.match(/\.(mp4|webm|ogg)$/i);

        if (isImageUrl) {
            contentHtml = `<div class="msg-media"><img src="${m.content}" alt="imagen"></div>` + (m.content.startsWith('http') ? '' : m.content);
        } else if (isVideoUrl) {
            contentHtml = `<div class="msg-media"><video src="${m.content}" controls></video></div>`;
        }
        
        html += `
            <div class="msg ${m.role}">
                <div class="msg-content">${contentHtml}</div>
                <span class="msg-time">${time}</span>
            </div>
        `;
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

async function toggleBot(enabled) {
    if (!activeChatId) return;
    const res = await fetch('/api/backoffice/toggle-bot', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'token=' + token
        },
        body: JSON.stringify({ chatId: activeChatId, enabled })
    });

    if (res.ok) {
        const chat = chats.find(c => c.id === activeChatId);
        if (chat) {
            chat.bot_enabled = enabled;
            updateBotStatusText(enabled);
            updateInputState(enabled);
            renderChatList();
        }
    }
}

function handleFileSelect(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        selectedFile = input.files[0];
        document.getElementById('message-input').placeholder = `Archivo: ${selectedFile.name} (Escribe un comentario opcional)`;
        document.getElementById('message-input').focus();
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const attachBtn = document.getElementById('attach-btn');
    const content = input.value.trim();
    
    if (!content && !selectedFile) return;
    if (!activeChatId) {
        alert('Por favor selecciona un chat primero.');
        return;
    }

    const originalBtnHtml = sendBtn.innerHTML;
    const originalPlaceholder = input.placeholder;
    
    try {
        input.disabled = true;
        sendBtn.disabled = true;
        attachBtn.disabled = true;
        sendBtn.innerHTML = '⌛';
        input.placeholder = "Enviando...";

        const formData = new FormData();
        formData.append('chatId', activeChatId);
        if (content) formData.append('message', content);
        if (selectedFile) {
            formData.append('file', selectedFile);
            console.log('Enviando archivo:', selectedFile.name);
        }

        const res = await fetch('/api/backoffice/send-message', {
            method: 'POST',
            headers: { 
                'Authorization': 'token=' + token
            },
            body: formData
        });

        const result = await res.json();

        if (res.ok && result.success) {
            input.value = '';
            input.placeholder = "Escribe un mensaje...";
            selectedFile = null;
            document.getElementById('file-input').value = '';
            fetchMessages(activeChatId);
        } else {
            const errorMsg = result.error || 'Error desconocido del servidor';
            alert(`⚠️ No se pudo enviar el mensaje:\n${errorMsg}`);
        }
    } catch (err) {
        console.error('Error de red:', err);
        alert(`❌ Error de red: Asegúrate de que el servidor esté encendido y tengas conexión.`);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        attachBtn.disabled = false;
        sendBtn.innerHTML = originalBtnHtml;
        input.placeholder = originalPlaceholder;
        input.focus();
    }
}

function toggleTagManager() {
    const panel = document.getElementById('tag-manager');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    if (panel.style.display === 'block') {
        renderTagManager();
    }
}

async function createTag() {
    const nameInput = document.getElementById('new-tag-name');
    const colorInput = document.getElementById('new-tag-color');
    const name = nameInput.value;
    const color = colorInput.value;
    if (!name) return;

    const res = await fetch('/api/backoffice/tags', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'token=' + token
        },
        body: JSON.stringify({ name, color })
    });

    if (res.ok) {
        nameInput.value = '';
        fetchBotTags();
    }
}

async function deleteTag(id) {
    if (!confirm('¿Eliminar esta etiqueta?')) return;
    const res = await fetch(`/api/backoffice/tags/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'token=' + token }
    });
    if (res.ok) fetchBotTags();
}

async function addTagToChat(tagId) {
    const res = await fetch(`/api/backoffice/chats/${activeChatId}/tags`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'token=' + token
        },
        body: JSON.stringify({ tagId })
    });
    if (res.ok) {
        await fetchChats();
        renderActiveChatTags();
        renderTagManager();
    }
}

async function removeTagFromChat(tagId) {
    const res = await fetch(`/api/backoffice/chats/${activeChatId}/tags/${tagId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'token=' + token }
    });
    if (res.ok) {
        await fetchChats();
        renderActiveChatTags();
        renderTagManager();
    }
}

function renderTagManager() {
    const editorList = document.getElementById('tag-list-editor');
    editorList.innerHTML = botTags.map(t => `
        <div class="tag-item-edit">
            <span class="tag-pill" style="background:${t.color}">${t.name}</span>
            <button class="delete-tag-btn" data-id="${t.id}" style="background:none; border:none; color:#f87171; cursor:pointer;">del</button>
        </div>
    `).join('');

    const assignSection = document.getElementById('current-chat-tags-section');
    if (activeChatId) {
        assignSection.style.display = 'block';
        const chat = chats.find(c => c.id === activeChatId);
        const assignedTagIds = (chat.tags || []).map(t => t.id);
        
        const assignList = document.getElementById('available-tags-to-assign');
        assignList.innerHTML = botTags.map(t => {
            const isAssigned = assignedTagIds.includes(t.id);
            return `
                <div class="tag-pill assign-tag-toggle" 
                     data-id="${t.id}"
                     data-assigned="${isAssigned}"
                     style="background:${t.color}; cursor:pointer; opacity:${isAssigned ? 1 : 0.4}; border:${isAssigned ? '2px solid white' : 'none'}">
                    ${t.name} ${isAssigned ? '✓' : '+'}
                </div>
            `;
        }).join('');
    } else {
        assignSection.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('backoffice_token');
    window.location.href = '/login';
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('toggle-tag-manager-btn').addEventListener('click', toggleTagManager);
    document.getElementById('close-tag-manager-btn').addEventListener('click', toggleTagManager);
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('filter-tag').addEventListener('change', handleSearch);
    document.getElementById('bot-toggle').addEventListener('change', (e) => toggleBot(e.target.checked));
    document.getElementById('attach-btn').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('create-tag-btn').addEventListener('click', createTag);
    
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Event delegation for chat list
    document.getElementById('chat-list').addEventListener('click', (e) => {
        const item = e.target.closest('.chat-item');
        if (item) {
            selectChat(item.dataset.id);
        }
    });

    // Event delegation for tag management
    document.getElementById('tag-list-editor').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-tag-btn')) {
            deleteTag(e.target.dataset.id);
        }
    });

    document.getElementById('available-tags-to-assign').addEventListener('click', (e) => {
        const item = e.target.closest('.assign-tag-toggle');
        if (item) {
            const tagId = item.dataset.id;
            const isAssigned = item.dataset.assigned === 'true';
            if (isAssigned) {
                removeTagFromChat(tagId);
            } else {
                addTagToChat(tagId);
            }
        }
    });

    // Initial loads
    fetchChats();
    fetchBotTags();
    setInterval(fetchChats, 30000);
});
