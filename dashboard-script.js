document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. DARK MODE SETUP ---
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

    // --- 1. NAVIGASI, AVATAR & DROPDOWN ---
    const currentUser = localStorage.getItem('currentUser'); 
    const navLinks = document.getElementById('navLinks');
    const authButtons = document.getElementById('authButtons');

    if (currentUser) {
        // --- JIKA MEMBER ---
        if(navLinks) {
            // UPDATED: Menambahkan Tombol "Profil" di samping Beranda
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
                        ${avatarSrc 
                            ? `<img src="${avatarSrc}" alt="Avatar">` 
                            : `<i class="fas fa-user"></i>`}
                    </button>
                    
                    <div id="profileDropdown" class="profile-dropdown">
                        <div class="dropdown-header">
                            <p>Halo,</p>
                            <strong>${currentUser}</strong>
                        </div>
                        <a href="upload.html" class="dropdown-item">
                            <i class="fas fa-cloud-upload-alt"></i> Upload Buku
                        </a>
                        <a href="profile.html" class="dropdown-item">
                            <i class="fas fa-id-card"></i> Profil Saya
                        </a>
                        <button id="logoutBtn" class="dropdown-item danger">
                            <i class="fas fa-sign-out-alt"></i> Keluar
                        </button>
                    </div>
                </div>
            `;

            const menuBtn = document.getElementById('profileMenuBtn');
            const dropdown = document.getElementById('profileDropdown');
            
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });

            // LOGOUT -> Redirect ke Login.html
            document.getElementById('logoutBtn').addEventListener('click', () => {
                if(confirm('Yakin ingin keluar?')) {
                    localStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                }
            });
        }
    } else {
        // --- JIKA TAMU ---
        if(navLinks) navLinks.innerHTML = `<a href="index.html" class="nav-link active">Beranda</a>`;
        
        if(authButtons) {
            authButtons.innerHTML = `
                <a href="login.html" class="nav-btn" style="text-decoration:none; color:var(--text-primary); margin-right:15px; font-weight:600;">Masuk</a>
                <a href="signup.html" class="nav-btn" style="background:var(--text-primary); color:var(--bg-card); padding:8px 20px; border-radius:20px; text-decoration:none; font-weight:600;">Daftar</a>
            `;
        }
    }

    // --- 2. DATA 16 BUKU BAWAAN (DEFAULT) ---
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

    // --- 3. RENDER BUKU (GRID) ---
    const bookGrid = document.getElementById('bookGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    // Ambil Data Rating & Simpan dari LocalStorage
    const userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
    let savedBooks = JSON.parse(localStorage.getItem(`savedBooks_${currentUser}`) || '[]');

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
            bookGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; margin-top: 40px; color: var(--text-tertiary);">
                    <i class="fas fa-search" style="font-size: 2rem; opacity: 0.5; margin-bottom: 10px;"></i>
                    <p>Buku tidak ditemukan.</p>
                </div>`;
            return;
        }

        filtered.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            const imgSrc = book.img || book.image || book.cover;
            
            // --- LOGIKA RATING DISPLAY ---
            const myRating = userRatings[book.title];
            const currentScore = myRating ? myRating.score : (book.rating || 0);
            
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                let fillClass = '';
                if (myRating) fillClass = (i <= currentScore) ? 'user-filled' : '';
                else fillClass = (i <= currentScore) ? 'filled' : '';
                starsHTML += `<i class="fas fa-star ${fillClass}"></i>`;
            }

            // --- LOGIKA TOMBOL SIMPAN ---
            const isSaved = savedBooks.some(b => b.id.toString() === book.id.toString());
            const saveIconClass = isSaved ? 'fas' : 'far';
            const activeClass = isSaved ? 'active' : '';

            card.innerHTML = `
                <button class="btn-save-book ${activeClass}" data-id="${book.id}">
                    <i class="${saveIconClass} fa-bookmark"></i>
                </button>

                <img src="${imgSrc}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Cover'">
                <div class="book-info">
                    <span class="tag">${book.category}</span>
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                    <div class="card-footer">
                        <div class="interactive-stars">${starsHTML}</div>
                        <span class="rating-number">${currentScore || 4.5}</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-save-book')) return;
                openModal(book);
            });
            
            bookGrid.appendChild(card);
        });

        // Event Listener Save Button
        document.querySelectorAll('.btn-save-book').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (!currentUser) {
                    if(confirm("Login dulu yuk untuk menyimpan buku!")) window.location.href = 'login.html';
                    return;
                }

                const bookId = this.dataset.id;
                const bookToSave = allBooks.find(b => b.id.toString() === bookId.toString());

                if (!bookToSave) return;

                const index = savedBooks.findIndex(b => b.id.toString() === bookToSave.id.toString());

                if (index !== -1) {
                    savedBooks.splice(index, 1); // Unsave
                    this.classList.remove('active');
                    this.querySelector('i').classList.replace('fas', 'far');
                } else {
                    savedBooks.push(bookToSave); // Save
                    this.classList.add('active');
                    this.querySelector('i').classList.replace('far', 'fas');
                }
                localStorage.setItem(`savedBooks_${currentUser}`, JSON.stringify(savedBooks));
            });
        });
    }

    // --- 4. MODAL & RATING ---
    const modal = document.getElementById('bookModal');
    const feedback = document.getElementById('ratingFeedback');

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
                    const safeTitle = encodeURIComponent(book.title);
                    const safeSource = encodeURIComponent(pdfLink);
                    window.location.href = `read.html?title=${safeTitle}&source=${safeSource}`;
                } else {
                    if(confirm("Silakan login dulu.")) window.location.href = 'login.html';
                }
            } else { alert("File tidak tersedia."); }
        };

        // Modal Rating Logic
        const modalStars = document.querySelectorAll('#modalStars i');
        const myRating = userRatings[book.title];
        const currentVal = myRating ? myRating.score : 0;

        updateModalStars(currentVal);
        feedback.innerText = myRating ? "Kamu sudah memberi rating ini." : "Sentuh bintang untuk menilai.";

        modalStars.forEach(star => {
            star.onclick = function() {
                if (!currentUser) {
                    if(confirm("Login dulu untuk memberi rating!")) window.location.href = 'login.html';
                    return;
                }
                const val = parseInt(this.getAttribute('data-val'));
                userRatings[book.title] = { score: val, date: new Date().toISOString() };
                localStorage.setItem('userRatings', JSON.stringify(userRatings));
                updateModalStars(val);
                feedback.innerText = "Terima kasih! Rating tersimpan.";
                renderBooks(searchInput.value, categoryFilter.value);
            }
        });

        modal.classList.add('active');
    }

    function updateModalStars(val) {
        document.querySelectorAll('#modalStars i').forEach(s => {
            const sVal = parseInt(s.getAttribute('data-val'));
            if (sVal <= val) s.classList.add('active');
            else s.classList.remove('active');
        });
    }

    window.closeModal = () => modal.classList.remove('active');
    if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) window.closeModal(); });

    // --- 5. INITIALIZE ---
    renderBooks();
    
    if(searchInput) {
        searchInput.addEventListener('input', (e) => renderBooks(e.target.value, categoryFilter.value));
    }
    if(categoryFilter) {
        categoryFilter.addEventListener('change', (e) => renderBooks(searchInput.value, e.target.value));
    }
});