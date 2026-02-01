document.addEventListener('DOMContentLoaded', () => {
    
    // --- CEK LIBRARY ---
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    } else {
        alert("Library PDF.js gagal dimuat. Cek koneksi internet.");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookTitle = urlParams.get('title') || 'Unknown_Book';
    const bookSource = urlParams.get('source');

    if(bookTitle) document.getElementById('bookTitleDisplay').innerText = bookTitle;

    // --- CONFIG & STATE ---
    let pdfDoc = null;
    let pageNum = 1;
    let scale = 1.5; // Zoom Default
    let pageRendering = false; // Flag render aktif
    let pageNumPending = null; // Antrian halaman jika user klik cepat
    let isPageChanging = false; // Flag anti-double scroll
    
    // --- DOM ELEMENTS ---
    const canvas = document.getElementById('the-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const annotationLayer = document.getElementById('annotation-layer');
    const textLayerDiv = document.getElementById('text-layer');
    const highlightCanvas = document.getElementById('highlight-canvas');
    const hCtx = highlightCanvas.getContext('2d');
    
    const pdfWrapper = document.getElementById('pdfWrapper');
    const pdfContainer = document.getElementById('pdfContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pageNavList = document.getElementById('pageNavList');
    
    // Controls
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const finishBtn = document.getElementById('finishBtn');
    const pageInfo = document.getElementById('pageInfo');
    const notePageLabel = document.getElementById('notePageLabel');
    const zoomLevelDisplay = document.getElementById('zoomLevel');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    
    // Tools
    const highlightBtn = document.getElementById('highlightBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    const clearPageBtn = document.getElementById('clearPageBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    // Sidebar Notes
    const notesList = document.getElementById('notesList');
    const noteInput = document.getElementById('noteInput');
    const addNoteBtn = document.getElementById('addNoteBtn');

    // Data Annotation & History
    let isHighlightMode = false, isEraserMode = false, isDrawing = false;
    let startX, startY;
    let undoStack = [], redoStack = [];
    
    const currentUser = localStorage.getItem('currentUser') || 'Tamu';
    const storageKey = `annotations_${currentUser}_${bookTitle}`;
    let annotationsData = JSON.parse(localStorage.getItem(storageKey) || '{}');

    // --- FUNGSI RENDER HALAMAN (OPTIMASI SPEED) ---
    function renderPage(num) {
        pageRendering = true;
        loadingOverlay.classList.add('active'); // Tampilkan loading
        
        // Reset state
        undoStack = []; redoStack = []; 

        // Fetch Page
        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: scale });
            
            // --- 1. OPTIMASI RESOLUSI (HD LIMIT) ---
            // Batasi max 2.0x device pixel ratio agar tidak berat di layar 4K/Retina
            const outputScale = Math.min(window.devicePixelRatio || 1, 2.0);

            // Hitung Ukuran Tampilan vs Ukuran Render
            const displayWidth = Math.floor(viewport.width);
            const displayHeight = Math.floor(viewport.height);

            // Set Ukuran Canvas Internal (Untuk Kualitas Gambar)
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            
            // Set Ukuran Canvas Stabilo (Sama dengan gambar)
            highlightCanvas.width = Math.floor(viewport.width * outputScale);
            highlightCanvas.height = Math.floor(viewport.height * outputScale);

            // Set Ukuran Tampilan CSS (Agar pas di layar)
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;
            highlightCanvas.style.width = `${displayWidth}px`;
            highlightCanvas.style.height = `${displayHeight}px`;
            
            // Set Ukuran Wrapper (Penting untuk Text Layer)
            pdfWrapper.style.width = `${displayWidth}px`;
            pdfWrapper.style.height = `${displayHeight}px`;

            // Transform Context agar koordinat 1.0 = 1 pixel CSS
            hCtx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

            // --- 2. RENDER GAMBAR (PRIORITAS UTAMA) ---
            const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
            
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport,
                transform: transform
            };
            
            const renderTask = page.render(renderContext);

            // WAIT FOR IMAGE RENDER ONLY
            renderTask.promise.then(() => {
                // --- 3. GAMBAR SELESAI -> LANGSUNG BUKA UI (SPEED TRICK) ---
                // Kita tidak menunggu text layer selesai untuk mematikan loading
                pageRendering = false;
                loadingOverlay.classList.remove('active'); 
                
                // Cek apakah ada halaman lain yang antri (jika user klik next cepat2)
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }

                // Update Info UI
                updatePageInfoUI(num);
                
                // Reset Scroll Container ke Atas
                pdfContainer.scrollTop = 0;
                
                // Reset Flag Scroll Flip
                setTimeout(() => { isPageChanging = false; }, 300);

                // --- 4. RENDER TEKS (BACKGROUND PROCESS) ---
                // Jalan di belakang layar agar user tidak merasa lambat
                return page.getTextContent();
            }).then(textContent => {
                // Bersihkan Text Layer Lama
                textLayerDiv.innerHTML = '';
                textLayerDiv.style.setProperty('--scale-factor', scale);

                // Render Text Layer Baru
                pdfjsLib.renderTextLayer({
                    textContent: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
                
                // Load Coretan Stabilo
                loadAnnotationsForPage(num);

            }).catch(error => {
                console.warn("Text Layer Error (Non-Fatal):", error);
                // Jika text layer gagal, minimal gambar sudah ada. Loading tetap mati.
                loadingOverlay.classList.remove('active');
            });

        }).catch(error => {
            console.error("Critical Render Error:", error);
            loadingOverlay.classList.remove('active'); // Pastikan loading mati kalau error
            pageRendering = false;
        });
    }

    // Fungsi antrian render (jika user klik cepat)
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    function updatePageInfoUI(num) {
        if(pageInfo) pageInfo.innerText = `Hal ${num} / ${pdfDoc.numPages}`;
        if(notePageLabel) notePageLabel.innerText = `Hal ${num}`;
        if(zoomLevelDisplay) zoomLevelDisplay.innerText = Math.round(scale * 100) + '%';
        
        // Update Sidebar Highlight
        updatePageNavHighlight(num);
        
        // Update Notes
        renderSidebarNotes(num);

        // Tombol Navigasi
        if (num === pdfDoc.numPages) {
            if(nextBtn) nextBtn.style.display = 'none';
            if(finishBtn) finishBtn.style.display = 'inline-block';
        } else {
            if(nextBtn) nextBtn.style.display = 'inline-block';
            if(finishBtn) finishBtn.style.display = 'none';
        }
    }

    // --- LOGIKA SCROLL TO FLIP (PINDAH HALAMAN DENGAN SCROLL) ---
    pdfContainer.addEventListener('wheel', (e) => {
        // Stop jika sedang render atau baru saja ganti halaman
        if (pageRendering || isPageChanging) return;

        const scrollTop = pdfContainer.scrollTop;
        const scrollHeight = pdfContainer.scrollHeight;
        const clientHeight = pdfContainer.clientHeight;
        
        // Toleransi 5px untuk presisi browser
        const isAtBottom = (scrollTop + clientHeight >= scrollHeight - 5);
        const isAtTop = (scrollTop <= 0);

        // SCROLL BAWAH (Next Page)
        if (e.deltaY > 0 && isAtBottom) { 
            if (pageNum < pdfDoc.numPages) {
                isPageChanging = true;
                pageNum++;
                queueRenderPage(pageNum);
            }
        } 
        // SCROLL ATAS (Prev Page)
        else if (e.deltaY < 0 && isAtTop) {
            if (pageNum > 1) {
                isPageChanging = true;
                pageNum--;
                queueRenderPage(pageNum);
            }
        }
    }, { passive: true }); // Passive true untuk performa scroll

    // --- TOMBOL NAVIGASI MANUAL ---
    if(prevBtn) prevBtn.addEventListener('click', () => { 
        if (pageNum <= 1) return; 
        pageNum--; queueRenderPage(pageNum); 
    });
    
    if(nextBtn) nextBtn.addEventListener('click', () => { 
        if (pdfDoc && pageNum >= pdfDoc.numPages) return; 
        pageNum++; queueRenderPage(pageNum); 
    });

    // --- SIDEBAR THUMBNAIL (LAZY LOADING) ---
    function generatePageNavigation(total) {
        pageNavList.innerHTML = '';
        
        // Setup Intersection Observer (Hanya render yang terlihat)
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.dataset.rendered === "false") {
                    renderThumbnail(entry.target);
                    entry.target.dataset.rendered = "true";
                    obs.unobserve(entry.target); // Stop pantau setelah render
                }
            });
        }, { 
            root: pageNavList, 
            rootMargin: '100px', // Buffer loading
            threshold: 0.01 
        });

        for (let i = 1; i <= total; i++) {
            const item = document.createElement('div');
            item.className = 'page-nav-item';
            item.dataset.page = i;
            item.dataset.rendered = "false";
            
            const thumbCanvas = document.createElement('canvas');
            // Set ukuran default agar layout tidak loncat
            thumbCanvas.width = 100; thumbCanvas.height = 140; 
            
            const label = document.createElement('span');
            label.className = 'page-label';
            label.innerText = i;

            item.appendChild(thumbCanvas);
            item.appendChild(label);
            
            item.onclick = () => {
                if (pageRendering || i === pageNum) return;
                pageNum = i;
                queueRenderPage(pageNum);
            };

            pageNavList.appendChild(item);
            observer.observe(item); // Mulai pantau
        }
    }

    function renderThumbnail(container) {
        const pNum = parseInt(container.dataset.page);
        pdfDoc.getPage(pNum).then(page => {
            const thumbScale = 0.2; // Resolusi Rendah untuk Thumbnail
            const viewport = page.getViewport({ scale: thumbScale });
            const canvas = container.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = { canvasContext: ctx, viewport: viewport };
            page.render(renderContext);
        });
    }

    function updatePageNavHighlight(current) {
        const items = document.querySelectorAll('.page-nav-item');
        items.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`.page-nav-item[data-page="${current}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // --- ANNOTATION & NOTES (STANDARD) ---
    function loadAnnotationsForPage(page) {
        // Clear Canvas (Dengan memperhitungkan transform scale)
        hCtx.save();
        hCtx.setTransform(1, 0, 0, 1, 0, 0); 
        hCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
        hCtx.restore(); 

        const pageData = annotationsData[page];
        if (pageData && pageData.highlights) {
            hCtx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            pageData.highlights.forEach(rect => { 
                hCtx.fillRect(rect.x, rect.y, rect.w, rect.h); 
            });
        }
    }

    function renderSidebarNotes(pNum) {
        notesList.innerHTML = '';
        const pageData = annotationsData[pNum];
        const notes = (pageData && pageData.notes) ? pageData.notes : [];
        if (notes.length === 0) { 
            notesList.innerHTML = '<div class="empty-notes">Belum ada catatan.</div>'; return; 
        }
        notes.forEach((note, index) => {
            const item = document.createElement('div');
            item.className = 'note-item';
            const dateStr = new Date(note.date).toLocaleDateString('id-ID');
            item.innerHTML = `
                <div class="note-content">${note.text}</div>
                <span class="note-date">${dateStr}</span>
                <button class="btn-delete-note"><i class="fas fa-trash"></i></button>
            `;
            item.querySelector('.btn-delete-note').onclick = () => {
                if(confirm('Hapus?')) { 
                    saveStateToHistory(); 
                    notes.splice(index, 1); 
                    saveData(); 
                    renderSidebarNotes(pNum); 
                }
            };
            notesList.appendChild(item);
        });
    }

    function saveData() { 
        localStorage.setItem(storageKey, JSON.stringify(annotationsData)); 
    }

    if(addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            const text = noteInput.value.trim();
            if (!text) return;
            saveStateToHistory();
            if (!annotationsData[pageNum]) annotationsData[pageNum] = { highlights: [], notes: [] };
            if (!annotationsData[pageNum].notes) annotationsData[pageNum].notes = [];
            annotationsData[pageNum].notes.push({ text: text, date: new Date().toISOString() });
            saveData();
            renderSidebarNotes(pageNum);
            noteInput.value = '';
        });
    }

    // --- UNDO/REDO ---
    function saveStateToHistory() {
        const data = annotationsData[pageNum] ? JSON.parse(JSON.stringify(annotationsData[pageNum])) : { highlights: [], notes: [] };
        undoStack.push(data);
        redoStack = []; 
        if (undoStack.length > 20) undoStack.shift();
    }
    function performUndo() {
        if (undoStack.length === 0) return;
        redoStack.push(annotationsData[pageNum] ? JSON.parse(JSON.stringify(annotationsData[pageNum])) : { highlights: [], notes: [] });
        annotationsData[pageNum] = undoStack.pop();
        saveData(); loadAnnotationsForPage(pageNum);
    }
    function performRedo() {
        if (redoStack.length === 0) return;
        undoStack.push(annotationsData[pageNum] ? JSON.parse(JSON.stringify(annotationsData[pageNum])) : { highlights: [], notes: [] });
        annotationsData[pageNum] = redoStack.pop();
        saveData(); loadAnnotationsForPage(pageNum);
    }
    undoBtn.addEventListener('click', performUndo);
    redoBtn.addEventListener('click', performRedo);
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); performUndo(); }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); performRedo(); }
    });

    // --- TOOLS & TEXT SELECTION ---
    function highlightSelectedText() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;
        
        // Pastikan seleksi di dalam Text Layer
        const range = selection.getRangeAt(0);
        if (!textLayerDiv.contains(range.commonAncestorContainer) && !textLayerDiv.contains(range.startContainer.parentNode)) return false;
        
        const rects = range.getClientRects();
        const wrapperRect = pdfWrapper.getBoundingClientRect();
        
        if (rects.length > 0) {
            saveStateToHistory();
            if (!annotationsData[pageNum]) annotationsData[pageNum] = { highlights: [], notes: [] };
            if (!annotationsData[pageNum].highlights) annotationsData[pageNum].highlights = [];
            
            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                // Koordinat relatif terhadap wrapper
                annotationsData[pageNum].highlights.push({ 
                    x: r.left - wrapperRect.left, 
                    y: r.top - wrapperRect.top, 
                    w: r.width, 
                    h: r.height 
                });
            }
            saveData(); loadAnnotationsForPage(pageNum); selection.removeAllRanges();
            return true;
        }
        return false;
    }

    highlightBtn.addEventListener('click', () => {
        if(highlightSelectedText()) { isHighlightMode = false; updateToolState(); return; }
        isHighlightMode = !isHighlightMode; isEraserMode = false; updateToolState();
    });
    eraserBtn.addEventListener('click', () => { 
        isEraserMode = !isEraserMode; isHighlightMode = false; updateToolState(); 
    });

    function updateToolState() {
        highlightBtn.classList.toggle('active', isHighlightMode);
        eraserBtn.classList.toggle('active', isEraserMode);
        if (isHighlightMode || isEraserMode) {
            annotationLayer.style.pointerEvents = 'auto'; textLayerDiv.style.pointerEvents = 'none'; highlightCanvas.style.cursor = isEraserMode ? 'default' : 'crosshair';
        } else {
            annotationLayer.style.pointerEvents = 'none'; textLayerDiv.style.pointerEvents = 'auto'; highlightCanvas.style.cursor = 'default';
        }
    }

    // --- DRAWING LOGIC ---
    function getCoords(e) {
        const r = highlightCanvas.getBoundingClientRect();
        let cx, cy;
        if(e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; } else { cx = e.clientX; cy = e.clientY; }
        return { x: cx - r.left, y: cy - r.top };
    }
    
    highlightCanvas.addEventListener('mousedown', (e) => {
        if(!isHighlightMode && !isEraserMode) return;
        isDrawing = true; 
        const c = getCoords(e);
        if(isHighlightMode || isEraserMode) saveStateToHistory();
        if(isHighlightMode) { startX = c.x; startY = c.y; }
        if(isEraserMode) performEraser(c.x, c.y);
    });
    
    highlightCanvas.addEventListener('mousemove', (e) => {
        if(!isDrawing) return;
        const c = getCoords(e);
        if(isEraserMode) performEraser(c.x, c.y);
        else if(isHighlightMode) {
            loadAnnotationsForPage(pageNum);
            const w = Math.abs(c.x - startX), h = Math.abs(c.y - startY);
            hCtx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            hCtx.fillRect(Math.min(startX, c.x), Math.min(startY, c.y), w, h);
        }
    });
    
    window.addEventListener('mouseup', (e) => {
        if(!isDrawing) return;
        isDrawing = false;
        if(isHighlightMode) loadAnnotationsForPage(pageNum); 
    });
    
    highlightCanvas.addEventListener('mouseup', (e) => {
        if(!isHighlightMode) return;
        const c = getCoords(e);
        const w = Math.abs(c.x - startX), h = Math.abs(c.y - startY);
        if(w > 5 && h > 5) {
            if(!annotationsData[pageNum]) annotationsData[pageNum] = {highlights:[], notes:[]};
            if(!annotationsData[pageNum].highlights) annotationsData[pageNum].highlights = [];
            annotationsData[pageNum].highlights.push({
                x: Math.min(startX, c.x), y: Math.min(startY, c.y), w: w, h: h
            });
            saveData();
        }
        loadAnnotationsForPage(pageNum);
    });

    function performEraser(x, y) {
        const p = annotationsData[pageNum];
        if(!p || !p.highlights) return;
        let del = false;
        for(let i=p.highlights.length-1; i>=0; i--) {
            const r = p.highlights[i];
            if(x >= r.x && x <= r.x+r.w && y >= r.y && y <= r.y+r.h) {
                p.highlights.splice(i, 1); del = true;
            }
        }
        if(del) { saveData(); loadAnnotationsForPage(pageNum); }
    }

    clearPageBtn.addEventListener('click', () => {
        if(confirm("Hapus semua?")) { saveStateToHistory(); delete annotationsData[pageNum]; saveData(); loadAnnotationsForPage(pageNum); }
    });

    // Zoom
    if(zoomInBtn) zoomInBtn.addEventListener('click', () => { scale += 0.2; queueRenderPage(pageNum); });
    if(zoomOutBtn) zoomOutBtn.addEventListener('click', () => { if(scale > 0.5) scale -= 0.2; queueRenderPage(pageNum); });

    // INIT LOAD PDF
    if (bookSource) {
        loadingOverlay.classList.add('active');
        pdfjsLib.getDocument(bookSource).promise.then(doc => {
            pdfDoc = doc;
            renderPage(pageNum);
            generatePageNavigation(doc.numPages);
        }).catch(err => {
            console.error("PDF Load Error:", err);
            loadingOverlay.classList.remove('active');
            alert("Gagal memuat PDF.");
        });
    } else { loadingOverlay.classList.remove('active'); }

    // Rating Logic
    const ratingModal = document.getElementById('ratingModal');
    const stars = document.querySelectorAll('.star-widget i');
    const ratingInput = document.getElementById('ratingScore'); 
    if(finishBtn) finishBtn.addEventListener('click', () => { if(ratingModal) ratingModal.classList.add('active'); });
    stars.forEach(star => { star.addEventListener('click', () => { updateUI(parseInt(star.getAttribute('data-value'))); }); });
    if(ratingInput) ratingInput.addEventListener('input', function() { let val = parseFloat(this.value); if (isNaN(val)) val = 0; if (val > 5) val = 5; if (val < 0) val = 0; updateUI(val); });
    function updateUI(val) {
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
            const review = document.getElementById('ratingReview') ? document.getElementById('ratingReview').value : "";
            const finalTitle = bookTitle;
            const allRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
            allRatings[finalTitle] = { score: parseFloat(ratingInput.value || 0), review: review, user: currentUser, date: new Date().toISOString() };
            localStorage.setItem('userRatings', JSON.stringify(allRatings));
            const history = JSON.parse(localStorage.getItem(`readingHistory_${currentUser}`) || '{}');
            history[finalTitle] = 'finished'; localStorage.setItem(`readingHistory_${currentUser}`, JSON.stringify(history));
            alert("Terima kasih! Rating tersimpan."); window.location.href = 'index.html';
        });
    }
    const skipBtn = document.getElementById('skipRatingBtn');
    if(skipBtn) skipBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
});