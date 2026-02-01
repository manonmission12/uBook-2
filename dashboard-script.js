document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. DARK MODE ---
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    if(localStorage.getItem('theme') === 'dark') {
        root.setAttribute('data-theme', 'dark');
        if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    }
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            if(icon) { icon.classList.toggle('fa-moon'); icon.classList.toggle('fa-sun'); }
        });
    }

    // --- 1. NAVIGASI ---
    const currentUser = localStorage.getItem('currentUser'); 
    const navLinks = document.getElementById('navLinks');
    const authButtons = document.getElementById('authButtons');

    if (currentUser) {
        if(navLinks) {
            navLinks.innerHTML = `
                <a href="index.html" class="nav-link active">Beranda</a>
                <a href="profile.html" class="nav-link">Profil</a>
                <a href="upload.html" class="nav-link">Upload Buku</a>
            `;
        }
        
        const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
        const avatarSrc = savedAvatar || null;

        if(authButtons) {
            authButtons.innerHTML = `
                <div class="nav-profile-wrapper">
                    <button id="profileMenuBtn" class="nav-avatar-btn">
                        ${avatarSrc ? `<img src="${avatarSrc}" alt="Avatar">` : `<i class="fas fa-user"></i>`}
                    </button>
                    <div id="profileDropdown" class="profile-dropdown">
                        <div class="dropdown-header"><p>Halo,</p><strong>${currentUser}</strong></div>
                        <a href="upload.html" class="dropdown-item"><i class="fas fa-cloud-upload-alt"></i> Upload Buku</a>
                        <a href="profile.html" class="dropdown-item"><i class="fas fa-id-card"></i> Profil Saya</a>
                        <button id="logoutBtn" class="dropdown-item danger"><i class="fas fa-sign-out-alt"></i> Keluar</button>
                    </div>
                </div>`;
            
            const menuBtn = document.getElementById('profileMenuBtn');
            const dropdown = document.getElementById('profileDropdown');
            menuBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('active'); });
            document.addEventListener('click', (e) => { if (!menuBtn.contains(e.target)) dropdown.classList.remove('active'); });
            document.getElementById('logoutBtn').addEventListener('click', () => {
                if(confirm('Yakin ingin keluar?')) { localStorage.removeItem('currentUser'); window.location.href = 'login.html'; }
            });
        }
    } else {
        if(navLinks) navLinks.innerHTML = `<a href="index.html" class="nav-link active">Beranda</a>`;
        if(authButtons) authButtons.innerHTML = `<a href="login.html" class="nav-btn" style="text-decoration:none; margin-right:15px; font-weight:600;">Masuk</a><a href="signup.html" class="nav-btn" style="background:var(--text-primary); color:var(--bg-card); padding:8px 20px; border-radius:20px; text-decoration:none; font-weight:600;">Daftar</a>`;
    }

    // --- 2. DATA BUKU ---
    const defaultBooks = [
        { id: "B1", title: "Filosofi Teras", author: "Henry Manampiring", category: "Filsafat", img: "covers/filosofi teras.png", pdf: "books/1. Filosofi Teras.pdf", rating: 4.8 },
        { id: "B2", title: "This is Marketing", author: "Seth Godin", category: "Bisnis", img: "covers/this is marketing.png", pdf: "books/2. This is marketing.pdf", rating: 4.6 },
        { id: "B3", title: "Atomic Habits", author: "James Clear", category: "Self-Improvement", img: "covers/atomic habits.png", pdf: "books/3. Atomic Habits.pdf", rating: 4.9 },
        { id: "B4", title: "Psychology of Money", author: "Morgan Housel", category: "Self-Improvement", img: "covers/the psychology of money.png", pdf: "books/4. The Psychology of Money.pdf", rating: 4.7 },
        { id: "B5", title: "Citizen 4.0", author: "Hermawan Kartajaya", category: "Bisnis", img: "covers/citizen 4.0.png", pdf: "books/5. Citizen 4.0.pdf", rating: 4.5 },
        { id: "B6", title: "Find Your Why", author: "Simon Sinek", category: "Self-Improvement", img: "covers/find your why.png", pdf: "books/6. Find your why.pdf", rating: 4.4 },
        { id: "B7", title: "How To Win Friends", author: "Dale Carnegie", category: "Self-Improvement", img: "covers/how to win friends&influence people.png", pdf: "books/7. How to win friend & influence people.pdf", rating: 4.8 },
        { id: "B8", title: "Marketing 4.0", author: "Philip Kotler", category: "Bisnis", img: "covers/marketing 4.0.png", pdf: "books/8. Marketing 4.0.pdf", rating: 4.7 },
        { id: "B9", title: "Marketing in Crisis", author: "Rhenald Kasal", category: "Bisnis", img: "covers/marketing in crisis.png", pdf: "books/9. Marketing in Crisis.pdf", rating: 4.5 },
        { id: "B10", title: "Mindset", author: "Dr. Carol S. Dweck", category: "Self-Improvement", img: "covers/mindset.png", pdf: "books/10. Mindset.pdf", rating: 4.3 },
        { id: "B11", title: "Bodo Amat", author: "Mark Manson", category: "Self-Improvement", img: "covers/sebuah seni untuk bersikap bodo amat.png", pdf: "books/11. Sebuah Seni untuk Bersikap Bodo Amat.pdf", rating: 4.6 },
        { id: "B12", title: "Thinking, Fast & Slow", author: "Daniel Kahneman", category: "Self-Improvement", img: "covers/thinking fast and slow.png", pdf: "books/12. Thinking, fast and slow.pdf", rating: 4.7 },
        { id: "B13", title: "Grit", author: "Angela Duckworth", category: "Self-Improvement", img: "covers/grit.png", pdf: "books/grit.pdf", rating: 4.5 },
        { id: "B14", title: "Show Your Work", author: "Austin Kleon", category: "Self-Improvement", img: "covers/Show Your Work.png", pdf: "books/14. Show your work.pdf", rating: 4.8 },
        { id: "B15", title: "Intelligent Investor", author: "Benjamin Graham", category: "Bisnis", img: "covers/the intelligent investor.png", pdf: "books/15. The Intelligent Investor.pdf", rating: 4.6 },
        { id: "B16", title: "Think Like a Freak", author: "Steven D. Levitt", category: "Self-Improvement", img: "covers/think like a freak.png", pdf: "books/16. Think like a freak.pdf", rating: 4.9 }
    ];

    let uploadedBooks = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
    let allBooks = [...uploadedBooks.reverse(), ...defaultBooks]; 

    // --- 3. RENDER BUKU ---
    const bookGrid = document.getElementById('bookGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    // Load Data
    const userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
    let savedBooks = JSON.parse(localStorage.getItem(`savedBooks_${currentUser}`) || '[]');
    let readingHistory = JSON.parse(localStorage.getItem(`readingHistory_${currentUser}`) || '{}');

    // Helper: Cek Status Buku
    function getBookStatus(book) {
        if (readingHistory[book.title] === 'finished') return 'finished';
        if (readingHistory[book.title] === 'reading') return 'reading';
        if (savedBooks.some(b => b.id.toString() === book.id.toString())) return 'want';
        return 'none';
    }

    // Helper: Simpan Status
    function setBookStatus(book, newStatus) {
        if (newStatus === 'want') {
            if (!savedBooks.some(b => b.id.toString() === book.id.toString())) savedBooks.push(book);
            delete readingHistory[book.title];
        } else if (newStatus === 'reading') {
            readingHistory[book.title] = 'reading';
            savedBooks = savedBooks.filter(b => b.id.toString() !== book.id.toString());
        } else if (newStatus === 'finished') {
            readingHistory[book.title] = 'finished';
            savedBooks = savedBooks.filter(b => b.id.toString() !== book.id.toString());
        } else {
            // Case 'none' -> Hapus semua
            delete readingHistory[book.title];
            savedBooks = savedBooks.filter(b => b.id.toString() !== book.id.toString());
        }
        localStorage.setItem(`savedBooks_${currentUser}`, JSON.stringify(savedBooks));
        localStorage.setItem(`readingHistory_${currentUser}`, JSON.stringify(readingHistory));
    }

    function renderBooks(filterText = '', category = 'all') {
        if (!bookGrid) return;
        bookGrid.innerHTML = '';

        const filtered = allBooks.filter(b => {
            const matchText = b.title.toLowerCase().includes(filterText.toLowerCase()) || 
                              b.author.toLowerCase().includes(filterText.toLowerCase());
            const matchCat = category === 'all' || b.category === category;
            return matchText && matchCat;
        });

        if (filtered.length === 0) {
            bookGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; margin-top:40px; color:var(--text-tertiary);"><p>Buku tidak ditemukan.</p></div>`;
            return;
        }

        filtered.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            const imgSrc = book.img || book.image || book.cover;
            
            const myRating = userRatings[book.title];
            const currentScore = myRating ? myRating.score : (book.rating || 0);
            const displayScore = parseFloat(currentScore).toFixed(1);
            
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                let fillClass = '';
                if (Math.round(currentScore) >= i) fillClass = myRating ? 'user-filled' : 'filled';
                starsHTML += `<i class="fas fa-star ${fillClass}"></i>`;
            }

            const status = getBookStatus(book);
            let btnClass = '';
            let btnIcon = 'far fa-bookmark'; // Default (None)

            if (status === 'want') { btnClass = 'want'; btnIcon = 'fas fa-bookmark'; }
            else if (status === 'reading') { btnClass = 'reading'; btnIcon = 'fas fa-book-reader'; }
            else if (status === 'finished') { btnClass = 'finished'; btnIcon = 'fas fa-check-circle'; }

            card.innerHTML = `
                <div class="book-status-wrapper">
                    <button class="btn-status-toggle ${btnClass}" data-id="${book.id}">
                        <i class="${btnIcon}"></i>
                    </button>
                    <div class="status-dropdown">
                        <button class="status-option opt-want" data-val="want"><i class="fas fa-bookmark"></i> Ingin Dibaca</button>
                        <button class="status-option opt-reading" data-val="reading"><i class="fas fa-book-reader"></i> Sedang Dibaca</button>
                        <button class="status-option opt-finished" data-val="finished"><i class="fas fa-check-circle"></i> Sudah Selesai</button>
                        <button class="status-option opt-remove" data-val="none"><i class="fas fa-trash-alt"></i> Hapus Status</button>
                    </div>
                </div>

                <img src="${imgSrc}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Cover'">
                <div class="book-info">
                    <span class="tag">${book.category}</span>
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                    <div class="card-footer">
                        <div class="interactive-stars">${starsHTML}</div>
                        <span class="rating-number">${displayScore || 4.5}</span>
                    </div>
                </div>
            `;
            
            // LOGIKA BARU: Klik Tombol -> Buka Menu
            const wrapper = card.querySelector('.book-status-wrapper');
            const toggleBtn = wrapper.querySelector('.btn-status-toggle');
            const dropdown = wrapper.querySelector('.status-dropdown');

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Biar modal gak kebuka
                if (!currentUser) { if(confirm("Login dulu yuk!")) window.location.href='login.html'; return; }
                
                // Tutup dropdown lain biar gak numpuk
                document.querySelectorAll('.status-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
                
                // Toggle Menu ini
                dropdown.classList.toggle('active');
            });

            // Klik Pilihan Menu
            wrapper.querySelectorAll('.status-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newVal = opt.getAttribute('data-val');
                    setBookStatus(book, newVal);
                    dropdown.classList.remove('active');
                    renderBooks(searchInput.value, categoryFilter.value); // Refresh Tampilan
                });
            });

            card.addEventListener('click', (e) => {
                if (e.target.closest('.book-status-wrapper')) return;
                openModal(book);
            });

            bookGrid.appendChild(card);
        });
    }

    // Klik luar -> Tutup Semua Dropdown
    document.addEventListener('click', (e) => {
        if(!e.target.closest('.book-status-wrapper')) {
            document.querySelectorAll('.status-dropdown').forEach(d => d.classList.remove('active'));
        }
    });

    // --- 4. MODAL & RATING LOGIC ---
    const modal = document.getElementById('bookModal');
    const feedback = document.getElementById('ratingFeedback');
    const ratingInput = document.getElementById('modalRatingInput');

    function openModal(book) {
        if (!modal) return;
        document.getElementById('modalImg').src = book.img || book.image || book.cover;
        document.getElementById('modalTitle').innerText = book.title;
        document.getElementById('modalAuthor').innerText = book.author;
        document.getElementById('modalBadges').innerHTML = `<span class="badge-cat">${book.category}</span>`;
        
        const readBtn = document.getElementById('readBtn');
        const newReadBtn = readBtn.cloneNode(true);
        readBtn.parentNode.replaceChild(newReadBtn, readBtn);

        newReadBtn.onclick = () => {
            const pdfLink = book.file || book.pdf || book.source;
            if (pdfLink) {
                if (currentUser) {
                    setBookStatus(book, 'reading'); // Auto set Reading
                    const safeTitle = encodeURIComponent(book.title);
                    const safeSource = encodeURIComponent(pdfLink);
                    window.location.href = `read.html?title=${safeTitle}&source=${safeSource}`;
                } else {
                    if(confirm("Silakan login dulu.")) window.location.href = 'login.html';
                }
            } else { alert("File tidak tersedia."); }
        };

        const modalStars = document.querySelectorAll('#modalStars i');
        const myRating = userRatings[book.title];
        let currentVal = myRating ? myRating.score : 0;

        updateVisualStars(currentVal);
        ratingInput.value = currentVal > 0 ? currentVal : '';
        feedback.innerText = myRating ? "Rating tersimpan." : "Beri penilaian.";

        modalStars.forEach(star => { star.onclick = function() { saveRating(this.getAttribute('data-val')); } });

        ratingInput.oninput = function() {
            let val = parseFloat(this.value);
            if (isNaN(val)) val = 0; if (val > 5) val = 5; if (val < 0) val = 0;
            saveRating(val);
        };

        function saveRating(val) {
            if (!currentUser) { if(confirm("Login dulu!")) window.location.href = 'login.html'; return; }
            userRatings[book.title] = { score: parseFloat(val), date: new Date().toISOString() };
            localStorage.setItem('userRatings', JSON.stringify(userRatings));
            
            setBookStatus(book, 'finished'); // Auto set Finished

            ratingInput.value = val;
            updateVisualStars(val);
            feedback.innerText = "Terima kasih! Rating tersimpan.";
            renderBooks(searchInput.value, categoryFilter.value);
        }

        modal.classList.add('active');
    }

    function updateVisualStars(val) {
        const stars = document.querySelectorAll('#modalStars i');
        stars.forEach(s => {
            const sVal = parseInt(s.getAttribute('data-val'));
            s.classList.remove('active'); s.style.background = ''; s.style.webkitBackgroundClip = ''; s.style.webkitTextFillColor = '';
            if (val >= sVal) s.classList.add('active');
            else if (val > sVal - 1) {
                const percentage = (val - (sVal - 1)) * 100;
                s.style.background = `linear-gradient(90deg, #f59e0b ${percentage}%, #e5e7eb ${percentage}%)`;
                s.style.webkitBackgroundClip = 'text'; s.style.webkitTextFillColor = 'transparent';
            }
        });
    }

    window.closeModal = () => modal.classList.remove('active');
    if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) window.closeModal(); });

    renderBooks();
    if(searchInput) searchInput.addEventListener('input', (e) => renderBooks(e.target.value, categoryFilter.value));
    if(categoryFilter) categoryFilter.addEventListener('change', (e) => renderBooks(searchInput.value, e.target.value));
});