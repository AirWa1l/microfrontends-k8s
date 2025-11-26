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

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// API de login simulada
app.post('/login', (req, res) => {
    const { user, pass } = req.body;

    console.log(`[AUTH] Intento de login: ${user}`);

    // Validación simple de demostración
    if (!user || !pass) {
        return res.status(400).json({ 
            error: 'Usuario y contraseña requeridos' 
        });
    }

    // Login simulado - en producción validarías contra base de datos
    if (pass.length < 3) {
        return res.status(401).json({ 
            error: 'Contraseña inválida' 
        });
    }

    // Login exitoso
    res.json({
        success: true,
        user: user,
        token: `fake-jwt-token-${Date.now()}`,
        message: 'Login exitoso'
    });
});

// API de registro simulada
app.post('/register', (req, res) => {
    const { user, email, pass } = req.body;

    console.log(`[AUTH] Registro de usuario: ${user}`);

    if (!user || !email || !pass) {
        return res.status(400).json({ 
            error: 'Todos los campos son requeridos' 
        });
    }

    // Registro simulado
    res.json({
        success: true,
        user: user,
        message: 'Usuario registrado exitosamente'
    });
});

// API de validación de token
app.post('/validate', (req, res) => {
    const { token } = req.body;

    if (!token || !token.startsWith('fake-jwt-token')) {
        return res.status(401).json({ 
            valid: false, 
            error: 'Token inválido' 
        });
    }

    res.json({
        valid: true,
        user: 'demo-user'
    });
});

// Health check en puerto diferente para Kubernetes
const healthApp = express();
healthApp.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        service: 'tw-auth',
        timestamp: new Date().toISOString()
    });
});

healthApp.listen(HEALTH_PORT, () => {
    console.log(`[AUTH] Health check listening on port ${HEALTH_PORT}`);
});

// Servidor principal
app.listen(PORT, () => {
    console.log(`[AUTH] Microfrontend TW-auth running on port ${PORT}`);
    console.log(`[AUTH] Environment: ${process.env.NODE_ENV || 'development'}`);
});
