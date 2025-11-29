const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const HEALTH_PORT = 81;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use(express.static(path.join(__dirname, 'public')));

// Almacenamiento en memoria de tareas (se reinicia al reiniciar el contenedor)
let tasks = [
    { id: 1, title: 'Implementar autenticación', description: 'Crear sistema de login', status: 'completed', priority: 'high', created: new Date('2025-11-20').toISOString() },
    { id: 2, title: 'Diseñar interfaz de chat', description: 'Mockups y wireframes', status: 'in-progress', priority: 'medium', created: new Date('2025-11-22').toISOString() },
    { id: 3, title: 'Configurar Kubernetes', description: 'Setup de deployments', status: 'pending', priority: 'high', created: new Date('2025-11-25').toISOString() }
];
let nextId = 4;

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// API - Obtener todas las tareas
app.get('/api/tasks', (req, res) => {
    const { status, priority } = req.query;
    let filteredTasks = [...tasks];

    if (status && status !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.status === status);
    }

    if (priority && priority !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.priority === priority);
    }

    res.json({ 
        success: true, 
        tasks: filteredTasks,
        total: filteredTasks.length 
    });
});

// API - Obtener una tarea
app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    
    if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({ success: true, task });
});

// API - Crear tarea
app.post('/api/tasks', (req, res) => {
    const { title, description, priority } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'El título es requerido' });
    }

    const newTask = {
        id: nextId++,
        title: title.trim(),
        description: description ? description.trim() : '',
        status: 'pending',
        priority: priority || 'medium',
        created: new Date().toISOString()
    };

    tasks.unshift(newTask);
    console.log(`[TASKS] Nueva tarea creada: ${newTask.title}`);

    res.status(201).json({ 
        success: true, 
        task: newTask,
        message: 'Tarea creada exitosamente' 
    });
});

// API - Actualizar tarea
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const { title, description, status, priority } = req.body;

    if (title) tasks[taskIndex].title = title.trim();
    if (description !== undefined) tasks[taskIndex].description = description.trim();
    if (status) tasks[taskIndex].status = status;
    if (priority) tasks[taskIndex].priority = priority;

    console.log(`[TASKS] Tarea actualizada: ${tasks[taskIndex].title}`);

    res.json({ 
        success: true, 
        task: tasks[taskIndex],
        message: 'Tarea actualizada exitosamente' 
    });
});

// API - Eliminar tarea
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    console.log(`[TASKS] Tarea eliminada: ${deletedTask.title}`);

    res.json({ 
        success: true, 
        message: 'Tarea eliminada exitosamente' 
    });
});

// API - Estadísticas
app.get('/api/stats', (req, res) => {
    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        highPriority: tasks.filter(t => t.priority === 'high').length
    };

    res.json({ success: true, stats });
});

// Health check en puerto diferente para Kubernetes
const healthApp = express();
healthApp.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        service: 'tw-tasks',
        tasks: tasks.length,
        timestamp: new Date().toISOString()
    });
});

healthApp.listen(HEALTH_PORT, () => {
    console.log(`[TASKS] Health check listening on port ${HEALTH_PORT}`);
});

// Servidor principal
app.listen(PORT, () => {
    console.log(`[TASKS] Microfrontend TW-tasks running on port ${PORT}`);
    console.log(`[TASKS] Total tasks: ${tasks.length}`);
});
