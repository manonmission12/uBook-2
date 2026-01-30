document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DARK MODE ---
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    const savedTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', savedTheme);
    if(icon) {
        if(savedTheme === 'dark') icon.classList.replace('fa-moon', 'fa-sun');
    }

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = root.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            
            if(icon) {
                icon.classList.toggle('fa-moon');
                icon.classList.toggle('fa-sun');
            }
        });
    }

    // --- 2. LOGIN PROCESS ---
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value;

        if (!usernameInput || !passwordInput) {
            alert("Mohon isi username dan password!");
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === usernameInput && u.password === passwordInput);

        if (user) {
            // Sukses Login
            localStorage.setItem('currentUser', user.username);
            
            const btn = loginForm.querySelector('button');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
            btn.style.opacity = '0.8';

            setTimeout(() => {
                // REDIRECT KE HOME (INDEX.HTML)
                window.location.href = 'index.html'; 
            }, 1000);
        } else {
            alert("Username atau password salah!");
            const card = document.querySelector('.auth-card');
            card.style.animation = 'shake 0.5s';
            setTimeout(() => card.style.animation = '', 500);
        }
    });
});

// Animasi Shake
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}`;
document.head.appendChild(styleSheet);