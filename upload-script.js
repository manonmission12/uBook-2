document.addEventListener('DOMContentLoaded', () => {

    // --- 0. DARK MODE ---
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const icon = themeToggle.querySelector('i');
    
    // Set theme on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            root.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            icon.classList.replace('fa-sun', 'fa-moon');
        } else {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        }
    });

    // --- 1. AUTH & INIT ---
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) { window.location.href = 'index.html'; return; }
    document.getElementById('userDisplay').innerText = currentUser;
    const savedPhoto = localStorage.getItem(`profilePic_${currentUser}`);
    if (savedPhoto) document.querySelector('.avatar').src = savedPhoto;

    // --- 2. EDIT MODE CHECKER ---
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    let isEditMode = false;
    let existingBook = null;

    // Elemen Form
    const titleInput = document.getElementById('bookTitle');
    const authorInput = document.getElementById('bookAuthor');
    const catInput = document.getElementById('bookCategory');
    const linkInput = document.getElementById('bookLink');
    const dropZone = document.getElementById('dropZone');
    const thumbElement = document.createElement('div'); // Helper for thumbnail
    let finalBase64Img = null;

    if (editId) {
        // Cari buku yang mau diedit
        const myUploads = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');
        existingBook = myUploads.find(b => b.id === editId);

        if (existingBook) {
            isEditMode = true;
            // Ganti Judul Halaman
            document.querySelector('.card-header h1').innerText = "Edit Buku";
            document.querySelector('.card-header p').innerText = "Perbarui informasi bukumu.";
            document.querySelector('.btn-submit').innerText = "Simpan Perubahan";

            // Isi Form
            titleInput.value = existingBook.title;
            authorInput.value = existingBook.author;
            catInput.value = existingBook.category;
            linkInput.value = existingBook.pdf || '';
            
            // Tampilkan Gambar Lama
            finalBase64Img = existingBook.img;
            
            // Setup Thumbnail Manual
            thumbElement.classList.add('drop-zone__thumb');
            thumbElement.style.backgroundImage = `url('${finalBase64Img}')`;
            thumbElement.dataset.label = "Gambar Lama (Upload baru untuk mengganti)";
            
            if (dropZone.querySelector('.drop-zone__prompt')) {
                dropZone.querySelector('.drop-zone__prompt').remove();
            }
            dropZone.appendChild(thumbElement);
        }
    }

    // --- 3. DRAG & DROP LOGIC ---
    const inputElement = dropZone.querySelector('.drop-zone__input');
    
    dropZone.addEventListener('click', () => inputElement.click());

    inputElement.addEventListener('change', (e) => {
        if (inputElement.files.length) updateThumbnail(inputElement.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault(); dropZone.classList.add('drop-zone--over');
    });

    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => dropZone.classList.remove('drop-zone--over'));
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            inputElement.files = e.dataTransfer.files;
            updateThumbnail(e.dataTransfer.files[0]);
        }
        dropZone.classList.remove('drop-zone--over');
    });

    function updateThumbnail(file) {
        // Hapus elemen thumbnail lama/prompt
        dropZone.innerHTML = ''; 
        dropZone.appendChild(inputElement); // Keep input hidden

        const thumb = document.createElement('div');
        thumb.classList.add('drop-zone__thumb');
        thumb.dataset.label = file.name;
        dropZone.appendChild(thumb);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            finalBase64Img = reader.result;
            thumb.style.backgroundImage = `url('${reader.result}')`;
        };
    }

    // --- 4. SUBMIT (CREATE OR UPDATE) ---
    const uploadForm = document.getElementById('uploadForm');

    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!finalBase64Img) {
            alert("Harap sertakan cover buku!");
            return;
        }

        let myUploads = JSON.parse(localStorage.getItem('myUploadedBooks') || '[]');

        if (isEditMode) {
            // --- LOGIKA UPDATE ---
            const index = myUploads.findIndex(b => b.id === editId);
            if (index !== -1) {
                myUploads[index].title = titleInput.value;
                myUploads[index].author = authorInput.value;
                myUploads[index].category = catInput.value;
                myUploads[index].pdf = linkInput.value;
                myUploads[index].img = finalBase64Img; // Update gambar jika ada
            }
        } else {
            // --- LOGIKA CREATE BARU ---
            const newBook = {
                id: 'U' + Date.now(),
                title: titleInput.value,
                author: authorInput.value,
                category: catInput.value,
                rating: 0,
                img: finalBase64Img,
                pdf: linkInput.value,
                isUploaded: true,
                uploadedBy: currentUser
            };
            myUploads.push(newBook);
        }

        localStorage.setItem('myUploadedBooks', JSON.stringify(myUploads));

        // Feedback
        const btn = document.querySelector('.btn-submit');
        btn.innerText = isEditMode ? "Tersimpan!" : "Berhasil Upload!";
        btn.style.background = "#27ae60";
        
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1000);
    });

});