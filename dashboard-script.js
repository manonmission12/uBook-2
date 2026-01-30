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

    // --- 1. AUTH CHECK & NAVBAR ---
    const currentUser = localStorage.getItem('currentUser'); 
    const navLinks = document.getElementById('navLinks');
    const authButtons = document.getElementById('authButtons');

    if (currentUser) {
        // Jika Login
        if(navLinks) {
            navLinks.innerHTML = `
                <a href="index.html" class="nav-link active">Beranda</a>
                <a href="upload.html" class="nav-link">Upload Buku</a>
                <a href="profile.html" class="nav-link">Koleksiku</a>
            `;
        }
        if(authButtons) {
            authButtons.innerHTML = `
                <button onclick="window.location.href='profile.html'" class="icon-btn" title="Profil">
                    <i class="fas fa-user"></i>
                </button>
                <button id="logoutBtn" class="icon-btn" style="color: #ef4444;" title="Keluar">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                if(confirm('Yakin ingin keluar?')) {
                    localStorage.removeItem('currentUser');
                    window.location.reload(); 
                }
            });
        }
    } else {
        // Jika Tamu
        if(navLinks) {
            navLinks.innerHTML = `<a href="index.html" class="nav-link active">Beranda</a>`;
        }
        if(authButtons) {
            authButtons.innerHTML = `
                <a href="login.html" class="nav-btn" style="text-decoration:none; color:var(--text-primary); font-weight:600; margin-right:15px;">Masuk</a>
                <a href="signup.html" class="nav-btn" style="background:var(--text-primary); color:var(--bg-card); padding:8px 20px; border-radius:20px; text-decoration:none; font-weight:600;">Daftar</a>
            `;
        }
    }

    // --- 2. DATA BUKU (16 Buku Default) ---
    const defaultBooks = [
        { id: "B1", title: "Filosofi Teras", author: "Henry Manampiring", category: "Filsafat", img: "covers/filosofi teras.png", pdf: "books/1. Filosofi Teras.pdf" },
        { id: "B2", title: "This is Marketing", author: "Seth Godin", category: "Bisnis", img: "covers/this is marketing.png", pdf: "books/2. This is marketing.pdf" },
        { id: "B3", title: "Atomic Habits", author: "James Clear", category: "Self-Improvement", img: "covers/atomic habits.png", pdf: "books/3. Atomic Habits.pdf" },
        { id: "B4", title: "Psychology of Money", author: "Morgan Housel", category: "Self-Improvement", img: "covers/the psychology of money.png", pdf: "books/4. The Psychology of Money.pdf" },
        { id: "B5", title: "Citizen 4.0", author: "Hermawan Kartajaya", category: "Bisnis", img: "covers/citizen 4.0.png", pdf: "books/5. Citizen 4.0.pdf" },
        { id: "B6", title: "Find Your Why", author: "Simon Sinek", category: "Self-Improvement", img: "covers/find your why.png", pdf: "books/6. Find your why.pdf" },
        { id: "B7", title: "How To Win Friends", author: "Dale Carnegie", category: "Self-Improvement", img: "covers/how to win friends&influence people.png", pdf: "books/7. How to win friend & influence people.pdf" },
        { id: "B8", title: "Marketing 4.0", author: "Philip Kotler", category: "Bisnis", img: "covers/marketing 4.0.png", pdf: "books/8. Marketing 4.0.pdf" },
        { id: "B9", title: "Marketing in Crisis", author: "Rhenald Kasal", category: "Bisnis", img: "covers/marketing in crisis.png", pdf: "books/9. Marketing in Crisis.pdf" },
        { id: "B10", title: "Mindset", author: "Dr. Carol S. Dweck", category: "Self-Improvement", img: "covers/mindset.png", pdf: "books/10. Mindset.pdf" },
        { id: "B11", title: "Bodo Amat", author: "Mark Manson", category: "Self-Improvement", img: "covers/sebuah seni untuk bersikap bodo amat.png", pdf: "books/11. Sebuah Seni untuk Bersikap Bodo Amat.pdf" },
        { id: "B12", title: "Thinking, Fast & Slow", author: "Daniel Kahneman", category: "Self-Improvement", img: "covers/thinking fast and slow.png", pdf: "books/12. Thinking, fast and slow.pdf" },
        { id: "B13", title: "Grit", author: "Angela Duckworth", category: "Self-Improvement", img: "covers/grit.png", pdf: "books/grit.pdf" },
        { id: "B14", title: "Show Your Work", author: "Austin Kleon", category: "Self-Improvement", img: "covers/Show Your Work.png", pdf: "books/14. Show your work.pdf" },
        { id: "B15", title: "Intelligent Investor", author: "Benjamin Graham", category: "Bisnis", img: "covers/the intelligent investor.png", pdf: "books/15. The Intelligent Investor.pdf" },
        { id: "B16", title: "Think Like a Freak", author: "Steven D. Levitt", category: "Self-Improvement", img: "covers/think like a freak.png", pdf: "books/16. Think like a freak.pdf" }
    ];

    let uploadedBooks = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
    let allBooks = [...uploadedBooks.reverse(), ...defaultBooks]; 

    // --- 3. RENDER BUKU ---
    const bookGrid = document.getElementById('bookGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    function renderBooks(filterText = '', category = 'all') {
        if (!bookGrid) return;
        bookGrid.innerHTML = '';

        const filtered = allBooks.filter(b => {
            const matchText = b.title.toLowerCase().includes(filterText.toLowerCase()) || b.author.toLowerCase().includes(filterText.toLowerCase());
            const matchCat = category === 'all' || b.category === category;
            return matchText && matchCat;
        });

        if (filtered.length === 0) {
            bookGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-tertiary); margin-top:40px;"><p>Buku tidak ditemukan.</p></div>`;
            return;
        }

        filtered.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            const imgSrc = book.img || book.image || book.cover;
            
            card.innerHTML = `
                <img src="${imgSrc}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Cover'">
                <div class="book-info">
                    <span class="tag">${book.category}</span>
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                </div>
            `;
            card.addEventListener('click', () => openModal(book));
            bookGrid.appendChild(card);
        });
    }

    // --- 4. MODAL & PROTEKSI BACA ---
    const modal = document.getElementById('bookModal');

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
                    // JIKA LOGIN: Encode URL & Buka
                    const safeTitle = encodeURIComponent(book.title);
                    const safeSource = encodeURIComponent(pdfLink);
                    window.location.href = `read.html?title=${safeTitle}&source=${safeSource}`;
                } else {
                    // JIKA TAMU: Arahkan ke Login
                    if(confirm("Silakan login dulu untuk membaca buku ini.")) {
                        window.location.href = 'login.html';
                    }
                }
            } else {
                alert("File buku belum tersedia.");
            }
        };

        modal.classList.add('active');
    }

    window.closeModal = () => modal.classList.remove('active');
    if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) window.closeModal(); });

    // Init
    renderBooks();
    if(searchInput) searchInput.addEventListener('input', (e) => renderBooks(e.target.value, categoryFilter.value));
    if(categoryFilter) categoryFilter.addEventListener('change', (e) => renderBooks(searchInput.value, e.target.value));
});