document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Login
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) { window.location.href = 'login.html'; return; }

    // 2. Tampilkan Info Dasar
    document.getElementById('displayName').innerText = currentUser;
    
    // Tampilkan Avatar (jika ada)
    const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
    const avatarDisplay = document.getElementById('profileAvatarDisplay');
    if (savedAvatar) {
        avatarDisplay.innerHTML = `<img src="${savedAvatar}" alt="Avatar">`;
    }

    // 3. Logika Ganti Foto
    const avatarInput = document.getElementById('avatarInput');
    avatarInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const result = e.target.result; // Base64 Image string
                // Simpan ke LocalStorage
                try {
                    localStorage.setItem(`avatar_${currentUser}`, result);
                    // Update Tampilan
                    avatarDisplay.innerHTML = `<img src="${result}" alt="Avatar">`;
                    alert("Foto profil berhasil diperbarui!");
                } catch (err) {
                    alert("Gambar terlalu besar! Coba gambar yang lebih kecil.");
                }
            }
            reader.readAsDataURL(file);
        }
    });

    // 4. Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if(confirm('Keluar akun?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });

    // 5. Load Buku Upload User (sama seperti sebelumnya)
    const uploadedBooks = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
    document.getElementById('statUploads').innerText = uploadedBooks.length;
    
    const grid = document.getElementById('userBookGrid');
    if (uploadedBooks.length > 0) {
        grid.innerHTML = '';
        uploadedBooks.reverse().forEach(book => {
            const card = document.createElement('div');
            card.className = 'mini-book-card';
            card.innerHTML = `
                <img src="${book.img || 'https://via.placeholder.com/150'}" alt="${book.title}">
                <div class="mini-info">
                    <h4>${book.title}</h4>
                    <p>${book.category}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<p class="empty-msg">Belum ada buku.</p>';
    }

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    root.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
    if(themeToggle) themeToggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
});