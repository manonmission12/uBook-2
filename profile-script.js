document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. DARK MODE ---
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    }

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = root.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                root.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if(icon) icon.classList.replace('fa-sun', 'fa-moon');
            } else {
                root.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if(icon) icon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    // --- 1. USER AUTH & LOAD PROFILE ---
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) { window.location.href = 'index.html'; return; }

    // Elements
    const dispName = document.getElementById('profileName');
    const dispEmail = document.getElementById('profileEmail');
    const dispBio = document.getElementById('profileBio');
    const navName = document.querySelector('.user-name');
    const navAvatar = document.getElementById('navAvatar');
    const profileImg = document.getElementById('profileImg');

    // Load Data Profil Custom (Jika ada)
    const profileKey = `userProfileData_${currentUser}`;
    let profileData = JSON.parse(localStorage.getItem(profileKey)) || {
        fullName: currentUser, // Default ke username jika belum diset
        email: `${currentUser.toLowerCase().replace(/\s/g, '')}@student.com`,
        bio: "Penggemar buku yang rajin."
    };

    // Update UI
    function updateProfileUI() {
        dispName.innerText = profileData.fullName;
        dispEmail.innerText = profileData.email;
        dispBio.innerText = profileData.bio;
        navName.innerText = profileData.fullName; // Update nama di navbar juga
    }
    updateProfileUI();
    
    // Load Avatar
    const savedPhoto = localStorage.getItem(`profilePic_${currentUser}`);
    if (savedPhoto) {
        profileImg.src = savedPhoto;
        navAvatar.src = savedPhoto;
    }

    // Avatar Upload Logic
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgResult = e.target.result;
                profileImg.src = imgResult;
                navAvatar.src = imgResult;
                localStorage.setItem(`profilePic_${currentUser}`, imgResult);
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 2. EDIT PROFILE MODAL LOGIC ---
    const editModal = document.getElementById('editProfileModal');
    const btnOpenEdit = document.getElementById('btnOpenEditProfile');
    const editForm = document.getElementById('editProfileForm');

    // Buka Modal & Isi Value Lama
    btnOpenEdit.addEventListener('click', () => {
        document.getElementById('inputFullName').value = profileData.fullName;
        document.getElementById('inputEmail').value = profileData.email;
        document.getElementById('inputBio').value = profileData.bio;
        editModal.classList.add('active');
    });

    // Tutup Modal
    window.closeEditModal = () => { editModal.classList.remove('active'); };
    
    // Simpan Data
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Update Data Object
        profileData.fullName = document.getElementById('inputFullName').value;
        profileData.email = document.getElementById('inputEmail').value;
        profileData.bio = document.getElementById('inputBio').value;

        // Simpan ke LocalStorage
        localStorage.setItem(profileKey, JSON.stringify(profileData));

        // Refresh UI & Tutup
        updateProfileUI();
        closeEditModal();
        alert("Profil berhasil diperbarui!");
    });


    // --- 3. DATA LOAD (BOOKS) ---
    let savedBooks = [];
    let myUploads = [];
    const savedListEl = document.getElementById('savedList');
    const uploadedListEl = document.getElementById('uploadedList');

    function loadBooks() {
        savedBooks = JSON.parse(localStorage.getItem(`savedBooks_${currentUser}`) || '[]');
        myUploads = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
        
        document.getElementById('statCollection').innerText = savedBooks.length;
        document.getElementById('statUploads').innerText = myUploads.length;
        
        applyFilters(); 
    }

    // --- 4. FILTER, SEARCH & SORT ---
    const searchInput = document.getElementById('profileSearch');
    const sortSelect = document.getElementById('profileSort');
    const tabs = document.querySelectorAll('.tab-btn');
    let currentTab = 'koleksi';

    searchInput.addEventListener('input', applyFilters);
    sortSelect.addEventListener('change', applyFilters);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-target')).classList.add('active');
            currentTab = tab.getAttribute('data-target');
            applyFilters();
        });
    });

    function applyFilters() {
        const keyword = searchInput.value.toLowerCase();
        const sortType = sortSelect.value;
        let data = currentTab === 'koleksi' ? [...savedBooks] : [...myUploads];

        if (keyword) {
            data = data.filter(b => b.title.toLowerCase().includes(keyword) || b.author.toLowerCase().includes(keyword));
        }

        data.sort((a, b) => {
            if (sortType === 'az') return a.title.localeCompare(b.title);
            if (sortType === 'za') return b.title.localeCompare(a.title);
            return (b.id > a.id) ? 1 : -1; // Newest default
        });

        const container = currentTab === 'koleksi' ? savedListEl : uploadedListEl;
        const isUploadMode = (currentTab === 'upload');
        renderList(data, container, "Buku tidak ditemukan.", isUploadMode);
    }

    function renderList(data, container, emptyMsg, isUploadMode) {
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>${emptyMsg}</p></div>`;
            return;
        }

        data.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            const imgSrc = book.img || 'https://via.placeholder.com/300x450';
            
            let actionButtons = '';
            if (isUploadMode) {
                actionButtons = `
                    <div class="card-actions">
                        <button class="action-btn btn-edit" title="Edit Buku"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn btn-delete" title="Hapus Buku"><i class="fas fa-trash-alt"></i></button>
                    </div>`;
            }

            card.innerHTML = `
                ${actionButtons}
                <img src="${imgSrc}" alt="${book.title}">
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                </div>
            `;

            if (isUploadMode) {
                card.querySelector('.btn-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `upload.html?edit=${book.id}`;
                });
                card.querySelector('.btn-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Hapus "${book.title}" permanen?`)) deleteBook(book.id);
                });
            }
            container.appendChild(card);
        });
    }

    function deleteBook(id) {
        let uploads = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
        const updated = uploads.filter(b => b.id !== id);
        localStorage.setItem('myUploadedBooks', JSON.stringify(updated));
        loadBooks();
    }

    document.getElementById('logoutBtnProfile').addEventListener('click', () => {
        if(confirm('Keluar akun?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });

    loadBooks();
});