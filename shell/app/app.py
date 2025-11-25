from flask import Flask, render_template, jsonify, request
import os
import requests
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# URLs de los microfrontends (configurables vía variables de entorno)
MICROFRONTEND_URLS = {
    'auth': os.environ.get('AUTH_SERVICE_URL', 'http://tw-auth-service:5000'),
    'chat': os.environ.get('CHAT_SERVICE_URL', 'http://tw-chat-service:5000'),
    'docs': os.environ.get('DOCS_SERVICE_URL', 'http://tw-docs-service:5000'),
    'tasks': os.environ.get('TASKS_SERVICE_URL', 'http://tw-tasks-service:5000')
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
    microfrontends_config = {
        'auth': {
            'name': 'Autenticación',
            'url': MICROFRONTEND_URLS['auth'],
            'description': 'Gestión de usuarios y autenticación'
        },
        'chat': {
            'name': 'Chat',
            'url': MICROFRONTEND_URLS['chat'],
            'description': 'Sistema de chat en tiempo real'
        },
        'docs': {
            'name': 'Documentos',
            'url': MICROFRONTEND_URLS['docs'],
            'description': 'Gestión de documentos compartidos'
        },
        'tasks': {
            'name': 'Tareas',
            'url': MICROFRONTEND_URLS['tasks'],
            'description': 'Gestión de tareas y proyectos'
        }
    }
    return jsonify(microfrontends_config)

@app.route('/api/proxy/<service>/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_to_microfrontend(service, path):
    # Aquí se hace la conexión de los microfrontends a través del proxy
    if service not in MICROFRONTEND_URLS:
        return jsonify({'error': 'Servicio no encontrado'}), 404
    
    target_url = f"{MICROFRONTEND_URLS[service]}/{path}"
    
    try:
        # Reenviar la petición al microfrontend correspondiente
        if request.method == 'GET':
            response = requests.get(target_url, params=request.args, timeout=5)
        elif request.method == 'POST':
            response = requests.post(target_url, json=request.get_json(), timeout=5)
        elif request.method == 'PUT':
            response = requests.put(target_url, json=request.get_json(), timeout=5)
        elif request.method == 'DELETE':
            response = requests.delete(target_url, timeout=5)
        
        return response.content, response.status_code, response.headers.items()
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
