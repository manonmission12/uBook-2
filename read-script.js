document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SETUP PDF READER ---
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    } else {
        alert("Library PDF.js gagal dimuat. Cek koneksi internet.");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookTitle = urlParams.get('title') || 'Unknown_Book';
    const bookSource = urlParams.get('source');

    if(bookTitle) document.getElementById('bookTitleDisplay').innerText = bookTitle;

    let pdfDoc = null, pageNum = 1, scale = 1.0, pageRendering = false;
    const canvas = document.getElementById('the-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    
    // LAYERS
    const annotationLayer = document.getElementById('annotation-layer'); // Canvas Atas
    const textLayerDiv = document.getElementById('text-layer'); // Div Teks Tengah
    const highlightCanvas = document.getElementById('highlight-canvas');
    const hCtx = highlightCanvas.getContext('2d');
    
    // SIDEBAR
    const notesList = document.getElementById('notesList');
    const noteInput = document.getElementById('noteInput');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const notePageLabel = document.getElementById('notePageLabel');
    
    // STATE
    let isHighlightMode = false;
    let isEraserMode = false;
    let isDrawing = false;
    let startX, startY;
    
    const currentUser = localStorage.getItem('currentUser') || 'Tamu';
    const storageKey = `annotations_${currentUser}_${bookTitle}`;
    let annotationsData = JSON.parse(localStorage.getItem(storageKey) || '{}');

    // UI ELEMENTS
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pdfWrapper = document.getElementById('pdfWrapper');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const finishBtn = document.getElementById('finishBtn');
    const pageInfo = document.getElementById('pageInfo');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const highlightBtn = document.getElementById('highlightBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    const clearPageBtn = document.getElementById('clearPageBtn');

    // --- RENDER PAGE ---
    function renderPage(num) {
        if (!pdfDoc || !canvas) return;
        pageRendering = true;
        loadingOverlay.classList.add('active');

        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: scale });
            
            // 1. Set Ukuran Canvas & Wrapper
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            highlightCanvas.height = viewport.height;
            highlightCanvas.width = viewport.width;
            pdfWrapper.style.width = viewport.width + 'px';
            pdfWrapper.style.height = viewport.height + 'px';

            // 2. Render Gambar PDF
            const renderContext = { canvasContext: ctx, viewport: viewport };
            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                // 3. RENDER TEXT LAYER (AGAR BISA DIBLOK BIRU)
                return page.getTextContent();
            }).then(textContent => {
                // Reset Text Layer
                textLayerDiv.innerHTML = '';
                // Penting: Set CSS variable scale agar posisi teks pas
                textLayerDiv.style.setProperty('--scale-factor', scale);

                // PDF.js Render Text
                pdfjsLib.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });

                // Selesai
                finishRendering(num);

            }).catch(error => {
                console.error("Text Layer Error:", error);
                finishRendering(num);
            });

        }).catch(error => {
            console.error("Page Load Error:", error);
            loadingOverlay.classList.remove('active');
            pageRendering = false;
        });
    }

    function finishRendering(num) {
        pageRendering = false;
        loadingOverlay.classList.remove('active');
        
        if(pageInfo) pageInfo.innerText = `Hal ${num} / ${pdfDoc.numPages}`;
        if(notePageLabel) notePageLabel.innerText = `Hal ${num}`;

        loadAnnotationsForPage(num); // Gambar ulang stabilo kuning
        
        if (num === pdfDoc.numPages) {
            if(nextBtn) nextBtn.style.display = 'none';
            if(finishBtn) finishBtn.style.display = 'inline-block';
        } else {
            if(nextBtn) nextBtn.style.display = 'inline-block';
            if(finishBtn) finishBtn.style.display = 'none';
        }
    }

    // --- ANNOTATION (LOAD) ---
    function loadAnnotationsForPage(page) {
        hCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
        const pageData = annotationsData[page];
        if (pageData && pageData.highlights) {
            hCtx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            pageData.highlights.forEach(rect => {
                hCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
            });
        }
        renderSidebarNotes(page);
    }

    function renderSidebarNotes(page) {
        notesList.innerHTML = '';
        const pageData = annotationsData[page];
        const notes = (pageData && pageData.notes) ? pageData.notes : [];

        if (notes.length === 0) {
            notesList.innerHTML = '<div class="empty-notes">Belum ada catatan di halaman ini.</div>';
            return;
        }

        notes.forEach((note, index) => {
            const item = document.createElement('div');
            item.className = 'note-item';
            const dateObj = new Date(note.date);
            const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + 
                            dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' });

            item.innerHTML = `
                <div class="note-content">${note.text}</div>
                <span class="note-date">${dateStr}</span>
                <button class="btn-delete-note" title="Hapus"><i class="fas fa-trash"></i></button>
            `;
            item.querySelector('.btn-delete-note').onclick = () => {
                if(confirm('Hapus catatan ini?')) {
                    notes.splice(index, 1);
                    saveData();
                    renderSidebarNotes(page);
                }
            };
            notesList.appendChild(item);
        });
        notesList.scrollTop = notesList.scrollHeight;
    }

    function saveData() {
        localStorage.setItem(storageKey, JSON.stringify(annotationsData));
    }

    if(addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            const text = noteInput.value.trim();
            if (!text) return;
            if (!annotationsData[pageNum]) annotationsData[pageNum] = { highlights: [], notes: [] };
            if (!annotationsData[pageNum].notes) annotationsData[pageNum].notes = [];
            annotationsData[pageNum].notes.push({ text: text, date: new Date().toISOString() });
            saveData();
            renderSidebarNotes(pageNum);
            noteInput.value = '';
        });
    }

    // --- TOOLBAR & LOGIKA SAKLAR (SWITCH LOGIC) ---
    // Ini bagian penting agar bisa blok teks
    function setActiveTool(tool) {
        isHighlightMode = (tool === 'highlight');
        isEraserMode = (tool === 'eraser');
        
        highlightBtn.classList.toggle('active', isHighlightMode);
        eraserBtn.classList.toggle('active', isEraserMode);

        if (isHighlightMode || isEraserMode) {
            // MODE ALAT AKTIF (Stabilo/Hapus):
            // 1. Aktifkan Canvas Atas (pointer-events: auto) agar bisa menerima klik/drag
            annotationLayer.style.pointerEvents = 'auto';
            // 2. Matikan Text Layer (pointer-events: none) agar kursor tidak berubah jadi 'I-beam' (teks select)
            textLayerDiv.style.pointerEvents = 'none';
            
            highlightCanvas.style.cursor = isEraserMode ? 'default' : 'crosshair';
        } else {
            // MODE NORMAL (Mati):
            // 1. Matikan Canvas Atas (pointer-events: none) agar klik tembus ke bawah
            annotationLayer.style.pointerEvents = 'none';
            // 2. Aktifkan Text Layer (pointer-events: auto) agar BISA BLOK TEKS
            textLayerDiv.style.pointerEvents = 'auto';
            
            highlightCanvas.style.cursor = 'default';
        }
    }

    highlightBtn.addEventListener('click', () => setActiveTool(isHighlightMode ? '' : 'highlight'));
    eraserBtn.addEventListener('click', () => setActiveTool(isEraserMode ? '' : 'eraser'));

    // --- DRAWING LOGIC ---
    function getCanvasCoordinates(e) {
        const rect = highlightCanvas.getBoundingClientRect();
        let clientX, clientY;
        if(e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX; clientY = e.clientY;
        }
        return {
            x: (clientX - rect.left) * (highlightCanvas.width / rect.width),
            y: (clientY - rect.top) * (highlightCanvas.height / rect.height)
        };
    }

    highlightCanvas.addEventListener('mousedown', handleMouseDown);
    highlightCanvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    highlightCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleMouseDown(e); }, {passive: false});
    highlightCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMouseMove(e); }, {passive: false});
    window.addEventListener('touchend', (e) => { handleMouseUp(e); });

    function handleMouseDown(e) {
        if (!isHighlightMode && !isEraserMode) return;
        const coords = getCanvasCoordinates(e);
        isDrawing = true; 
        if (isEraserMode) { performEraser(coords.x, coords.y); } 
        else if (isHighlightMode) { startX = coords.x; startY = coords.y; }
    }

    function handleMouseMove(e) {
        if (!isDrawing) return;
        const coords = getCanvasCoordinates(e);
        if (isEraserMode) { performEraser(coords.x, coords.y); } 
        else if (isHighlightMode) {
            loadAnnotationsForPage(pageNum); 
            const rectX = Math.min(startX, coords.x);
            const rectY = Math.min(startY, coords.y);
            const rectW = Math.abs(coords.x - startX);
            const rectH = Math.abs(coords.y - startY);
            hCtx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            hCtx.fillRect(rectX, rectY, rectW, rectH);
            hCtx.strokeStyle = 'rgba(200, 200, 0, 0.8)'; hCtx.lineWidth = 1;
            hCtx.strokeRect(rectX, rectY, rectW, rectH);
        }
    }

    function handleMouseUp(e) {
        if (!isDrawing) return;
        isDrawing = false;
        if (isHighlightMode) {
            let endX = startX, endY = startY;
            if (e.target === highlightCanvas || e.type === 'touchend') {
                // Simplifikasi: ambil koordinat terakhir atau mouseup
                const coords = getCanvasCoordinates(e); 
                endX = coords.x; endY = coords.y;
            }
            // Jika touchend, coords mungkin tidak akurat di sini, tapi untuk demo ini cukup
            // Idealnya simpan lastMoveCoords di handleMouseMove

            const rectX = Math.min(startX, endX);
            const rectY = Math.min(startY, endY);
            const rectW = Math.abs(endX - startX);
            const rectH = Math.abs(endY - startY);

            if (rectW > 5 && rectH > 5) {
                if (!annotationsData[pageNum]) annotationsData[pageNum] = { highlights: [], notes: [] };
                if (!annotationsData[pageNum].highlights) annotationsData[pageNum].highlights = [];
                annotationsData[pageNum].highlights.push({ x: rectX, y: rectY, w: rectW, h: rectH });
                saveData();
                loadAnnotationsForPage(pageNum);
            } else {
                loadAnnotationsForPage(pageNum);
            }
        }
    }

    function performEraser(x, y) {
        const pageData = annotationsData[pageNum];
        if (!pageData || !pageData.highlights) return;
        let isDeleted = false;
        for (let i = pageData.highlights.length - 1; i >= 0; i--) {
            const rect = pageData.highlights[i];
            if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
                pageData.highlights.splice(i, 1);
                isDeleted = true;
            }
        }
        if (isDeleted) { saveData(); loadAnnotationsForPage(pageNum); }
    }

    clearPageBtn.addEventListener('click', () => {
        if(confirm("Hapus semua coretan & catatan di halaman ini?")) {
            delete annotationsData[pageNum];
            saveData();
            loadAnnotationsForPage(pageNum);
        }
    });

    function animateAndRender(direction) {
        if (pageRendering) return;
        const animClass = direction === 'next' ? 'page-flip-next' : 'page-flip-prev';
        pdfWrapper.classList.add(animClass);
        setTimeout(() => {
            if (direction === 'next') pageNum++; else pageNum--;
            renderPage(pageNum);
            setTimeout(() => { pdfWrapper.classList.remove(animClass); }, 300);
        }, 300);
    }

    if(prevBtn) prevBtn.addEventListener('click', () => { if (pageNum <= 1) return; animateAndRender('prev'); });
    if(nextBtn) nextBtn.addEventListener('click', () => { if (pdfDoc && pageNum >= pdfDoc.numPages) return; animateAndRender('next'); });
    if(zoomInBtn) zoomInBtn.addEventListener('click', () => { scale += 0.2; if(zoomLevelDisplay) zoomLevelDisplay.innerText = Math.round(scale*100)+'%'; renderPage(pageNum); });
    if(zoomOutBtn) zoomOutBtn.addEventListener('click', () => { if(scale > 0.5) scale -= 0.2; if(zoomLevelDisplay) zoomLevelDisplay.innerText = Math.round(scale*100)+'%'; renderPage(pageNum); });

    if (bookSource) {
        loadingOverlay.classList.add('active');
        pdfjsLib.getDocument(bookSource).promise.then(doc => {
            pdfDoc = doc; renderPage(pageNum);
        }).catch(err => {
            console.error("Error loading PDF:", err);
            loadingOverlay.classList.remove('active');
            alert("Gagal memuat PDF. Pastikan link benar dan file public.");
        });
    } else {
        loadingOverlay.classList.remove('active');
    }

    // Rating (Standard)
    const ratingModal = document.getElementById('ratingModal');
    const stars = document.querySelectorAll('.star-widget i');
    const ratingInput = document.getElementById('ratingScore'); 
    let currentRating = 0;

    if(finishBtn) finishBtn.addEventListener('click', () => { if(ratingModal) ratingModal.classList.add('active'); });
    stars.forEach(star => { star.addEventListener('click', () => { updateUI(parseInt(star.getAttribute('data-value'))); }); });
    if(ratingInput) ratingInput.addEventListener('input', function() {
        let val = parseFloat(this.value); if (isNaN(val)) val = 0; if (val > 5) val = 5; if (val < 0) val = 0; updateUI(val);
    });

    function updateUI(val) {
        currentRating = val;
        if(ratingInput) ratingInput.value = val;
        stars.forEach(s => {
            const sVal = parseInt(s.getAttribute('data-value'));
            s.classList.remove('active'); s.style.background = ''; s.style.webkitBackgroundClip = ''; s.style.webkitTextFillColor = ''; s.style.color = '#ddd';
            if (val >= sVal) { s.classList.add('active'); s.style.color = '#f59e0b'; }
            else if (val > sVal - 1) {
                const percentage = (val - (sVal - 1)) * 100;
                s.style.background = `linear-gradient(90deg, #f59e0b ${percentage}%, #ddd ${percentage}%)`;
                s.style.webkitBackgroundClip = 'text'; s.style.webkitTextFillColor = 'transparent'; s.style.display = 'inline-block';
            }
        });
    }

    const submitBtn = document.getElementById('submitRatingBtn');
    if(submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (currentRating <= 0) { alert("Beri nilai dulu ya!"); return; }
            const review = document.getElementById('ratingReview') ? document.getElementById('ratingReview').value : "";
            const finalTitle = bookTitle;
            const allRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
            allRatings[finalTitle] = { score: parseFloat(currentRating), review: review, user: currentUser, date: new Date().toISOString() };
            localStorage.setItem('userRatings', JSON.stringify(allRatings));
            
            const history = JSON.parse(localStorage.getItem(`readingHistory_${currentUser}`) || '{}');
            history[finalTitle] = 'finished'; 
            localStorage.setItem(`readingHistory_${currentUser}`, JSON.stringify(history));

            alert("Terima kasih! Rating tersimpan. ⭐");
            window.location.href = 'index.html';
        });
    }

    const skipBtn = document.getElementById('skipRatingBtn');
    if(skipBtn) skipBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
});