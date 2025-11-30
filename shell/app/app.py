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
    # Para microfrontends con WebSockets (como chat), usamos rutas de Ingress directamente
    # para que el navegador pueda hacer upgrade de conexión. El proxy HTTP simple no
    # maneja correctamente los upgrades de WebSocket.
    microfrontends_config = {
        'auth': {
            'name': 'Autenticación',
            'url': f"/auth",
            'description': 'Gestión de usuarios y autenticación',
            'icon': 'lock'
        },
        'chat': {
            'name': 'Chat',
            'url': f"/chat",
            'description': 'Sistema de chat en tiempo real',
            'icon': 'chat'
        },
        'docs': {
            'name': 'Documentos',
            'url': f"/docs",
            'description': 'Gestión de documentos compartidos',
            'icon': 'description'
        },
        'tasks': {
            'name': 'Tareas',
            'url': f"/tasks",
            'description': 'Gestión de tareas y proyectos',
            'icon': 'assignment'
        }
    }
    return jsonify(microfrontends_config)

# Proxy de rutas visibles desde el navegador para que se sirvan en 8080
# Esto permite acceder a /auth, /chat, /docs, /tasks sin depender del Ingress.
@app.route('/<service>/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
@app.route('/<service>/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def browser_visible_routes(service, path):
    if service not in MICROFRONTEND_URLS:
        return render_template('404.html'), 404

    base = MICROFRONTEND_URLS[service]
    target_url = f"{base}/" if not path else f"{base}/{path}"

    try:
        method = request.method
        headers = {k: v for k, v in request.headers.items()}
        # Remove hop-by-hop headers
        for h in ['Host', 'Content-Length', 'Connection', 'Keep-Alive', 'Proxy-Authenticate', 'Proxy-Authorization', 'TE', 'Trailers', 'Transfer-Encoding', 'Upgrade']:
            headers.pop(h, None)

        if method == 'GET':
            response = requests.get(target_url, params=request.args, headers=headers, timeout=10)
        elif method == 'POST':
            data = request.get_data()
            response = requests.post(target_url, params=request.args, headers=headers, data=data, timeout=15)
        elif method == 'PUT':
            data = request.get_data()
            response = requests.put(target_url, params=request.args, headers=headers, data=data, timeout=15)
        elif method == 'DELETE':
            response = requests.delete(target_url, params=request.args, headers=headers, timeout=10)
        elif method == 'PATCH':
            data = request.get_data()
            response = requests.patch(target_url, params=request.args, headers=headers, data=data, timeout=15)
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in response.headers.items() if name.lower() not in excluded_headers]
        return response.content, response.status_code, headers
    except requests.exceptions.RequestException:
        # Servicio inaccesible: devolver 404 para distinguir de errores internos reales
        return render_template('404.html'), 404

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
