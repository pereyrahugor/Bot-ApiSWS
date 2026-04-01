(function() {
    const path = window.location.pathname;
    
    // Solo protegemos las áreas designadas
    if (path.startsWith('/backoffice') || path.startsWith('/crm')) {
        const token = localStorage.getItem('backoffice_token');
        if (!token) {
            // No redirigir si ya estamos en login
            if (path !== '/login') window.location.href = '/login';
        }
    }
    
    // Configuración Crítica (System-Config)
    if (path.startsWith('/system-config')) {
        const configToken = localStorage.getItem('system_config_token');
        if (!configToken) {
            if (path !== '/login') window.location.href = '/login?target=system-config';
        }
    }
})();
