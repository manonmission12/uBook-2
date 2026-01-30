document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Login
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) { window.location.href = 'login.html'; return; }

    // 2. Info Dasar
    document.getElementById('displayName').innerText = currentUser;
    
    // Avatar Logic
    const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
    const avatarDisplay = document.getElementById('profileAvatarDisplay');
    if (savedAvatar) {
        avatarDisplay.innerHTML = `<img src="${savedAvatar}" alt="Avatar">`;
    }

    // Ganti Foto
    const avatarInput = document.getElementById('avatarInput');
    avatarInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const result = e.target.result;
                try {
                    localStorage.setItem(`avatar_${currentUser}`, result);
                    avatarDisplay.innerHTML = `<img src="${result}" alt="Avatar">`;
                    alert("Foto profil diperbarui!");
                } catch (err) {
                    alert("Gambar terlalu besar! Gunakan ukuran lebih kecil.");
                }
            }
            reader.readAsDataURL(file);
        }
    });

    // 3. LOGIKA BUKU (UPLOAD & DISIMPAN)
    
    // A. Buku yang Diupload User
    const uploadedBooks = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
    document.getElementById('statUploads').innerText = uploadedBooks.length;
    renderList('userBookGrid', uploadedBooks, "Kamu belum mengupload buku.");

    // B. Buku yang Disimpan (Favorit)
    const savedBooks = JSON.parse(localStorage.getItem(`savedBooks_${currentUser}`) || '[]');
    document.getElementById('statSaved').innerText = savedBooks.length;
    renderList('savedBookGrid', savedBooks, "Belum ada buku yang disimpan.");

    // Fungsi Render Universal
    function renderList(elementId, booksArray, emptyMessage) {
        const grid = document.getElementById(elementId);
        grid.innerHTML = '';

        if (booksArray.length > 0) {
            booksArray.reverse().forEach(book => {
                const card = document.createElement('div');
                card.className = 'mini-book-card';
                // Klik kartu di profil -> Buka halaman baca langsung
                card.onclick = () => {
                    const safeTitle = encodeURIComponent(book.title);
                    const safeSource = encodeURIComponent(book.pdf || book.file || '');
                    window.location.href = `read.html?title=${safeTitle}&source=${safeSource}`;
                };

                card.innerHTML = `
                    <img src="${book.img || book.image || book.cover}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="mini-info">
                        <h4>${book.title}</h4>
                        <p>${book.category}</p>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = `<p class="empty-msg">${emptyMessage}</p>`;
        }
    }

    // 4. LOGIKA LOGOUT (UPDATED: Redirect ke login.html)
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if(confirm('Keluar akun?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html'; // <--- PERUBAHAN DISINI
        }
    });

    // Theme
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    root.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
    if(themeToggle) themeToggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
});