document.addEventListener('DOMContentLoaded', () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    const urlParams = new URLSearchParams(window.location.search);
    const bookTitle = urlParams.get('title');
    const bookSource = urlParams.get('source');

    if(bookTitle) document.getElementById('bookTitleDisplay').innerText = bookTitle;

    let pdfDoc = null, pageNum = 1, scale = 1.0, pageRendering = false;
    const canvas = document.getElementById('the-canvas');
    const ctx = canvas.getContext('2d');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Element Navigasi
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    const pageInfo = document.getElementById('pageInfo');

    function renderPage(num) {
        pageRendering = true;
        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = { canvasContext: ctx, viewport: viewport };
            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                pageRendering = false;
                loadingOverlay.classList.remove('active');
                pageInfo.innerText = `Hal ${num} / ${pdfDoc.numPages}`;

                // --- LOGIKA TOMBOL SELESAI ---
                // Jika di halaman terakhir, sembunyikan Next, munculkan Finish
                if (num === pdfDoc.numPages) {
                    nextBtn.style.display = 'none';
                    finishBtn.style.display = 'inline-block';
                } else {
                    nextBtn.style.display = 'inline-block';
                    finishBtn.style.display = 'none';
                }
            });
        });
    }

    function queueRenderPage(num) {
        if (pageRendering) return;
        renderPage(num);
    }

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });

    // Zoom
    document.getElementById('zoomIn').addEventListener('click', () => { scale += 0.2; document.getElementById('zoomLevel').innerText = Math.round(scale*100)+'%'; renderPage(pageNum); });
    document.getElementById('zoomOut').addEventListener('click', () => { if(scale>0.5) scale -= 0.2; document.getElementById('zoomLevel').innerText = Math.round(scale*100)+'%'; renderPage(pageNum); });

    // Load PDF
    if (bookSource) {
        loadingOverlay.classList.add('active');
        pdfjsLib.getDocument(bookSource).promise.then(doc => {
            pdfDoc = doc;
            renderPage(pageNum);
        }).catch(err => {
            console.error(err);
            alert("Gagal memuat buku.");
            loadingOverlay.classList.remove('active');
        });
    } else {
        alert("Buku tidak ditemukan!");
        loadingOverlay.classList.remove('active');
    }

    // --- LOGIKA RATING SYSTEM (BARU) ---
    const ratingModal = document.getElementById('ratingModal');
    const stars = document.querySelectorAll('.star-widget i');
    let selectedRating = 0;

    // 1. Klik Tombol Selesai -> Muncul Modal
    finishBtn.addEventListener('click', () => {
        ratingModal.classList.add('active');
    });

    // 2. Klik Bintang
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            updateStars(selectedRating);
        });
    });

    function updateStars(rating) {
        stars.forEach(s => {
            const val = parseInt(s.getAttribute('data-value'));
            if (val <= rating) s.classList.add('active');
            else s.classList.remove('active');
        });
    }

    // 3. Kirim Rating
    document.getElementById('submitRatingBtn').addEventListener('click', () => {
        if (selectedRating === 0) { alert("Pilih minimal 1 bintang ya!"); return; }
        
        const review = document.getElementById('ratingReview').value;
        const currentUser = localStorage.getItem('currentUser') || 'Tamu';

        // Simpan ke LocalStorage: userRatings = { "Judul Buku": { score: 5, review: "..." } }
        const allRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
        
        allRatings[bookTitle] = {
            score: selectedRating,
            review: review,
            user: currentUser,
            date: new Date().toISOString()
        };

        localStorage.setItem('userRatings', JSON.stringify(allRatings));

        alert("Terima kasih atas ratingnya! ⭐");
        window.location.href = 'index.html'; // Kembali ke Beranda
    });

    // 4. Tombol Nanti Saja
    document.getElementById('skipRatingBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});