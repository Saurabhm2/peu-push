(function () {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD1NA7FETpU8ouWppQvZfl5YhnR208YxxA",
    authDomain: "puneexamupdate-fbefe.firebaseapp.com",
    projectId: "puneexamupdate-fbefe",
    storageBucket: "puneexamupdate-fbefe.firebasestorage.app",
    messagingSenderId: "316110951786",
    appId: "1:316110951786:web:a7e4c32a6e7331c7568113"
  };
  const VAPID_KEY = "BPZ5P0IwVsp99V98AP6tKaKQ9dwlsl-_C73cu2sdeI-Mhwnra6iSbo4PF81_fQ6NdvVlMpkqZiZefndBFeJqonU";

  // ⬇️ Replace YOUR_GITHUB_USERNAME with your actual GitHub username
  const SW_URL = "https://Saurabhm2.github.io/peu-push/service-worker.js";

  const style = document.createElement('style');
  style.textContent = `
    #peu-popup-overlay {
      position:fixed;inset:0;background:rgba(0,0,0,0.45);
      z-index:99998;display:flex;align-items:center;
      justify-content:center;animation:peuFadeIn 0.3s ease;
    }
    @keyframes peuFadeIn{from{opacity:0}to{opacity:1}}
    #peu-popup {
      background:#fff;border-radius:18px;padding:32px 28px 24px;
      max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.25);
      text-align:center;position:relative;
      animation:peuSlideUp 0.35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes peuSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
    #peu-popup .peu-logo{width:64px;height:64px;border-radius:50%;margin:0 auto 14px;display:block;border:3px solid #f0f0f0;}
    #peu-popup h3{font-size:18px;font-weight:700;color:#1a1a2e;margin:0 0 8px;font-family:'Segoe UI',sans-serif;}
    #peu-popup p{font-size:13.5px;color:#555;margin:0 0 22px;line-height:1.5;font-family:'Segoe UI',sans-serif;}
    #peu-popup .peu-btns{display:flex;gap:10px;justify-content:center;}
    #peu-popup .peu-allow{
      background:linear-gradient(135deg,#1565C0,#1976D2);color:#fff;
      border:none;border-radius:50px;padding:11px 28px;font-size:14px;
      font-weight:600;cursor:pointer;flex:1;font-family:'Segoe UI',sans-serif;
      transition:transform 0.15s,box-shadow 0.15s;
    }
    #peu-popup .peu-allow:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(21,101,192,0.4);}
    #peu-popup .peu-deny{background:#f5f5f5;color:#666;border:none;border-radius:50px;padding:11px 20px;font-size:13px;cursor:pointer;font-family:'Segoe UI',sans-serif;}
    #peu-popup .peu-close{position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;}
    #peu-toast{
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
      background:#1565C0;color:#fff;padding:12px 24px;border-radius:50px;
      font-size:14px;font-family:'Segoe UI',sans-serif;font-weight:500;
      box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:99999;
      transition:transform 0.4s cubic-bezier(.34,1.56,.64,1);white-space:nowrap;
    }
    #peu-toast.show{transform:translateX(-50%) translateY(0);}
  `;
  document.head.appendChild(style);

  function showToast(msg, color) {
    let t = document.getElementById('peu-toast');
    if (!t) { t = document.createElement('div'); t.id = 'peu-toast'; document.body.appendChild(t); }
    t.style.background = color || '#1565C0';
    t.textContent = msg;
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  function showPopup() {
    if (document.getElementById('peu-popup-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'peu-popup-overlay';
    overlay.innerHTML = `
      <div id="peu-popup">
        <button class="peu-close" id="peu-close-btn">×</button>
        <img class="peu-logo" src="https://www.puneexamupdate.in/favicon.ico"
             onerror="this.src='https://via.placeholder.com/64x64/1565C0/fff?text=PEU'" alt="PEU">
        <h3>🔔 Stay Updated!</h3>
        <p>Get instant notifications for <strong>new exam results, admit cards & jobs</strong>. Never miss an update!</p>
        <div class="peu-btns">
          <button class="peu-allow" id="peu-allow-btn">✅ Allow Notifications</button>
          <button class="peu-deny" id="peu-deny-btn">No Thanks</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('peu-allow-btn').onclick = handleAllow;
    document.getElementById('peu-deny-btn').onclick = handleDeny;
    document.getElementById('peu-close-btn').onclick = handleDeny;
    overlay.onclick = function(e) { if (e.target === overlay) handleDeny(); };
  }

  function closePopup() {
    const o = document.getElementById('peu-popup-overlay');
    if (o) o.remove();
  }

  function handleDeny() {
    closePopup();
    localStorage.setItem('peu_denied', Date.now());
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function handleAllow() {
    closePopup();
    try {
      await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js');

      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      const messaging = firebase.messaging();
      const db = firebase.firestore();

      const swReg = await navigator.serviceWorker.register(SW_URL);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('❌ Permission denied. Enable in browser settings.', '#e53935');
        return;
      }

      const token = await messaging.getToken({
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg
      });

      await db.collection('subscribers').doc(token).set({
        token: token,
        subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent.substring(0, 100),
        page: window.location.href.substring(0, 200)
      });

      localStorage.setItem('peu_subscribed', 'true');
      showToast('🎉 Subscribed! You will get instant updates.', '#2e7d32');
    } catch (err) {
      console.error('Push error:', err);
      showToast('❌ Something went wrong. Try again.', '#e53935');
    }
  }

  function init() {
    if (localStorage.getItem('peu_subscribed') === 'true') return;
    const denied = localStorage.getItem('peu_denied');
    if (denied && (Date.now() - parseInt(denied)) < 7 * 24 * 60 * 60 * 1000) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setTimeout(showPopup, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
