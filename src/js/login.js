async function login() {
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const errorDiv = document.getElementById('error');
    const btn = document.getElementById('login-btn');
    const urlParams = new URLSearchParams(window.location.search);
    const target = urlParams.get('target');
    
    if (!pass) {
        showError('⚠️ La contraseña es obligatoria');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    errorDiv.style.display = 'none';

    try {
        const response = await fetch('/api/backoffice/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });

        const result = await response.json();

        if (result.success) {
            const token = result.token; // El token puede ser el de admin o el de subuser (id)
            const isMaster = (pass === 'neuroadmin25');
            const isBOToken = (token && token.length > 5 && !token.includes(':') && !isMaster); // Aproximación para token backend
            
            // Guardamos información clave del usuario
            localStorage.setItem('user_role', result.role || 'subuser'); // admin o subuser
            localStorage.setItem('user_id', result.userId || '');
            localStorage.setItem('user_name', result.user || user || (isMaster ? 'NeuroAdmin' : (isBOToken ? 'Operator' : 'admin')));

            // Si es el token maestro o el de backoffice, otorgamos acceso a ambas áreas
            if (isMaster) {
                localStorage.setItem('backoffice_token', token);
                localStorage.setItem('system_config_token', token);
                localStorage.setItem('config_authenticated', 'true'); // Para el overlay de system-config.js
            } else if (isBOToken) {
                localStorage.setItem('backoffice_token', token);
            }

            if (target === 'system-config') {
                if (!isMaster) localStorage.setItem('system_config_token', token);
                window.location.href = '/system-config';
            } else {
                if (!isMaster && !isBOToken) localStorage.setItem('backoffice_token', token);
                window.location.href = '/backoffice';
            }
        } else {
            showError('🚫 Usuario o Contraseña Inválidos');
        }
    } catch (e) {
        console.error('Error de autenticación:', e);
        showError('❌ Error al conectar con el servidor');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Entrar al Sistema</span> <i class="fas fa-arrow-right"></i>';
    }
}

function showError(msg) {
    const errorDiv = document.getElementById('error');
    errorDiv.querySelector('span').innerText = msg;
    errorDiv.style.display = 'flex';
    errorDiv.classList.add('animate-shake');
    setTimeout(() => errorDiv.classList.remove('animate-shake'), 500);
}

// Escuchar Enter en la página completa
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});
