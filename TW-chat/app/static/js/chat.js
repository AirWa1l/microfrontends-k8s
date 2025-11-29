(() => {
  const EMBEDDED = (() => { try { return window.top !== window; } catch(e){ return true; } })();
  // Conexión: si está embebido (shell 8080) usar puerto real 8082 para WebSockets.
  const socket = EMBEDDED ? io(`http://${location.hostname}:8082`, { autoConnect: false }) : io({ autoConnect: true });
  console.log('[CHAT] Script loaded');

  let username = sessionStorage.getItem('tw_username') || '';
  const modal = document.getElementById('username-modal');
  const usernameForm = document.getElementById('username-form');
  const usernameInput = document.getElementById('username-input');
  const changeBtn = document.getElementById('change-name');
  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('msg');

  function openModal(){
    modal.classList.remove('hidden');
    usernameInput.focus();
  }
  function closeModal(){ modal.classList.add('hidden'); }

  function escapeHtml(str){
    return String(str).replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }
  function addMessage({ user, text, time }){
    const el = document.createElement('div');
    el.className = 'message';
    const when = new Date(time || Date.now());
    el.innerHTML = `<strong>${escapeHtml(user)}:</strong> ${escapeHtml(text)} <span class="time">${when.toLocaleTimeString()}</span>`;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function addSystem(text){
    const el = document.createElement('div');
    el.className = 'system';
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function initJoinFlow(){
    if (EMBEDDED) { sessionStorage.removeItem('tw_username'); username = ''; }
    if (username) {
      socket.connect();
      socket.emit('join', username);
      console.log('[CHAT] Auto-join stored username:', username);
    } else { openModal(); }
  }

  socket.on('connect', () => {
    console.log('[CHAT] Connected id=', socket.id);
    if (username) socket.emit('join', username);
  });
  socket.on('connect_error', err => console.error('[CHAT] connect_error:', err));
  socket.on('error', err => console.error('[CHAT] error:', err));
  socket.on('message', addMessage);
  socket.on('system', addSystem);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    if (!socket.connected) { try { socket.connect(); } catch(err){ console.error('[CHAT] connect on send', err); } }
    socket.emit('message', text);
    input.value = '';
  });
  usernameForm.addEventListener('submit', e => {
    e.preventDefault();
    const value = usernameInput.value.trim();
    username = value || '';
    sessionStorage.setItem('tw_username', username);
    closeModal();
    socket.connect();
    socket.emit('join', username);
    console.log('[CHAT] Join with new username:', username);
  });
  if (changeBtn) changeBtn.addEventListener('click', () => { sessionStorage.removeItem('tw_username'); username=''; openModal(); });

  initJoinFlow();
})();