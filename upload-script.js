document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Cek Login
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert("Kamu harus login untuk mengupload buku!");
        window.location.href = 'login.html';
        return;
    }

    // 2. Theme Logic
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', savedTheme);
    
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    // 3. Handle Upload
    const uploadForm = document.getElementById('uploadForm');

    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const category = document.getElementById('bookCategory').value;
        const pdf = document.getElementById('bookPdf').value;
        const cover = document.getElementById('bookCover').value;

        // Validasi Sederhana
        if (!pdf.endsWith('.pdf')) {
            alert("Link file harus berakhiran .pdf");
            return;
        }

        // Buat Objek Buku Baru
        const newBook = {
            id: Date.now(), // ID Unik
            title: title,
            author: author,
            category: category,
            pdf: pdf, // Link PDF
            img: cover || 'https://via.placeholder.com/300x450?text=No+Cover',
            rating: 5.0, // Default rating
            uploadedBy: currentUser
        };

        // Simpan ke LocalStorage
        const myBooks = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
        myBooks.push(newBook);
        localStorage.setItem('myUploadedBooks', JSON.stringify(myBooks));

        // Feedback & Redirect
        const btn = uploadForm.querySelector('button');
        btn.innerHTML = '<i class="fas fa-check"></i> Berhasil!';
        
        setTimeout(() => {
            alert("Buku berhasil diupload!");
            window.location.href = 'profile.html'; // Pindah ke profil untuk melihat buku
        }, 1000);
    });
});