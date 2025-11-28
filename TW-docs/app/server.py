from flask import Flask, jsonify, request, render_template, send_from_directory
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import uuid
import os

app = Flask(__name__)

# Simulación de base de datos en memoria
documents = {}

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/document/list', methods=['GET'])
def list_docs():
    # Convertir diccionario a lista para el frontend
    docs_list = [{'id': k, 'title': v['title']} for k, v in documents.items()]
    return jsonify(docs_list)

@app.route('/document/create', methods=['POST'])
def create_doc():
    data = request.json
    doc_id = str(uuid.uuid4())
    documents[doc_id] = {
        'id': doc_id,
        'title': data.get('title', 'Sin título'),
        'content': ''
    }
    return jsonify(documents[doc_id]), 201

@app.route('/document/<doc_id>', methods=['GET'])
def get_doc(doc_id):
    doc = documents.get(doc_id)
    if doc:
        return jsonify(doc)
    return jsonify({'error': 'Not found'}), 404

@app.route('/document/<doc_id>/update', methods=['POST'])
def update_doc(doc_id):
    doc = documents.get(doc_id)
    if not doc:
        return jsonify({'error': 'Not found'}), 404
    
    data = request.json
    doc['content'] = data.get('content', doc['content'])
    doc['title'] = data.get('title', doc['title'])
    return jsonify(doc)

# Health Check Server (Puerto 81)
class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status": "healthy"}')

def run_health_check():
    print("Health check running on port 83")
    server = HTTPServer(('0.0.0.0', 83), HealthHandler)
    server.serve_forever()

if __name__ == '__main__':
    # Iniciar health check en hilo separado
    threading.Thread(target=run_health_check, daemon=True).start()
    # Iniciar app Flask
    print("TW-docs running on port 5000")
    app.run(host='0.0.0.0', port=5000)