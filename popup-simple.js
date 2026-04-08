// Popup Simple - Debug Script
const output = document.getElementById('output');

function log(message, type = 'info') {
  const p = document.createElement('p');
  p.textContent = message;
  if (type === 'error') p.className = 'error';
  if (type === 'success') p.className = 'success';
  output.appendChild(p);
  console.log(message);
}

document.getElementById('testBtn').addEventListener('click', async () => {
  output.innerHTML = '<p>Test in corso...</p>';
  
  try {
    log('1. Ottengo tab corrente...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    log(`✓ Tab ID: ${tab.id}`, 'success');
    log(`✓ URL: ${tab.url}`);
    log(`✓ Titolo: ${tab.title}`);
    
    // Verifica che non sia una pagina chrome://
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      log('✗ Impossibile analizzare pagine interne di Chrome', 'error');
      return;
    }
    
    log('2. Invio messaggio al content script...');
    
    // Usa un timeout per evitare attese infinite
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: nessuna risposta dal content script')), 5000)
    );
    
    const messagePromise = chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });
    
    const response = await Promise.race([messagePromise, timeoutPromise]);
    
    log('3. Risposta ricevuta');
    
    if (response && response.success) {
      log('✓ Estrazione riuscita!', 'success');
      log(`Titolo: ${response.article.title}`);
      log(`Parole: ${response.article.wordCount}`);
      log(`Paragrafi: ${response.article.paragraphs.length}`);
      log(`Tempo lettura: ${response.article.readingTimeMinutes} min`);
    } else {
      log(`✗ Errore: ${response?.error || 'Risposta non valida'}`, 'error');
    }
    
  } catch (error) {
    log(`✗ Errore: ${error.message}`, 'error');
    log('Suggerimento: Ricarica la pagina (F5) e riprova', 'error');
    console.error('Errore completo:', error);
  }
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

log('Popup caricato correttamente', 'success');
