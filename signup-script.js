document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LOGIKA DARK MODE ---
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const icon = themeToggle.querySelector('i');

    const savedTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }


    // --- 2. LOGIKA PENDAFTARAN (SIGN UP) ---
    const signupForm = document.getElementById('signupForm');

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Validasi Sederhana
        if (!fullname || !username || !password) {
            alert("Harap isi semua kolom!");
            return;
        }

        if (password.length < 6) {
            alert("Password minimal 6 karakter ya!");
            return;
        }

        // Cek apakah username sudah ada
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existingUser = users.find(u => u.username === username);

        if (existingUser) {
            alert("Username ini sudah dipakai, coba yang lain.");
            // Efek getar pada form
            const card = document.querySelector('.auth-card');
            card.style.animation = 'shake 0.5s';
            setTimeout(() => card.style.animation = '', 500);
            return;
        }

        // Simpan User Baru
        const newUser = { fullname, username, password, joined: new Date().toISOString() };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // --- 3. EFEK SUKSES (KONFETI) ---
        // Ubah tombol jadi loading
        const btn = signupForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Berhasil!';
        btn.style.backgroundColor = '#059669';

        // Tembakkan Konfeti! 🎉
        triggerConfetti();

        // Redirect ke Login setelah 2 detik
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });

    // Fungsi Konfeti Custom
    function triggerConfetti() {
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            // Tembak dari kiri & kanan
            confetti(Object.assign({}, defaults, { 
                particleCount, 
                origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } 
            }));
            confetti(Object.assign({}, defaults, { 
                particleCount, 
                origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } 
            }));
        }, 250);
    }
});

// Tambahkan animasi shake (jika belum ada di CSS global)
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