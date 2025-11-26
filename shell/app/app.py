from flask import Flask, render_template, jsonify, request
import os
import requests
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# URLs de los microfrontends (configurables vía variables de entorno)
MICROFRONTEND_URLS = {
    # En cluster Kubernetes el Service expone en el puerto 80 (service name resolución DNS).
    # Para desarrollo local puede sobreescribirse con e.g. AUTH_SERVICE_URL="http://localhost:8081"
    'auth': os.environ.get('AUTH_SERVICE_URL', 'http://tw-auth-service'),
    'chat': os.environ.get('CHAT_SERVICE_URL', 'http://tw-chat-service'),
    'docs': os.environ.get('DOCS_SERVICE_URL', 'http://tw-docs-service'),
    'tasks': os.environ.get('TASKS_SERVICE_URL', 'http://tw-tasks-service')
}

@app.route('/')
def index():
    # Pagina Principal
    return render_template('index.html', microfrontends=MICROFRONTEND_URLS)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'shell'}), 200

@app.route('/api/microfrontends')
def get_microfrontends():
    # API para configuración de los microfrontends
    # Devolvemos URLs relativas que apuntan al proxy de la shell para evitar
    # problemas de resolución DNS/CORS desde el navegador.
    microfrontends_config = {
        'auth': {
            'name': 'Autenticación',
            'url': f"/api/proxy/auth",
            'description': 'Gestión de usuarios y autenticación'
        },
        'chat': {
            'name': 'Chat',
            'url': f"/api/proxy/chat",
            'description': 'Sistema de chat en tiempo real'
        },
        'docs': {
            'name': 'Documentos',
            'url': f"/api/proxy/docs",
            'description': 'Gestión de documentos compartidos'
        },
        'tasks': {
            'name': 'Tareas',
            'url': f"/api/proxy/tasks",
            'description': 'Gestión de tareas y proyectos'
        }
    }
    return jsonify(microfrontends_config)

@app.route('/api/proxy/<service>/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE'])
@app.route('/api/proxy/<service>/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_to_microfrontend(service, path):
    # Proxy general para microfrontends. Soporta la ruta raíz y sub-rutas.
    if service not in MICROFRONTEND_URLS:
        return jsonify({'error': 'Servicio no encontrado'}), 404

    base = MICROFRONTEND_URLS[service]
    if path:
        target_url = f"{base}/{path}"
    else:
        target_url = f"{base}/"

    try:
        # Reenviar la petición al microfrontend correspondiente
        if request.method == 'GET':
            response = requests.get(target_url, params=request.args, timeout=10)
        elif request.method == 'POST':
            response = requests.post(target_url, json=request.get_json(), timeout=10)
        elif request.method == 'PUT':
            response = requests.put(target_url, json=request.get_json(), timeout=10)
        elif request.method == 'DELETE':
            response = requests.delete(target_url, timeout=10)

        # Pasar contenido y estatus. Filtrar headers problemáticos si es necesario.
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in response.headers.items() if name.lower() not in excluded_headers]
        return response.content, response.status_code, headers
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Error al comunicarse con {service}', 'detail': str(e)}), 503

@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
