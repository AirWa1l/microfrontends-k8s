(function(){
  const socket = io({ autoConnect: false });
  console.log('[CHAT] Script loaded');
  // Use sessionStorage so each tab can have a different username
  let username = sessionStorage.getItem('tw_username') || '';

  const modal = document.getElementById('username-modal');
  const usernameForm = document.getElementById('username-form');
  const usernameInput = document.getElementById('username-input');

  function openModal(){
    modal.classList.remove('hidden');
    usernameInput.focus();
  }

  function closeModal(){
    modal.classList.add('hidden');
  }

  function initJoinFlow(){
    if (username) {
      socket.connect();
      socket.emit('join', username);
    } else {
      openModal();
    }
  }

  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('msg');

  function addMessage({ user, text, time }){
    const el = document.createElement('div');
    el.className = 'message';
    const when = new Date(time || Date.now());
    el.innerHTML = `<strong>${user}:</strong> ${escapeHtml(text)} <span class="time">${when.toLocaleTimeString()}</span>`;
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

  function escapeHtml(str){
    return String(str).replace(/[&<>"] /g, function(s){
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
      return map[s] || s;
    });
  }

  socket.on('connect', function(){
    console.log('[CHAT] Connected, id=', socket.id);
    // if name not stored yet we wait for form submit
    if (username) {
      socket.emit('join', username);
    }
  });
  socket.on('connect_error', function(err){
    console.error('[CHAT] connect_error:', err);
  });
  socket.on('error', function(err){
    console.error('[CHAT] error:', err);
  });
  socket.on('chat_message', addMessage);
  socket.on('system', addSystem);

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    socket.emit('chat_message', text);
    input.value = '';
  });

  usernameForm.addEventListener('submit', function(e){
    e.preventDefault();
    const value = usernameInput.value.trim();
    username = value || '';
    sessionStorage.setItem('tw_username', username);
    closeModal();
    socket.connect();
  });

  // Sanitization fix: improved regex (remove space from class)
  function escapeHtml(str){
    return String(str).replace(/[&<>\"]/g, function(s){
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
      return map[s] || s;
    });
  }

  // Always ask on first load of a tab
  initJoinFlow();
})();
