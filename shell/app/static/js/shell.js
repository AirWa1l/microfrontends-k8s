// Shell de Microfrontends - Orquestador Principal
class MicrofrontendShell {
    constructor() {
        this.microfrontends = {};
        this.currentMicrofrontend = null;
        this.container = document.getElementById('microfrontend-container');
        this.init();
    }

    async init() {
        await this.loadMicrofrontendsConfig();
        this.setupNavigation();
        this.setupCardNavigation();
        this.setupCommunicationBridge();
    }

    async loadMicrofrontendsConfig() {
        try {
            const response = await fetch('/api/microfrontends');
            this.microfrontends = await response.json();
            console.log('Microfrontends configurados:', this.microfrontends);
        } catch (error) {
            console.error('Error cargando configuración de microfrontends:', error);
            this.showError('No se pudo cargar la configuración de microfrontends');
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const microfrontendName = e.currentTarget.dataset.microfrontend;
                this.loadMicrofrontend(microfrontendName);
                
                // Actualizar navegación activa
                navItems.forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    setupCardNavigation() {
        const cards = document.querySelectorAll('.mf-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const microfrontendName = e.currentTarget.dataset.mf;
                this.loadMicrofrontend(microfrontendName);
            });
        });
    }

    setupCommunicationBridge() {
        // Event bus para comunicación entre microfrontends
        window.microfrontendBus = {
            publish: (event, data) => {
                console.log(`[Shell] Evento publicado: ${event}`, data);
                window.dispatchEvent(new CustomEvent(event, { detail: data }));
            },
            subscribe: (event, callback) => {
                window.addEventListener(event, (e) => callback(e.detail));
            }
        };

        // API Proxy para llamadas entre microfrontends
        window.microfrontendAPI = {
            call: async (service, endpoint, method = 'GET', data = null) => {
                try {
                    const options = {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    };

                    if (data && (method === 'POST' || method === 'PUT')) {
                        options.body = JSON.stringify(data);
                    }

                    const response = await fetch(`/api/proxy/${service}/${endpoint}`, options);
                    return await response.json();
                } catch (error) {
                    console.error(`Error llamando a ${service}/${endpoint}:`, error);
                    throw error;
                }
            }
        };
    }

    async loadMicrofrontend(name) {
        if (!this.microfrontends[name]) {
            this.showError(`Microfrontend "${name}" no encontrado`);
            return;
        }

        this.currentMicrofrontend = name;
        const config = this.microfrontends[name];

        // Mostrar loading
        this.showLoading();

        try {
            // Intentar cargar el microfrontend
            const response = await fetch(`${config.url}/`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html'
                }
            });

            if (response.ok) {
                const html = await response.text();
                this.renderMicrofrontend(name, html, config);
            } else {
                this.showPlaceholder(name, config);
            }
        } catch (error) {
            console.error(`Error cargando microfrontend ${name}:`, error);
            this.showPlaceholder(name, config);
        }
    }

    renderMicrofrontend(name, html, config) {
        // En una implementación real con iframes
        this.container.innerHTML = `
            <div class="microfrontend-wrapper">
                <div class="microfrontend-header">
                    <h2>
                        <span class="material-icons">${config.icon}</span>
                        ${config.name}
                    </h2>
                    <button class="btn-back" onclick="shell.showWelcome()">
                        <span class="material-icons">arrow_back</span>
                        Volver
                    </button>
                </div>
                <div class="microfrontend-content">
                    <iframe 
                        src="${config.url}" 
                        frameborder="0" 
                        style="width: 100%; height: 600px; border: none;"
                        title="${config.name}">
                    </iframe>
                </div>
            </div>
        `;
    }

    showPlaceholder(name, config) {
        this.container.innerHTML = `
            <div class="microfrontend-wrapper">
                <div class="microfrontend-header">
                    <h2>
                        <span class="material-icons">${config.icon}</span>
                        ${config.name}
                    </h2>
                    <button class="btn-back" onclick="shell.showWelcome()">
                        <span class="material-icons">arrow_back</span>
                        Volver
                    </button>
                </div>
                <div class="microfrontend-placeholder">
                    <span class="material-icons">construction</span>
                    <h3>Microfrontend en desarrollo</h3>
                    <p>${config.description}</p>
                    <p class="info-text">
                        Este microfrontend será implementado por otro miembro del equipo.
                        <br>
                        <strong>URL del servicio:</strong> ${config.url}
                    </p>
                    <div class="dev-info">
                        <h4>Información para desarrolladores:</h4>
                        <ul>
                            <li>Nombre del servicio: <code>${name}</code></li>
                            <li>Endpoint: <code>${config.url}</code></li>
                            <li>El servicio debe exponer una ruta <code>/</code> con la interfaz HTML</li>
                            <li>Puede usar <code>window.microfrontendBus</code> para eventos</li>
                            <li>Puede usar <code>window.microfrontendAPI.call()</code> para comunicarse con otros servicios</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error</span>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showWelcome() {
        location.reload();
    }
}

// Inicializar el Shell cuando el DOM esté listo
let shell;
document.addEventListener('DOMContentLoaded', () => {
    shell = new MicrofrontendShell();
    console.log('Shell de microfrontends inicializado');
});
