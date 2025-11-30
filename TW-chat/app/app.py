from flask import Flask, render_template, send_from_directory, jsonify, request
from flask_socketio import SocketIO, emit
from datetime import datetime

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'change-this-in-production'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='eventlet')

users = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/style/<path:path>')
def serve_style(path):
    return send_from_directory('style', path)

@app.get('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'tw-chat',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

@socketio.on('connect')
def on_connect():
    print('[CHAT] Client connected')

@socketio.on('join')
def on_join(username):
    sid = request.sid
    name = (username or '').strip() or 'anon'
    users[sid] = name
    print(f"[CHAT] Usuario unido: {name} (sid={sid})")
    emit('system', f"{name} se ha unido al chat", broadcast=True)
    emit('system', f"Bienvenido, {name}")

@socketio.on('chat_message')
def on_chat_message(text):
    sid = request.sid
    name = users.get(sid, 'anónimo')
    payload = {
        'user': name,
        'text': str(text or ''),
        'time': datetime.utcnow().isoformat() + 'Z'
    }
    print(f"[CHAT] Mensaje de {name}: {text}")
    emit('chat_message', payload, broadcast=True)

@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    name = users.pop(sid, None)
    if name:
        emit('system', f"{name} salió del chat", broadcast=True)
    print('[CHAT] Client disconnected')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8082)
