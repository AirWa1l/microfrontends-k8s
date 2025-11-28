document.addEventListener('DOMContentLoaded', () => {
    const docList = document.getElementById('doc-list');
    const editorView = document.getElementById('editor-view');
    const emptyState = document.getElementById('empty-state');
    const titleInput = document.getElementById('doc-title');
    const contentInput = document.getElementById('doc-content');
    const saveBtn = document.getElementById('btn-save');
    const createBtn = document.getElementById('btn-create');
    const statusBar = document.getElementById('status-bar');

    let currentDocId = null;

    // Cargar documentos al inicio
    loadDocuments();

    // Evento: Crear documento
    createBtn.addEventListener('click', async () => {
        const title = prompt("Nombre del nuevo documento:");
        if (!title) return;
        
        try {
            // CAMBIO: ruta relativa sin slash inicial
            const res = await fetch('document/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ title })
            });
            
            if(res.ok) {
                const data = await res.json();
                loadDocuments();
            } else {
                alert("Error al crear documento");
            }
        } catch (e) {
            console.error("Error:", e);
            alert("No se pudo conectar con el servidor");
        }
    });

    // Evento: Guardar documento
    saveBtn.addEventListener('click', async () => {
        if (!currentDocId) return;
        statusBar.textContent = "Guardando...";
        saveBtn.disabled = true;
        
        try {
            // CAMBIO: ruta relativa sin slash inicial
            const res = await fetch(`document/${currentDocId}/update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    content: contentInput.value,
                    title: titleInput.value 
                })
            });

            if (res.ok) {
                statusBar.textContent = "Guardado exitosamente";
                loadDocuments();
            } else {
                statusBar.textContent = "Error al guardar";
            }
        } catch (e) {
            console.error(e);
            statusBar.textContent = "Error de conexión";
        } finally {
            saveBtn.disabled = false;
            setTimeout(() => statusBar.textContent = "Listo", 2000);
        }
    });

    // Función para cargar la lista de documentos
    async function loadDocuments() {
        try {
            // CAMBIO: ruta relativa sin slash inicial
            const res = await fetch('document/list');
            if (!res.ok) throw new Error("Error cargando lista");
            const docs = await res.json();
            renderList(docs);
        } catch (e) {
            console.log("Backend no disponible aún o error:", e);
            docList.innerHTML = '<li style="padding:10px; color:red;">Error de conexión</li>';
        }
    }

    // Renderizar la lista en el sidebar
    function renderList(docs) {
        docList.innerHTML = '';
        if (docs.length === 0) {
            docList.innerHTML = '<li style="padding:10px; color:#888;">No hay documentos</li>';
            return;
        }

        docs.forEach(doc => {
            const li = document.createElement('li');
            li.textContent = doc.title;
            li.onclick = () => openDocument(doc.id);
            if (currentDocId === doc.id) li.classList.add('active');
            docList.appendChild(li);
        });
    }

    // Abrir un documento específico
    async function openDocument(id) {
        currentDocId = id;
        statusBar.textContent = "Cargando...";
        
        try {
            // CAMBIO: ruta relativa sin slash inicial
            const res = await fetch(`document/${id}`);
            if (!res.ok) throw new Error("Error cargando documento");
            
            const data = await res.json();

            titleInput.value = data.title;
            contentInput.value = data.content || '';
            
            emptyState.classList.add('hidden');
            editorView.classList.remove('hidden');
            statusBar.textContent = "Listo";
            
            loadDocuments();
        } catch (e) {
            console.error(e);
            alert("Error al abrir el documento");
        }
    }
});