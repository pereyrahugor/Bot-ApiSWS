/**
 * CRM COMMON JS
 * Global UI logic for Theme persistence and Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupNavigation();
});

/**
 * Initializes the theme from localStorage
 */
function initTheme() {
    const savedTheme = localStorage.getItem('crm-theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('crm-theme', newTheme);
            updateThemeIcon(newTheme);
            
            // Dispatch event for components to react
            document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }
}

/**
 * Updates the theme toggle icon (moon/sun)
 */
function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (!icon) return;
    
    if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

/**
 * Common Navigation Logic
 */
function setupNavigation() {
    const paths = {
        'backoffice.html': 'nav-backoffice',
        'dashboard.html': 'nav-dashboard',
        'variables.html': 'nav-variables',
        'webchat.html': 'nav-webchat',
        'webreset.html': 'nav-webreset',
        'login.html': 'nav-login'
    };

    const currentPath = window.location.pathname.split('/').pop() || 'backoffice.html';
    const activeId = paths[currentPath];
    
    if (activeId) {
        const activeItem = document.getElementById(activeId);
        if (activeItem) activeItem.classList.add('active');
    }

    // Logout common logic
    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('backoffice_token');
            window.location.href = 'login.html';
        });
    }
}

/**
 * Global Notification System (Toasts)
 */
window.crmToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `crm-toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add basic styles if not present
    if (!document.getElementById('crm-toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'crm-toast-styles';
        styles.innerHTML = `
            .crm-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            }
            .crm-toast {
                background: var(--bg-card);
                color: var(--text-main);
                padding: 12px 20px;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border-left: 4px solid var(--accent);
                display: flex;
                align-items: center;
                animation: slideIn 0.3s ease forwards;
            }
            .crm-toast.error { border-left-color: #ff4757; }
            .crm-toast i { margin-right: 12px; font-size: 1.2rem; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    let container = document.querySelector('.crm-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'crm-toast-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
