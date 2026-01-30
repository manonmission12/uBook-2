document.addEventListener('DOMContentLoaded', () => {
    
    // --- Dark Mode ---
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    const savedTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', savedTheme);
    if(icon && savedTheme === 'dark') icon.classList.replace('fa-moon', 'fa-sun');

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            if(icon) { icon.classList.toggle('fa-moon'); icon.classList.toggle('fa-sun'); }
        });
    }

    // --- Sign Up Process ---
    const signupForm = document.getElementById('signupForm');

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!fullname || !username || !password) {
            alert("Harap isi semua kolom!"); return;
        }
        if (password.length < 6) {
            alert("Password minimal 6 karakter!"); return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.username === username)) {
            alert("Username sudah terpakai."); return;
        }

        // Simpan User
        users.push({ fullname, username, password, joined: new Date().toISOString() });
        localStorage.setItem('users', JSON.stringify(users));

        // Efek Sukses
        const btn = signupForm.querySelector('button');
        btn.innerHTML = '<i class="fas fa-check"></i> Berhasil!';
        
        if (typeof confetti === 'function') confetti();

        setTimeout(() => {
            // Redirect ke LOGIN agar user bisa masuk
            window.location.href = 'login.html'; 
        }, 2000);
    });
});