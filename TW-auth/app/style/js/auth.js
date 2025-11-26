console.log("[AUTH] Microfrontend de autenticación cargado");

// Manejo de tabs
document.addEventListener("DOMContentLoaded", () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    
    // Cambiar entre tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Actualizar tabs activos
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Mostrar formulario correspondiente
            forms.forEach(form => {
                if (form.id === `${targetTab}-form`) {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });
            
            // Limpiar mensajes
            clearMessages();
        });
    });
    
    // Formulario de login
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const loginSuccess = document.getElementById("login-success");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        clearMessages();

        const user = document.getElementById("login-user").value;
        const pass = document.getElementById("login-pass").value;

        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, pass })
            });

            const data = await res.json();

            if (!res.ok) {
                showError(loginError, data.error || "Error en login");
                return;
            }

            // Login exitoso
            showSuccess(loginSuccess, data.message || "Login exitoso");
            
            // Enviar evento al Shell si está disponible
            if (window.microfrontendBus) {
                window.microfrontendBus.publish("user-logged-in", {
                    user: data.user,
                    token: data.token
                });
                console.log("[AUTH] Evento 'user-logged-in' publicado");
            }

            // Limpiar formulario
            loginForm.reset();

        } catch (err) {
            console.error("[AUTH] Error:", err);
            showError(loginError, "Error de conexión con el servidor");
        } finally {
            submitBtn.classList.remove('loading');
        }
    });

    // Formulario de registro
    const registerForm = document.getElementById("register-form");
    const registerError = document.getElementById("register-error");
    const registerSuccess = document.getElementById("register-success");

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        clearMessages();

        const user = document.getElementById("register-user").value;
        const email = document.getElementById("register-email").value;
        const pass = document.getElementById("register-pass").value;

        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, email, pass })
            });

            const data = await res.json();

            if (!res.ok) {
                showError(registerError, data.error || "Error en registro");
                return;
            }

            // Registro exitoso
            showSuccess(registerSuccess, data.message || "Usuario registrado exitosamente");
            
            // Enviar evento al Shell si está disponible
            if (window.microfrontendBus) {
                window.microfrontendBus.publish("user-registered", {
                    user: data.user
                });
                console.log("[AUTH] Evento 'user-registered' publicado");
            }

            // Limpiar formulario
            registerForm.reset();

        } catch (err) {
            console.error("[AUTH] Error:", err);
            showError(registerError, "Error de conexión con el servidor");
        } finally {
            submitBtn.classList.remove('loading');
        }
    });

    // Suscribirse a eventos del Shell
    if (window.microfrontendBus) {
        window.microfrontendBus.subscribe("logout-requested", () => {
            console.log("[AUTH] Evento 'logout-requested' recibido");
            loginForm.reset();
            registerForm.reset();
            clearMessages();
        });
    }
});

// Funciones auxiliares
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => {
        msg.textContent = '';
        msg.classList.remove('show');
    });
}
