async function login() {
    const tokenInput = document.getElementById('token');
    const errorDiv = document.getElementById('error');
    const token = tokenInput.value;
    
    if (!token) return;

    try {
        const response = await fetch('/api/backoffice/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (response.ok) {
            localStorage.setItem('backoffice_token', token);
            window.location.href = '/backoffice';
        } else {
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error logging in:', error);
        errorDiv.innerText = 'Error de conexión. Inténtalo de nuevo.';
        errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('token');
    if (tokenInput) {
        tokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    }

    const loginBtn = document.querySelector('button');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
});
