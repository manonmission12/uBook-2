document.addEventListener('DOMContentLoaded', () => {
    // 0. SET WORKER (WAJIB)
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    // 1. AMBIL URL PARAMETER
    const urlParams = new URLSearchParams(window.location.search);
    const bookTitle = urlParams.get('title');
    const bookSource = urlParams.get('source');

    if(bookTitle) document.getElementById('bookTitleDisplay').innerText = bookTitle;

    // 2. SETUP VARIABLE
    let pdfDoc = null, pageNum = 1, scale = 1.0, pageRendering = false;
    const canvas = document.getElementById('the-canvas');
    const ctx = canvas.getContext('2d');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // 3. RENDER HALAMAN
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
                document.getElementById('pageInfo').innerText = `Hal ${num} / ${pdfDoc.numPages}`;
            });
        });
    }

    // 4. QUEUE RENDER
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

    // 5. ZOOM
    document.getElementById('zoomIn').addEventListener('click', () => { scale += 0.2; document.getElementById('zoomLevel').innerText = Math.round(scale*100)+'%'; renderPage(pageNum); });
    document.getElementById('zoomOut').addEventListener('click', () => { if(scale>0.5) scale -= 0.2; document.getElementById('zoomLevel').innerText = Math.round(scale*100)+'%'; renderPage(pageNum); });

    // 6. LOAD DOKUMEN
    if (bookSource) {
        loadingOverlay.classList.add('active');
        pdfjsLib.getDocument(bookSource).promise.then(doc => {
            pdfDoc = doc;
            renderPage(pageNum);
        }).catch(err => {
            console.error(err);
            alert("Gagal memuat buku. Pastikan file PDF ada di folder yang benar dan namanya sesuai.");
            loadingOverlay.classList.remove('active');
        });
    } else {
        alert("Buku tidak ditemukan! Cek URL.");
        loadingOverlay.classList.remove('active');
    }
});