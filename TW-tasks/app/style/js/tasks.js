console.log("[TASKS] Microfrontend de tareas cargado");

// Estado global
let tasks = [];
let editingTaskId = null;

// Elementos del DOM
const tasksList = document.getElementById('tasksList');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const newTaskBtn = document.getElementById('newTaskBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    loadStats();
    setupEventListeners();
    
    // Suscribirse a eventos del Shell
    if (window.microfrontendBus) {
        window.microfrontendBus.subscribe("user-logged-in", (data) => {
            console.log("[TASKS] Usuario logueado:", data.user);
        });
    }
});

// Event Listeners
function setupEventListeners() {
    newTaskBtn.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', () => closeModalHandler());
    cancelBtn.addEventListener('click', () => closeModalHandler());
    taskForm.addEventListener('submit', handleSubmit);
    statusFilter.addEventListener('change', loadTasks);
    priorityFilter.addEventListener('change', loadTasks);
    
    // Cerrar modal al hacer click fuera
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModalHandler();
    });
}

// Cargar tareas
async function loadTasks() {
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    
    tasksList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Cargando tareas...</p>
        </div>
    `;

    try {
        const params = new URLSearchParams();
        if (status !== 'all') params.append('status', status);
        if (priority !== 'all') params.append('priority', priority);

        const response = await fetch(`/api/tasks?${params}`);
        const data = await response.json();

        tasks = data.tasks;
        renderTasks();
        loadStats();

    } catch (error) {
        console.error("[TASKS] Error cargando tareas:", error);
        tasksList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">error</span>
                <p>Error al cargar las tareas</p>
            </div>
        `;
    }
}

// Renderizar tareas
function renderTasks() {
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">assignment_turned_in</span>
                <p>No hay tareas para mostrar</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = tasks.map(task => `
        <div class="task-card priority-${task.priority}">
            <div class="task-header">
                <div class="task-title-section">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn-icon" onclick="editTask(${task.id})" title="Editar">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn-icon delete" onclick="deleteTask(${task.id})" title="Eliminar">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
            <div class="task-meta">
                <span class="task-badge badge-status ${task.status}">
                    <span class="material-icons">${getStatusIcon(task.status)}</span>
                    ${getStatusLabel(task.status)}
                </span>
                <span class="task-badge badge-priority ${task.priority}">
                    <span class="material-icons">flag</span>
                    ${getPriorityLabel(task.priority)}
                </span>
                <span class="task-date">
                    <span class="material-icons">schedule</span>
                    ${formatDate(task.created)}
                </span>
            </div>
        </div>
    `).join('');
}

// Cargar estadísticas
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        document.getElementById('totalTasks').textContent = data.stats.total;
        document.getElementById('pendingTasks').textContent = data.stats.pending;
        document.getElementById('inProgressTasks').textContent = data.stats.inProgress;
        document.getElementById('completedTasks').textContent = data.stats.completed;

    } catch (error) {
        console.error("[TASKS] Error cargando estadísticas:", error);
    }
}

// Abrir modal
function openModal(task = null) {
    editingTaskId = task ? task.id : null;
    
    document.getElementById('modalTitle').textContent = task ? 'Editar Tarea' : 'Nueva Tarea';
    document.getElementById('taskId').value = task ? task.id : '';
    document.getElementById('taskTitle').value = task ? task.title : '';
    document.getElementById('taskDescription').value = task ? task.description : '';
    document.getElementById('taskStatus').value = task ? task.status : 'pending';
    document.getElementById('taskPriority').value = task ? task.priority : 'medium';
    
    taskModal.classList.add('show');
    document.getElementById('taskTitle').focus();
}

// Cerrar modal
function closeModalHandler() {
    taskModal.classList.remove('show');
    taskForm.reset();
    editingTaskId = null;
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value
    };

    try {
        let response;
        
        if (editingTaskId) {
            // Actualizar tarea existente
            response = await fetch(`/api/tasks/${editingTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            // Crear nueva tarea
            response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Error al guardar la tarea');
            return;
        }

        // Publicar evento al Shell
        if (window.microfrontendBus) {
            const eventName = editingTaskId ? 'task-updated' : 'task-created';
            window.microfrontendBus.publish(eventName, { task: data.task });
            console.log(`[TASKS] Evento '${eventName}' publicado`);
        }

        closeModalHandler();
        loadTasks();

    } catch (error) {
        console.error("[TASKS] Error guardando tarea:", error);
        alert('Error de conexión con el servidor');
    }
}

// Editar tarea
async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        openModal(task);
    }
}

// Eliminar tarea
async function deleteTask(taskId) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Error al eliminar la tarea');
            return;
        }

        // Publicar evento al Shell
        if (window.microfrontendBus) {
            window.microfrontendBus.publish('task-deleted', { taskId });
            console.log("[TASKS] Evento 'task-deleted' publicado");
        }

        loadTasks();

    } catch (error) {
        console.error("[TASKS] Error eliminando tarea:", error);
        alert('Error de conexión con el servidor');
    }
}

// Utilidades
function getStatusIcon(status) {
    const icons = {
        'pending': 'pending_actions',
        'in-progress': 'autorenew',
        'completed': 'check_circle'
    };
    return icons[status] || 'help';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Pendiente',
        'in-progress': 'En Progreso',
        'completed': 'Completada'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    const labels = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta'
    };
    return labels[priority] || priority;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
