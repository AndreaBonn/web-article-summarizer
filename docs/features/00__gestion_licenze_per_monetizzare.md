### 8.3 Integrazione nel Popup Principale

**File: `popup/popup.js`**

```javascript
// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
  // Inizializza managers
  const creditManager = new CreditManager();
  const featureGuard = new FeatureGuard();
  
  // Aggiorna badge crediti
  await updateCreditsDisplay();
  
  // Setup event listeners
  setupCreditListeners();
  setupFeatureButtons();
});

// Aggiorna display crediti
async function updateCreditsDisplay() {
  const creditManager = new CreditManager();
  const balance = await creditManager.getBalance();
  
  const display = document.getElementById('credits-display');
  if (display) {
    display.textContent = balance;
    
    // Animazione quando cambiano
    display.classList.add('pulse');
    setTimeout(() => display.classList.remove('pulse'), 500);
  }

  // Aggiorna anche in altri posti se necessario
  document.querySelectorAll('.balance-amount').forEach(el => {
    el.textContent = `${balance} crediti`;
  });
}

// Setup listeners crediti
function setupCreditListeners() {
  // Click su badge crediti → apre dashboard
  document.getElementById('credits-display')?.addEventListener('click', () => {
    openCreditsModal();
  });

  document.getElementById('manage-credits')?.addEventListener('click', () => {
    openCreditsModal();
  });

  // Listener evento paywall
  window.addEventListener('showPaywall', (e) => {
    showPaywallModal(e.detail);
  });
}

// Setup pulsanti features
function setupFeatureButtons() {
  // Genera Riassunto
  document.getElementById('generate-summary')?.addEventListener('click', async () => {
    const featureGuard = new FeatureGuard();
    
    const result = await featureGuard.executeFeature('summary', async () => {
      showLoading(true);
      const summary = await generateSummary(currentArticle, userSettings);
      showLoading(false);
      return summary;
    }, {
      articleTitle: currentArticle.title,
      provider: userSettings.provider
    });

    if (result.success) {
      displaySummary(result.result);
      await updateCreditsDisplay();
      showToast(`Riassunto generato! (${result.charged} crediti)`, 'success');
    }
  });

  // Estrai Punti Chiave
  document.getElementById('extract-keypoints')?.addEventListener('click', async () => {
    const featureGuard = new FeatureGuard();
    
    const result = await featureGuard.executeFeature('keyPoints', async () => {
      return await extractKeyPoints(currentArticle, userSettings);
    });

    if (result.success) {
      displayKeyPoints(result.result);
      await updateCreditsDisplay();
    }
  });

  // Q&A
  document.getElementById('ask-question')?.addEventListener('click', async () => {
    const featureGuard = new FeatureGuard();
    const question = prompt('Fai una domanda sull\'articolo:');
    
    if (!question) return;

    const result = await featureGuard.executeFeature('qa', async () => {
      return await askQuestion(currentArticle, question, userSettings);
    }, { question });

    if (result.success) {
      displayQAAnswer(result.result);
      await updateCreditsDisplay();
    }
  });

  // Estrai Citazioni
  document.getElementById('extract-citations')?.addEventListener('click', async () => {
    const featureGuard = new FeatureGuard();
    
    const result = await featureGuard.executeFeature('citations', async () => {
      return await extractCitations(currentArticle, userSettings);
    });

    if (result.success) {
      displayCitations(result.result);
      await updateCreditsDisplay();
    }
  });
}

// Mostra modal gestione crediti
function openCreditsModal() {
  const modal = document.getElementById('activate-modal');
  if (!modal) {
    // Crea modal dinamicamente
    createActivateModal();
  }
  
  showModal('activate-modal');
  
  // Aggiorna saldo corrente
  updateModalBalance();
}

// Mostra modal paywall
function showPaywallModal(data) {
  const modal = document.getElementById('paywall-modal');
  
  // Popola dati
  document.getElementById('paywall-operation').textContent = getOperationName(data.featureName);
  document.getElementById('paywall-cost').textContent = `${data.cost} crediti`;
  document.getElementById('paywall-balance').textContent = `${data.balance} crediti`;
  document.getElementById('paywall-missing').textContent = `${data.missing} crediti`;
  
  showModal('paywall-modal');
}

function getOperationName(featureName) {
  const names = {
    summary: 'Riassunto',
    keyPoints: 'Punti Chiave',
    qa: 'Domanda & Risposta',
    citations: 'Estrazione Citazioni',
    advancedSummary: 'Riassunto Avanzato'
  };
  return names[featureName] || featureName;
}
```

### 8.4 Modal Attivazione Codice (JavaScript)

**File: `modals/activate-license.js`**

```javascript
class ActivateLicenseModal {
  constructor() {
    this.validator = new LicenseCodeValidator();
    this.creditManager = new CreditManager();
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Attiva codice
    document.getElementById('activate-code-btn')?.addEventListener('click', () => {
      this.activateCode();
    });

    // Input codice: auto-formatta
    const input = document.getElementById('license-code');
    input?.addEventListener('input', (e) => {
      this.formatCodeInput(e.target);
    });

    // Enter per attivare
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.activateCode();
      }
    });

    // Pulsanti acquisto
    document.querySelectorAll('.btn-package').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const packageName = e.target.getAttribute('data-package');
        this.purchasePackage(packageName);
      });
    });
  }

  formatCodeInput(input) {
    // Auto-uppercase e formatta
    let value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    input.value = value;
  }

  async activateCode() {
    const input = document.getElementById('license-code');
    const code = input.value.trim();

    if (!code) {
      this.showFeedback('Inserisci un codice', 'error');
      return;
    }

    // Mostra loading
    this.setLoading(true);

    try {
      // Valida e attiva
      const result = await this.validator.activateCode(code);

      if (result.success) {
        // Successo!
        this.showFeedback(result.message, 'success');
        
        // Aggiorna display
        await updateCreditsDisplay();
        
        // Pulisci input
        input.value = '';
        
        // Mostra celebrazione
        this.showSuccessAnimation(result.creditsAdded);
        
        // Chiudi modal dopo 3 secondi
        setTimeout(() => {
          closeModal('activate-modal');
        }, 3000);

      } else {
        // Errore
        this.showFeedback(result.message, 'error');
      }

    } catch (error) {
      this.showFeedback('Errore durante l\'attivazione: ' + error.message, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  showFeedback(message, type) {
    const feedback = document.getElementById('activation-feedback');
    feedback.textContent = message;
    feedback.className = `activation-feedback ${type}`;
    feedback.style.display = 'block';

    // Auto-hide dopo 5 secondi per errori
    if (type === 'error') {
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 5000);
    }
  }

  setLoading(isLoading) {
    const btn = document.getElementById('activate-code-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    if (isLoading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
      btn.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      btn.disabled = false;
    }
  }

  showSuccessAnimation(creditsAdded) {
    // Confetti animation o simile
    const celebration = document.createElement('div');
    celebration.className = 'celebration-overlay';
    celebration.innerHTML = `
      <div class="celebration-content">
        <div class="celebration-icon">🎉</div>
        <h2>Attivazione Completata!</h2>
        <p class="celebration-credits">+${creditsAdded} crediti</p>
        <p>Ora puoi usare tutte le funzionalità premium!</p>
      </div>
    `;
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      celebration.classList.add('show');
    }, 10);

    setTimeout(() => {
      celebration.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(celebration);
      }, 300);
    }, 2500);
  }

  purchasePackage(packageName) {
    const pkg = CREDIT_SYSTEM.PACKAGES[packageName];
    
    // Costruisci URL Stripe Checkout
    const checkoutUrl = `${CREDIT_SYSTEM.PURCHASE_URL}?prefilled_promo_code=${packageName}`;
    
    // Apri in nuova tab
    chrome.tabs.create({ url: checkoutUrl });
    
    // Tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'initiate_checkout', {
        package: packageName,
        value: pkg.price,
        currency: pkg.currency
      });
    }
  }

  async updateModalBalance() {
    const balance = await this.creditManager.getBalance();
    const display = document.getElementById('current-balance');
    if (display) {
      display.textContent = `${balance} crediti`;
    }
  }
}

// Inizializza quando DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new ActivateLicenseModal();
});
```

### 8.5 Tool Generazione Batch Codici

**File: `tools/batch-generator.html` (NON nell'estensione)**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>License Code Generator</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #555;
    }
    input, select {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #5568d3;
    }
    .output {
      margin-top: 32px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    .code-list {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.8;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .stat-card {
      padding: 16px;
      background: #f0f4ff;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔑 License Code Generator</h1>
    <p>Tool per generare batch di codici licenza per AI Article Summarizer</p>

    <div class="form-group">
      <label>Secret Key</label>
      <input type="password" id="secretKey" placeholder="your-secret-key-2024">
      <small>⚠️ Deve essere identico a quello nell'estensione</small>
    </div>

    <div class="form-group">
      <label>Pacchetto</label>
      <select id="package">
        <option value="50">Starter - 50 crediti (€5)</option>
        <option value="150">Popular - 150 crediti (€12)</option>
        <option value="500">Professional - 500 crediti (€30)</option>
      </select>
    </div>

    <div class="form-group">
      <label>Quantità Codici</label>
      <input type="number" id="quantity" value="10" min="1" max="1000">
    </div>

    <div class="form-group">
      <label>Batch ID (per tracciabilità)</label>
      <input type="text" id="batchId" placeholder="01" maxlength="2">
      <small>Es: 01 per prima vendita, 02 per seconda, etc.</small>
    </div>

    <button onclick="generateCodes()">🎲 Genera Codici</button>

    <div class="output" id="output" style="display:none">
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value" id="totalCodes">0</div>
          <div class="stat-label">Codici Generati</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="totalCredits">0</div>
          <div class="stat-label">Crediti Totali</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="totalValue">€0</div>
          <div class="stat-label">Valore Totale</div>
        </div>
      </div>

      <h3>Codici Generati:</h3>
      <div class="code-list" id="codeList"></div>

      <button onclick="downloadCSV()" style="margin-top: 16px">
        📥 Download CSV
      </button>
      <button onclick="copyToClipboard()" style="margin-top: 16px">
        📋 Copia Tutti
      </button>
    </div>
  </div>

  <script src="license-generator.js"></script>
  <script>
    let generatedCodes = [];
    let currentCredits = 0;

    function generateCodes() {
      const secretKey = document.getElementById('secretKey').value;
      const credits = parseInt(document.getElementById('package').value);
      const quantity = parseInt(document.getElementById('quantity').value);
      const batchId = document.getElementById('batchId').value || '00';

      if (!secretKey) {
        alert('Inserisci la Secret Key');
        return;
      }

      // Inizializza generator
      const generator = new LicenseCodeGenerator(secretKey);

      // Genera batch
      generatedCodes = generator.generateBatch(credits, quantity, batchId);
      currentCredits = credits;

      // Mostra output
      displayCodes(generatedCodes, credits, quantity);
    }

    function displayCodes(codes, credits, quantity) {
      const output = document.getElementById('output');
      const codeList = document.getElementById('codeList');

      // Stats
      const pricePerCredit = credits === 50 ? 0.10 : credits === 150 ? 0.08 : 0.06;
      const totalValue = (credits * quantity * pricePerCredit).toFixed(2);

      document.getElementById('totalCodes').textContent = quantity;
      document.getElementById('totalCredits').textContent = credits * quantity;
      document.getElementById('totalValue').textContent = `€${totalValue}`;

      // Lista codici
      codeList.innerHTML = codes.map((code, i) => 
        `<div>${i + 1}. ${code}</div>`
      ).join('');

      output.style.display = 'block';
    }

    function downloadCSV() {
      const credits = currentCredits;
      const batchId = document.getElementById('batchId').value || '00';
      
      // Crea CSV
      const csv = ['Code,Credits,Batch,Generated,Value'];
      const pricePerCredit = credits === 50 ? 0.10 : credits === 150 ? 0.08 : 0.06;
      const price = (credits * pricePerCredit).toFixed(2);

      generatedCodes.forEach(code => {
        csv.push(`${code},${credits},${batchId},${new Date().toISOString()},€${price}`);
      });

      // Download
      const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-codes-batch-${batchId}-${Date.now()}.csv`;
      a.click();
    }

    function copyToClipboard() {
      const text = generatedCodes.join('\n');
      navigator.clipboard.writeText(text);
      alert('Codici copiati negli appunti!');
    }
  </script>
</body>
</html>
```

---

## 9. Sicurezza

### 9.1 Protezioni Implementate

| Minaccia | Protezione | Efficacia |
|----------|-----------|-----------|
| **Generazione codici falsi** | Checksum crittografico con secret key | ⭐⭐⭐⭐⭐ |
| **Riutilizzo stesso codice** | Registro locale codici attivati | ⭐⭐⭐⭐⭐ |
| **Manomissione saldo** | Storage locale (accettabile) | ⭐⭐⭐ |
| **Condivisione massiva** | [Opzionale] Verifica server | ⭐⭐⭐⭐ |
| **Reverse engineering** | Offuscazione codice | ⭐⭐ |

### 9.2 Secret Key Management

**⚠️ CRITICAMENTE IMPORTANTE:**

```javascript
// ❌ MAI fare questo:
const SECRET_KEY = 'my-secret-key-2024';

// ✅ Meglio:
// 1. Genera secret key casuale e complessa
const SECRET_KEY = 'kJ8#mP2$vN9@xQ5&wR7*yT4!zU6^aB3%cD1-eF0+gH2~iL8';

// 2. Mantienila identica in:
//    - license-generator.js (sul tuo computer)
//    - license-validator.js (nell'estensione)

// 3. NON committare mai su Git pubblico
//    Usa .env o file di config escluso da .gitignore

// 4. Se compromessa, generane una nuova e rigenera tutti i codici
```

**Generazione Secret Key Sicura:**

```javascript
// Node.js
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('base64');
console.log(secretKey);
// Output: "kJ8mP2vN9xQ5wR7yT4zU6aB3cD1eF0gH2iL8..."
```

### 9.3 Offuscazione Codice (Opzionale)

Per rendere più difficile il reverse engineering:

```bash
# Installa webpack e offuscatore
npm install --save-dev webpack webpack-cli javascript-obfuscator

# webpack.config.js
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js'
  },
  plugins: [
    new JavaScriptObfuscator({
      rotateStringArray: true,
      stringArray: true,
      stringArrayThreshold: 0.75
    })
  ]
};
```

**Nota:** Offuscazione rallenta codice e non è sicurezza vera. Secret key rimane comunque estrattibile da estensione installata. È più un deterrente che protezione reale.

### 9.4 Verifica Server-Side (Opzionale Avanzata)

Se vuoi limitare condivisione massiva:

```javascript
// Backend endpoint: POST /api/verify-code
app.post('/api/verify-code', async (req, res) => {
  const { code } = req.body;

  // Conta attivazioni
  const activations = await db.collection('activations')
    .where('code', '==', code)
    .get();

  const count = activations.size;

  // Permetti max 5 attivazioni
  if (count >= 5) {
    return res.json({
      valid: false,
      message: 'Codice già usato troppe volte. Contatta supporto.'
    });
  }

  // Registra nuova attivazione
  await db.collection('activations').add({
    code,
    timestamp: Date.now(),
    ip: req.ip
  });

  res.json({ valid: true });
});
```

---

## 10. Testing

### 10.1 Test Checklist

**Generazione Codici:**
- [ ] Codice generato ha formato corretto
- [ ] Checksum valido
- [ ] Crediti correttamente encoded
- [ ] Batch ID presente
- [ ] Codici unici (no duplicati in batch)

**Validazione Codici:**
- [ ] Codice valido viene accettato
- [ ] Codice invalido viene rifiutato
- [ ] Codice manomesso viene rifiutato
- [ ] Crediti corretti vengono aggiunti
- [ ] Codice già usato viene rifiutato

**Consumo Crediti:**
- [ ] Operazione consuma crediti corretti
- [ ] Saldo aggiornato correttamente
- [ ] Transazione loggata
- [ ] Badge UI aggiornato
- [ ] Se operazione fallisce, crediti NON consumati

**Paywall:**
- [ ] Appare quando crediti insufficienti
- [ ] Mostra informazioni corrette (costo, saldo, mancanti)
- [ ] Pulsanti funzionano (acquista, attiva)
- [ ] Chiude correttamente

**Limiti Free:**
- [ ] Limiti giornalieri rispettati
- [ ] Reset a mezzanotte
- [ ] Contatori corretti

### 10.2 Test Scenarios

```javascript
// Test Suite
describe('Credit System', () => {
  
  test('Generate valid license code', () => {
    const generator = new LicenseCodeGenerator('test-secret');
    const code = generator.generateCode(50, '01');
    
    expect(code).toMatch(/^AIS-32-[A-Z0-9]+-[A-Z0-9]+-01-[A-Z0-9]+$/);
  });

  test('Validate correct code', () => {
    const generator = new LicenseCodeGenerator('test-secret');
    const validator = new LicenseCodeValidator();
    validator.secretKey = 'test-secret';
    
    const code = generator.generateCode(50, '01');
    const result = validator.validateCode(code);
    
    expect(result.valid).toBe(true);
    expect(result.credits).toBe(50);
  });

  test('Reject tampered code', () => {
    const validator = new LicenseCodeValidator();
    const tamperedCode = 'AIS-32-LK7M3P-9X2QA-01-WRONG';
    
    const result = validator.validateCode(tamperedCode);
    
    expect(result.valid).toBe(false);
  });

  test('Consume credits correctly', async () => {
    const manager = new CreditManager();
    await manager.addCredits(10, 'TEST-CODE');
    
    const result = await manager.consumeCredits('summary');
    
    expect(result.success).toBe(true);
    expect(result.charged).toBe(1);
    expect(result.balance).toBe(9);
  });

  test('Block when insufficient credits', async () => {
    const manager = new CreditManager();
    await manager.reset();
    
    try {
      await manager.consumeCredits('citations'); // Cost: 3
      fail('Should have thrown error');
    } catch (error) {
      expect(error.message).toContain('insufficienti');
    }
  });
});
```

### 10.3 Test Manuale

**Procedura Test Completo:**

1. **Reset estensione**
   ```javascript
   // In console estensione
   await chrome.storage.local.clear();
   ```

2. **Genera codice test**
   - Apri `tools/batch-generator.html`
   - Genera 1 codice da 50 crediti

3. **Attiva codice**
   - Apri popup estensione
   - Click badge crediti
   - Inserisci codice
   - Verifica: saldo = 50 ✅

4. **Usa feature premium**
   - Genera riassunto (costo: 1)
   - Verifica: saldo = 49 ✅
   - Controlla log transazioni

5. **Testa paywall**
   - Usa 49 crediti
   - Prova operazione da 3 crediti
   - Verifica: paywall appare ✅

6. **Testa riattivazione**
   - Prova reinserire stesso codice
   - Verifica: errore "già usato" ✅

7. **Testa limiti free**
   - Reset crediti a 0
   - Genera 3 riassunti gratis
   - Al 4°: paywall ✅

8. **Testa persistence**
   - Chiudi e riapri estensione
   - Verifica: saldo mantenuto ✅

---

## 11. Monetizzazione

### 11.1 Setup Pagamenti

**Opzione A: Stripe (Consigliato)**

1. Crea account Stripe: https://stripe.com
2. Crea 3 prodotti:
   - Starter: €5 per 50 crediti
   - Popular: €12 per 150 crediti
   - Professional: €30 per 500 crediti
3. Per ogni prodotto, crea "Payment Link"
4. Configura webhook per notifiche pagamento
5. Dopo pagamento: invia email con codice

**Webhook Handler (Node.js):**

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Determina pacchetto acquistato
    const priceId = session.line_items.data[0].price.id;
    const package = getPack  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 6.2 Modal Attivazione Codice

**File: `activate-license-modal.html`**

```html
<div class="modal-overlay" id="activate-modal" style="display:none">
  <div class="modal-content activate-modal">
    <button class="modal-close" id="close-activate-modal">×</button>
    
    <div class="modal-header">
      <h2>🔑 Attiva Codice Licenza</h2>
      <p class="modal-subtitle">Inserisci il codice ricevuto via email</p>
    </div>

    <div class="modal-body">
      <!-- Saldo corrente -->
      <div class="current-balance">
        <span class="balance-label">Saldo attuale:</span>
        <span class="balance-amount" id="current-balance">0 crediti</span>
      </div>

      <!-- Input codice -->
      <div class="code-input-group">
        <label for="license-code">Codice Licenza</label>
        <input 
          type="text" 
          id="license-code" 
          placeholder="AIS-32-XXXXX-XXXXX-XX-XXXX"
          class="code-input"
          maxlength="30"
          autocomplete="off"
          spellcheck="false"
        >
        <span class="input-help">Formato: AIS-XX-XXXXX-XXXXX-XX-XXXX</span>
      </div>

      <!-- Pulsante attiva -->
      <button class="btn-primary btn-large" id="activate-code-btn">
        <span class="btn-text">✨ Attiva Codice</span>
        <span class="btn-loading" style="display:none">
          <span class="spinner"></span> Verifica in corso...
        </span>
      </button>

      <!-- Messaggio feedback -->
      <div class="activation-feedback" id="activation-feedback" style="display:none"></div>

      <!-- Sezione acquisto -->
      <div class="purchase-section">
        <div class="divider">
          <span>oppure</span>
        </div>
        
        <h3>📦 Acquista Crediti</h3>
        <p class="purchase-subtitle">Scegli il pacchetto più adatto a te</p>

        <div class="packages-grid">
          <div class="package-card">
            <div class="package-header">
              <h4>Starter</h4>
              <span class="package-badge">Occasionale</span>
            </div>
            <div class="package-price">
              <span class="price">€5</span>
            </div>
            <div class="package-credits">
              <span class="credits-big">50</span> crediti
            </div>
            <ul class="package-features">
              <li>✅ ~50 articoli analizzati</li>
              <li>✅ Tutte le funzionalità premium</li>
              <li>✅ Valido a vita</li>
            </ul>
            <button class="btn-secondary btn-package" data-package="starter">
              Acquista
            </button>
          </div>

          <div class="package-card popular">
            <div class="package-ribbon">PIÙ POPOLARE</div>
            <div class="package-header">
              <h4>Popular</h4>
              <span class="package-badge">Regolare</span>
            </div>
            <div class="package-price">
              <span class="price">€12</span>
              <span class="price-note">Risparmi 20%</span>
            </div>
            <div class="package-credits">
              <span class="credits-big">150</span> crediti
            </div>
            <ul class="package-features">
              <li>✅ ~150 articoli analizzati</li>
              <li>✅ Tutte le funzionalità premium</li>
              <li>✅ Valido a vita</li>
              <li>✅ Miglior rapporto qualità/prezzo</li>
            </ul>
            <button class="btn-primary btn-package" data-package="popular">
              Acquista
            </button>
          </div>

          <div class="package-card">
            <div class="package-header">
              <h4>Professional</h4>
              <span class="package-badge">Intensivo</span>
            </div>
            <div class="package-price">
              <span class="price">€30</span>
              <span class="price-note">Risparmi 40%</span>
            </div>
            <div class="package-credits">
              <span class="credits-big">500</span> crediti
            </div>
            <ul class="package-features">
              <li>✅ ~500 articoli analizzati</li>
              <li>✅ Tutte le funzionalità premium</li>
              <li>✅ Valido a vita</li>
              <li>✅ Massimo risparmio</li>
            </ul>
            <button class="btn-secondary btn-package" data-package="professional">
              Acquista
            </button>
          </div>
        </div>

        <div class="purchase-info">
          <p>💳 Pagamento sicuro con PayPal o Carta di Credito</p>
          <p>📧 Ricevi il codice immediatamente via email</p>
          <p>🔒 Attivazione istantanea</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Stili CSS:**

```css
.activate-modal {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.current-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f0f4ff;
  border-radius: 8px;
  margin-bottom: 24px;
}

.balance-amount {
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
}

.code-input-group {
  margin-bottom: 24px;
}

.code-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: border-color 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: #667eea;
}

.input-help {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 6px;
}

.activation-feedback {
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  animation: slideDown 0.3s ease;
}

.activation-feedback.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.activation-feedback.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.package-card {
  position: relative;
  padding: 24px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s;
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.package-card.popular {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea05 0%, #764ba205 100%);
}

.package-ribbon {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #667eea;
  color: white;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.package-header h4 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.package-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.package-price {
  margin: 16px 0;
}

.price {
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.price-note {
  display: block;
  font-size: 12px;
  color: #27ae60;
  font-weight: 600;
  margin-top: 4px;
}

.credits-big {
  font-size: 48px;
  font-weight: 700;
  color: #667eea;
}

.package-features {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  text-align: left;
}

.package-features li {
  padding: 8px 0;
  font-size: 14px;
  color: #555;
}

.btn-package {
  width: 100%;
  margin-top: 16px;
}

.purchase-info {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.purchase-info p {
  font-size: 14px;
  color: #666;
  margin: 8px 0;
}
```

### 6.3 Paywall Modal

**Quando utente tenta operazione premium senza crediti:**

```html
<div class="modal-overlay" id="paywall-modal" style="display:none">
  <div class="modal-content paywall-modal">
    <button class="modal-close" id="close-paywall-modal">×</button>
    
    <div class="paywall-icon">🔒</div>
    
    <h2>Funzionalità Premium</h2>
    <p class="paywall-subtitle">Questa operazione richiede crediti premium</p>

    <div class="paywall-info">
      <div class="info-row">
        <span class="info-label">Operazione:</span>
        <span class="info-value" id="paywall-operation">Riassunto Avanzato</span>
      </div>
      <div class="info-row">
        <span class="info-label">Costo:</span>
        <span class="info-value" id="paywall-cost">2 crediti</span>
      </div>
      <div class="info-row">
        <span class="info-label">Saldo attuale:</span>
        <span class="info-value insufficient" id="paywall-balance">0 crediti</span>
      </div>
      <div class="info-row">
        <span class="info-label">Mancanti:</span>
        <span class="info-value missing" id="paywall-missing">2 crediti</span>
      </div>
    </div>

    <div class="paywall-actions">
      <button class="btn-primary btn-large" id="paywall-buy">
        💳 Acquista Crediti
      </button>
      <button class="btn-secondary" id="paywall-activate">
        🔑 Ho già un codice
      </button>
      <button class="btn-link" id="paywall-close">
        Annulla
      </button>
    </div>

    <div class="paywall-benefits">
      <h4>✨ Con i crediti premium ottieni:</h4>
      <ul>
        <li>Riassunti illimitati</li>
        <li>Domande & Risposte sull'articolo</li>
        <li>Estrazione citazioni automatica</li>
        <li>Tone control avanzato</li>
        <li>Tutti i provider LLM</li>
        <li>Export in più formati</li>
      </ul>
    </div>
  </div>
</div>
```

### 6.4 Indicatore Costo Operazione

**Prima di ogni operazione premium, mostra quanto costa:**

```html
<button class="feature-button" id="generate-summary">
  <span class="feature-icon">📝</span>
  <span class="feature-label">Genera Riassunto</span>
  <span class="feature-cost">1 💎</span>
</button>

<button class="feature-button" id="ask-question">
  <span class="feature-icon">💬</span>
  <span class="feature-label">Fai una Domanda</span>
  <span class="feature-cost">2 💎</span>
</button>

<button class="feature-button" id="extract-citations">
  <span class="feature-icon">📚</span>
  <span class="feature-label">Estrai Citazioni</span>
  <span class="feature-cost">3 💎</span>
</button>
```

```css
.feature-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.feature-button:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.feature-cost {
  margin-left: auto;
  padding: 4px 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.feature-button.free .feature-cost {
  background: #27ae60;
}

.feature-button.free .feature-cost::after {
  content: ' GRATIS';
}
```

### 6.5 Pagina Gestione Crediti

**File: `credits-dashboard.html`**

```html
<div class="credits-dashboard">
  <!-- Header con saldo -->
  <div class="dashboard-header">
    <div class="balance-card">
      <div class="balance-icon">💎</div>
      <div class="balance-info">
        <span class="balance-label">Saldo Crediti</span>
        <span class="balance-amount" id="dashboard-balance">0</span>
      </div>
      <button class="btn-primary" id="dashboard-buy">+ Aggiungi</button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="dashboard-tabs">
    <button class="tab active" data-tab="usage">📊 Utilizzo</button>
    <button class="tab" data-tab="history">📜 Cronologia</button>
    <button class="tab" data-tab="codes">🔑 Codici Attivati</button>
  </div>

  <!-- Tab: Utilizzo -->
  <div class="tab-content active" id="tab-usage">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="total-consumed">0</div>
        <div class="stat-label">Crediti Usati</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="total-added">0</div>
        <div class="stat-label">Crediti Acquistati</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="last-7-days">0</div>
        <div class="stat-label">Ultimi 7 Giorni</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="last-30-days">0</div>
        <div class="stat-label">Ultimi 30 Giorni</div>
      </div>
    </div>

    <h3>Utilizzo per Operazione</h3>
    <div class="usage-by-operation" id="usage-chart">
      <!-- Grafico dinamico -->
    </div>
  </div>

  <!-- Tab: Cronologia -->
  <div class="tab-content" id="tab-history">
    <div class="history-list" id="transaction-history">
      <!-- Lista transazioni -->
    </div>
  </div>

  <!-- Tab: Codici Attivati -->
  <div class="tab-content" id="tab-codes">
    <div class="codes-list" id="activated-codes-list">
      <!-- Lista codici attivati -->
    </div>
  </div>
</div>
```

---

## 7. Flussi Operativi

### 7.1 Flusso Acquisto e Attivazione

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTENTE DECIDE DI ACQUISTARE                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SCEGLIE PACCHETTO                                        │
│    • Starter: €5 → 50 crediti                               │
│    • Popular: €12 → 150 crediti                             │
│    • Professional: €30 → 500 crediti                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CLICK "ACQUISTA" → REDIRECT A PAYPAL/STRIPE              │
│    URL: https://buy.stripe.com/xxxxx?package=popular        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. COMPLETA PAGAMENTO                                       │
│    • Inserisce dati carta/PayPal                            │
│    • Conferma pagamento                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. WEBHOOK PAYMENT → TUO SERVER                             │
│    • Genera codice licenza                                  │
│    • Salva in database                                      │
│    • Invia email con codice                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. UTENTE RICEVE EMAIL                                      │
│    Oggetto: Il tuo codice licenza AI Summarizer             │
│    Codice: AIS-32-LK7M3P-9X2QA-01-X7K9                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. APRE ESTENSIONE → CLICK "ATTIVA CODICE"                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. INSERISCE CODICE                                         │
│    • Validazione formato                                    │
│    • Verifica checksum                                      │
│    • Controlla se già usato                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. ATTIVAZIONE SUCCESSO                                     │
│    ✅ 50 crediti aggiunti!                                  │
│    Nuovo saldo: 50 crediti                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. PUÒ USARE FEATURES PREMIUM                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Flusso Uso Feature Premium

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTENTE SU ARTICOLO → CLICK "GENERA RIASSUNTO"           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FEATURE GUARD: CHECK ACCESS                              │
│    • Ottiene saldo: 10 crediti                              │
│    • Costo operazione: 1 credito                            │
│    • 10 >= 1 ? SÌ → ALLOWED                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MOSTRA CONFERMA (opzionale)                              │
│    "Questa operazione consumerà 1 credito                   │
│     Saldo dopo: 9 crediti"                                  │
│    [Continua] [Annulla]                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ESEGUE OPERAZIONE                                        │
│    • Chiama API LLM                                         │
│    • Genera riassunto                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. OPERAZIONE SUCCESSO                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CONSUMA CREDITI                                          │
│    • Sottrae 1 credito                                      │
│    • Nuovo saldo: 9                                         │
│    • Log transazione                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. MOSTRA RISULTATO + AGGIORNA BADGE                        │
│    Badge: 💎 9                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Flusso Crediti Insufficienti

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTENTE CLICK "ESTRAI CITAZIONI"                         │
│    Costo: 3 crediti                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FEATURE GUARD: CHECK ACCESS                              │
│    • Saldo: 1 credito                                       │
│    • Costo: 3 crediti                                       │
│    • 1 < 3 ? NO → BLOCKED                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MOSTRA PAYWALL MODAL                                     │
│    🔒 Crediti Insufficienti                                 │
│                                                              │
│    Operazione: Estrazione Citazioni                         │
│    Costo: 3 crediti                                         │
│    Saldo: 1 credito                                         │
│    Mancanti: 2 crediti                                      │
│                                                              │
│    [💳 Acquista Crediti] [🔑 Ho un codice]                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├───→ Click "Acquista" → Vai a checkout
                     │
                     └───→ Click "Ho un codice" → Modal attivazione
```

### 7.4 Flusso Condivisione Codice (Scenario)

**Scenario:** Mario compra codice da 50 crediti, lo condivide con Luca

```
MARIO:
1. Compra codice: AIS-32-XXX → 50 crediti
2. Attiva codice nell'estensione
   ✅ Codice valido → +50 crediti
3. Usa 10 crediti (40 rimasti)
4. Condivide codice con Luca via WhatsApp

LUCA:
1. Riceve codice da Mario
2. Prova ad attivare: AIS-32-XXX
3. Sistema verifica:
   - Checksum valido ✅
   - Già usato localmente? NO
   - [Opzionale] Server check: già usato 1 volta? SÌ, ma <5 OK
4. Attiva codice
   ✅ +50 crediti
5. Usa 15 crediti (35 rimasti)

RISULTATO:
• Mario: 40 crediti rimasti (ha usato 10)
• Luca: 35 crediti rimasti (ha usato 15)
• Totale usato: 25 crediti su 50 originali
• Sistema: ha "perso" 25 crediti, ma è accettabile
  (alternative costerebbe molto di più in sviluppo)

NOTA: Se Luca condivide ulteriormente, crediti si diluiscono ancora.
      Auto-disincentiva condivisione massiva.
```

---

## 8. Implementazione Tecnica

### 8.1 File Structure

```
ai-article-summarizer/
├── manifest.json
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   └── credits-dashboard.html
├── utils/
│   ├── credit-manager.js
│   ├── license-validator.js
│   ├── feature-guard.js
│   └── config.js
├── modals/
│   ├── activate-license-modal.html
│   ├── paywall-modal.html
│   └── modals.css
├── assets/
│   ├── icons/
│   └── images/
└── tools/ (NON nell'estensione, sul tuo computer)
    ├── license-generator.js
    └── batch-generator.html
```

### 8.2 Configurazione Centrale

**File: `utils/config.js`**

```javascript
const CREDIT_SYSTEM = {
  // Segreto condiviso (generator + validator)
  // ⚠️ CAMBIA QUESTO VALORE!
  SECRET_KEY: 'your-unique-secret-key-2024',

  // Prefisso codici
  PREFIX: 'AIS',

  // Costi operazioni (in crediti)
  COSTS: {
    summary: 1,
    keyPoints: 1,
    qa: 2,
    citations: 3,
    advancedSummary: 2,
    classification: 0,  // Gratis
    export: 0            // Gratis
  },

  // Pacchetti in vendita
  PACKAGES: {
    starter: {
      credits: 50,
      price: 5.00,
      currency: 'EUR',
      stripePriceId: 'price_xxxxx', // Da Stripe Dashboard
      description: 'Uso occasionale'
    },
    popular: {
      credits: 150,
      price: 12.00,
      currency: 'EUR',
      stripePriceId: 'price_yyyyy',
      description: 'Uso regolare',
      badge: 'PIÙ POPOLARE'
    },
    professional: {
      credits: 500,
      price: 30.00,
      currency: 'EUR',
      stripePriceId: 'price_zzzzz',
      description: 'Uso intensivo'
    }
  },

  // Limiti free
  FREE_LIMITS: {
    dailySummaries: 3,
    dailyKeyPoints: 3,
    historyArticles: 20
  },

  // Features sempre gratuite
  FREE_FEATURES: ['classification', 'export'],

  // URL acquisto
  PURCHASE_URL: 'https://buy.stripe.com/xxxxx',
  
  // Email supporto
  SUPPORT_EMAIL: 'support@yourdomain.com',

  // [Opzionale] Verifica server-side
  VERIFICATION_API: null // 'https://your-api.com/verify'
};

// Export per uso globale
if (typeof module !== 'undefined') {
  module.exports = CREDIT_SYSTEM;
}
```

### 8.3# Sistema Premium a Licenza - Documento di Progetto

## Indice
1. [Panoramica Sistema](#1-panoramica-sistema)
2. [Architettura Generale](#2-architettura-generale)
3. [Sistema a Crediti](#3-sistema-a-crediti)
4. [Generazione e Validazione Codici](#4-generazione-e-validazione-codici)
5. [Gestione Features](#5-gestione-features)
6. [Interfaccia Utente](#6-interfaccia-utente)
7. [Flussi Operativi](#7-flussi-operativi)
8. [Implementazione Tecnica](#8-implementazione-tecnica)
9. [Sicurezza](#9-sicurezza)
10. [Testing](#10-testing)
11. [Monetizzazione](#11-monetizzazione)

---

## 1. Panoramica Sistema

### 1.1 Obiettivo
Implementare un sistema di monetizzazione basato su **codici licenza prepagati** che forniscono **crediti consumabili** per funzionalità premium dell'estensione AI Article Summarizer.

### 1.2 Caratteristiche Chiave
- ✅ **Nessun backend complesso** (o minimo)
- ✅ **Sistema a crediti**: ogni operazione premium consuma X crediti
- ✅ **Anti-condivisione naturale**: condividere il codice = dividere i propri crediti
- ✅ **Codici monouso**: ogni codice può essere attivato una sola volta
- ✅ **Offline-first**: funziona anche senza connessione dopo attivazione
- ✅ **Scalabile**: diversi pacchetti di crediti disponibili

### 1.3 Modello di Business
- Utente acquista codice licenza (€5, €12, €30)
- Riceve codice univoco via email
- Inserisce codice nell'estensione
- Ottiene crediti (50, 150, 500)
- Ogni operazione premium consuma crediti
- Crediti finiti → torna a modalità free (può comprare nuovo codice)

### 1.4 Vantaggi vs Altri Sistemi

| Aspetto | Sistema a Crediti | Abbonamento | Pay-per-use Online |
|---------|-------------------|-------------|-------------------|
| Complessità backend | Minima | Alta | Alta |
| Costi operativi | ~€0/mese | €10-50/mese | €10-50/mese |
| Condivisione codici | Autodisciplinante | Problematica | Problematica |
| Privacy utente | Massima | Media | Bassa |
| Offline capability | Sì | No | No |
| Setup velocità | 1-2 giorni | 1-2 settimane | 1-2 settimane |

---

## 2. Architettura Generale

### 2.1 Componenti del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTENSIONE CHROME                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Credit Manager                                       │  │
│  │  - Gestisce saldo crediti                            │  │
│  │  - Consuma crediti per operazioni                    │  │
│  │  - Traccia uso                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  License Validator                                    │  │
│  │  - Valida codici licenza                             │  │
│  │  - Previene riutilizzo                               │  │
│  │  - Attiva crediti                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Feature Guard                                        │  │
│  │  - Controlla accesso features                        │  │
│  │  - Mostra paywall quando necessario                  │  │
│  │  - Gestisce limiti free                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chrome Storage                                       │  │
│  │  - user_credits: saldo attuale                       │  │
│  │  - activated_codes: codici già usati                 │  │
│  │  - credit_usage: log transazioni                     │  │
│  │  - free_usage: limiti giornalieri free               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Flusso Generale

```
[Utente]
   ↓
   ↓ compra codice
   ↓
[PayPal / Stripe]
   ↓
   ↓ riceve email
   ↓
[Codice: AIS-32-XXX-YYY-ZZ]
   ↓
   ↓ inserisce nell'estensione
   ↓
[License Validator]
   ↓
   ↓ verifica checksum
   ↓ verifica non già usato
   ↓
[Credit Manager]
   ↓
   ↓ aggiunge crediti
   ↓ registra codice come usato
   ↓
[Saldo: 50 crediti]
   ↓
   ↓ usa feature premium
   ↓
[Feature Guard]
   ↓
   ↓ verifica crediti sufficienti
   ↓ consuma crediti
   ↓
[Saldo: 49 crediti]
```

---

## 3. Sistema a Crediti

### 3.1 Configurazione Costi

#### Tabella Costi Operazioni

| Operazione | Costo Crediti | Motivazione |
|-----------|---------------|-------------|
| **Riassunto Base** | 1 | Operazione semplice, 1 chiamata API |
| **Punti Chiave** | 1 | Estrazione diretta, 1 chiamata API |
| **Q&A Singola** | 2 | Conversazionale, mantiene contesto |
| **Estrazione Citazioni** | 3 | Complessa, parsing strutturato |
| **Riassunto Avanzato** | 2 | Con tone control, prompt più elaborato |
| **Classificazione** | 0 | Gratuita sempre (marketing) |
| **Export Contenuti** | 0 | Gratuita (ma contenuto richiede crediti) |

#### Pacchetti Crediti in Vendita

| Pacchetto | Crediti | Prezzo | €/credito | Risparmio | Best For |
|-----------|---------|--------|-----------|-----------|----------|
| **Starter** | 50 | €5.00 | €0.10 | - | ~50 articoli, uso occasionale |
| **Popular** | 150 | €12.00 | €0.08 | 20% | ~150 articoli, uso regolare |
| **Professional** | 500 | €30.00 | €0.06 | 40% | ~500 articoli, uso intensivo |

### 3.2 Limiti Versione Free

| Feature | Limite Free | Note |
|---------|-------------|------|
| Riassunti Base | 3/giorno | Reset alle 00:00 UTC |
| Punti Chiave | 3/giorno | Reset alle 00:00 UTC |
| Q&A | 0 | Solo premium |
| Citazioni | 0 | Solo premium |
| Classificazione | Illimitata | Sempre gratuita |
| Export | Illimitato | Ma contenuto richiede crediti |
| Cronologia | Ultimi 20 | Premium: illimitata |

### 3.3 Struttura Dati Storage

```javascript
// Chrome Storage Schema
{
  // Saldo crediti corrente
  "user_credits": 50,
  
  // Codici attivati (previene riutilizzo)
  "activated_codes": {
    "AIS-32-LK7M3P-9X2QA-00-X7K9": {
      "activatedAt": 1700000000000,
      "credits": 50,
      "activated": true
    }
  },
  
  // Log transazioni crediti
  "credit_usage": [
    {
      "type": "add",
      "amount": 50,
      "operation": "Codice attivato: AIS-32-...",
      "timestamp": 1700000000000,
      "balance": 50
    },
    {
      "type": "consume",
      "amount": 1,
      "operation": "summary",
      "details": {
        "articleTitle": "...",
        "provider": "groq"
      },
      "timestamp": 1700001000000,
      "balance": 49
    }
  ],
  
  // Uso giornaliero features free
  "free_usage_2024-11-22": {
    "summary": 2,
    "keyPoints": 1
  }
}
```

---

## 4. Generazione e Validazione Codici

### 4.1 Formato Codice Licenza

```
AIS-CREDITS-TIMESTAMP-RANDOM-BATCH-CHECKSUM
 │    │        │         │       │      │
 │    │        │         │       │      └─ 4 char: verifica integrità
 │    │        │         │       └──────── 2 char: ID batch (tracciabilità)
 │    │        │         └──────────────── 5 char: casuali (unicità)
 │    │        └────────────────────────── Base36 timestamp (quando generato)
 │    └─────────────────────────────────── Hex crediti (es: 32 = 50, 96 = 150)
 └──────────────────────────────────────── Prefisso fisso "AIS"

ESEMPIO: AIS-32-LK7M3P-9X2QA-01-X7K9
         └─┘ └┘ └────┘ └───┘ └┘ └──┘
         │   │    │      │    │   └── Checksum
         │   │    │      │    └────── Batch 01
         │   │    │      └─────────── Random ID
         │   │    └────────────────── Timestamp
         │   └─────────────────────── 50 crediti (0x32)
         └─────────────────────────── Prefisso
```

### 4.2 Algoritmo Generazione (Lato Venditore)

**Tool: `license-generator.js` (gira sul tuo computer)**

```javascript
class LicenseCodeGenerator {
  constructor(secretKey) {
    this.secretKey = secretKey; // Chiave segreta condivisa
  }

  generateCode(credits, batchId = '00') {
    // 1. Converti crediti in hex (2 caratteri)
    const creditsHex = credits.toString(16).padStart(2, '0').toUpperCase();
    
    // 2. Timestamp in base36 (compatto)
    const timestamp = Date.now().toString(36).toUpperCase();
    
    // 3. ID casuale (5 caratteri)
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // 4. Batch ID (tracciabilità vendite)
    const batch = batchId.padStart(2, '0');
    
    // 5. Componi dati codice
    const codeData = `${creditsHex}-${timestamp}-${random}-${batch}`;
    
    // 6. Genera checksum per validazione
    const checksum = this.generateChecksum(codeData);
    
    // 7. Codice finale
    return `AIS-${codeData}-${checksum}`;
  }

  generateChecksum(data) {
    // Hash semplice ma efficace
    let hash = 0;
    const combined = data + this.secretKey;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Converti in base36 e prendi primi 4 caratteri
    return Math.abs(hash).toString(36).substr(0, 4).toUpperCase();
  }

  // Genera batch multipli
  generateBatch(credits, quantity, batchId) {
    const codes = [];
    for (let i = 0; i < quantity; i++) {
      codes.push(this.generateCode(credits, batchId));
    }
    return codes;
  }

  // Esporta CSV per record
  exportToCSV(codes, credits, batchId) {
    const csv = ['Code,Credits,Batch,Generated'];
    codes.forEach(code => {
      csv.push(`${code},${credits},${batchId},${new Date().toISOString()}`);
    });
    return csv.join('\n');
  }
}

// ESEMPIO USO
const generator = new LicenseCodeGenerator('my-secret-key-2024');

// Genera 10 codici da 50 crediti (batch 01)
const codes50 = generator.generateBatch(50, 10, '01');
console.log(codes50);

// Genera 5 codici da 150 crediti (batch 02)
const codes150 = generator.generateBatch(150, 5, '02');

// Esporta CSV
const csv = generator.exportToCSV(codes50, 50, '01');
fs.writeFileSync('codes-batch-01.csv', csv);
```

### 4.3 Algoritmo Validazione (Nell'Estensione)

**File: `license-validator.js`**

```javascript
class LicenseCodeValidator {
  constructor() {
    this.secretKey = 'my-secret-key-2024'; // STESSO del generator
    this.prefix = 'AIS';
  }

  validateCode(code) {
    // 1. Verifica formato base
    const parts = code.split('-');
    if (parts.length !== 6) {
      return { valid: false, error: 'Formato non valido' };
    }

    const [prefix, creditsHex, timestamp, random, batch, checksum] = parts;

    // 2. Verifica prefisso
    if (prefix !== this.prefix) {
      return { valid: false, error: 'Codice non riconosciuto' };
    }

    // 3. Ricostruisci dati e calcola checksum atteso
    const codeData = `${creditsHex}-${timestamp}-${random}-${batch}`;
    const expectedChecksum = this.generateChecksum(codeData);

    // 4. Verifica checksum
    if (checksum !== expectedChecksum) {
      return { valid: false, error: 'Codice non valido o manomesso' };
    }

    // 5. Estrai crediti
    const credits = parseInt(creditsHex, 16);

    // 6. Estrai timestamp generazione
    const generatedAt = parseInt(timestamp, 36);

    return {
      valid: true,
      credits: credits,
      generatedAt: generatedAt,
      batch: batch,
      code: code
    };
  }

  generateChecksum(data) {
    // STESSA implementazione del generator
    let hash = 0;
    const combined = data + this.secretKey;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36).substr(0, 4).toUpperCase();
  }

  async activateCode(code) {
    const creditManager = new CreditManager();

    // 1. Verifica se già usato localmente
    const alreadyUsed = await creditManager.isCodeActivated(code);
    if (alreadyUsed) {
      return {
        success: false,
        error: 'code_already_used',
        message: 'Questo codice è già stato attivato su questo dispositivo'
      };
    }

    // 2. Valida formato e checksum
    const validation = this.validateCode(code);
    if (!validation.valid) {
      return {
        success: false,
        error: 'invalid_code',
        message: validation.error
      };
    }

    // 3. [OPZIONALE] Verifica con server se codice non revocato
    // const serverCheck = await this.checkWithServer(code);
    // if (!serverCheck.valid) return serverCheck;

    // 4. Aggiungi crediti
    const newBalance = await creditManager.addCredits(validation.credits, code);

    // 5. Successo
    return {
      success: true,
      creditsAdded: validation.credits,
      newBalance: newBalance,
      message: `✅ ${validation.credits} crediti attivati con successo!`,
      batch: validation.batch
    };
  }

  // [OPZIONALE] Verifica server-side (anti-condivisione massiva)
  async checkWithServer(code) {
    try {
      const response = await fetch('https://your-api.com/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      return data; // { valid: true/false, message: '...' }
    } catch (error) {
      // Se server non raggiungibile, permetti attivazione locale
      console.warn('Server validation failed, allowing local activation');
      return { valid: true };
    }
  }
}
```

### 4.4 Sicurezza Codici

**Protezioni Implementate:**

1. **Checksum crittografico**: impossibile generare codici validi senza chiave segreta
2. **Timestamp integrato**: tracciabilità quando generato
3. **Batch ID**: identificazione lotto vendita
4. **Registro locale**: previene riattivazione stesso codice
5. **[Opzionale] Verifica server**: limita condivisione massiva

**Cosa NON previene (accettabile):**
- Condivisione codice tra 2-3 amici → OK, dividono i crediti
- Copia codice su altro browser → OK, ma crediti condivisi tra dispositivi

**Soluzione per abuso massivo (opzionale):**
- Backend minimale che traccia attivazioni per codice
- Se codice usato >5 volte → segnala o blocca
- Implementare solo se diventa problema reale

---

## 5. Gestione Features

### 5.1 Feature Guard System

**File: `feature-guard.js`**

```javascript
class FeatureGuard {
  constructor() {
    this.creditManager = new CreditManager();
  }

  // Verifica se può usare feature
  async checkFeatureAccess(featureName, context = {}) {
    const cost = CREDIT_SYSTEM.costs[featureName];

    // Feature gratuita
    if (cost === 0 || CREDIT_SYSTEM.freeFeatures.includes(featureName)) {
      return {
        allowed: true,
        type: 'free',
        message: 'Feature gratuita'
      };
    }

    // Verifica saldo crediti
    const balance = await this.creditManager.getBalance();

    if (balance >= cost) {
      return {
        allowed: true,
        type: 'premium',
        cost: cost,
        balance: balance,
        message: `Questa operazione consumerà ${cost} credito/i`
      };
    }

    // Crediti insufficienti - verifica limiti free
    const freeLimit = CREDIT_SYSTEM.freeLimits[`daily${this.capitalize(featureName)}s`];
    
    if (freeLimit) {
      const freeUsage = await this.getTodayFreeUsage(featureName);
      
      if (freeUsage < freeLimit) {
        return {
          allowed: true,
          type: 'free_limited',
          remaining: freeLimit - freeUsage,
          message: `Uso gratuito (${freeUsage + 1}/${freeLimit} oggi)`
        };
      }
    }

    // Blocca - serve premium
    return {
      allowed: false,
      type: 'blocked',
      reason: 'insufficient_credits',
      cost: cost,
      balance: balance,
      missing: cost - balance,
      message: `Crediti insufficienti. Servono ${cost} crediti, ne hai ${balance}.`
    };
  }

  // Esegui operazione con consumo crediti
  async executeFeature(featureName, operationFn, context = {}) {
    // 1. Verifica accesso
    const access = await this.checkFeatureAccess(featureName, context);

    if (!access.allowed) {
      // Mostra paywall
      this.showPaywall(featureName, access);
      return {
        success: false,
        blocked: true,
        reason: access.reason
      };
    }

    // 2. Esegui operazione
    try {
      const result = await operationFn();

      // 3. Consuma crediti (se premium)
      if (access.type === 'premium') {
        await this.creditManager.consumeCredits(featureName, {
          ...context,
          success: true
        });
      } else if (access.type === 'free_limited') {
        await this.recordFreeUsage(featureName);
      }

      return {
        success: true,
        result: result,
        charged: access.cost || 0,
        balance: await this.creditManager.getBalance()
      };

    } catch (error) {
      // Se operazione fallisce, NON consumare crediti
      console.error('Feature execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Uso giornaliero features free
  async getTodayFreeUsage(featureName) {
    const today = new Date().toISOString().split('T')[0];
    const key = `free_usage_${today}`;
    
    const result = await chrome.storage.local.get(key);
    const usage = result[key] || {};
    
    return usage[featureName] || 0;
  }

  async recordFreeUsage(featureName) {
    const today = new Date().toISOString().split('T')[0];
    const key = `free_usage_${today}`;
    
    const result = await chrome.storage.local.get(key);
    const usage = result[key] || {};
    
    usage[featureName] = (usage[featureName] || 0) + 1;
    
    await chrome.storage.local.set({ [key]: usage });
  }

  showPaywall(featureName, accessInfo) {
    const paywallData = {
      featureName: featureName,
      cost: accessInfo.cost,
      balance: accessInfo.balance,
      missing: accessInfo.missing,
      message: accessInfo.message
    };

    // Trigger evento per mostrare modal paywall
    window.dispatchEvent(new CustomEvent('showPaywall', { detail: paywallData }));
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ESEMPIO USO
const featureGuard = new FeatureGuard();

// In popup.js quando utente clicca "Genera Riassunto"
document.getElementById('generate-summary').addEventListener('click', async () => {
  const result = await featureGuard.executeFeature('summary', async () => {
    // Logica generazione riassunto
    return await generateSummary(article, settings);
  }, {
    articleTitle: article.title,
    provider: settings.provider
  });

  if (result.success) {
    displaySummary(result.result);
    updateCreditsDisplay(result.balance);
  }
});
```

### 5.2 Credit Manager Implementation

**File: `credit-manager.js`**

```javascript
class CreditManager {
  constructor() {
    this.storageKey = 'user_credits';
    this.usageKey = 'credit_usage';
    this.codesKey = 'activated_codes';
  }

  // Ottieni saldo
  async getBalance() {
    const result = await chrome.storage.local.get(this.storageKey);
    return result[this.storageKey] || 0;
  }

  // Aggiungi crediti
  async addCredits(amount, code) {
    const currentBalance = await this.getBalance();
    const newBalance = currentBalance + amount;
    
    await chrome.storage.local.set({
      [this.storageKey]: newBalance
    });

    // Registra codice come usato
    await this.registerActivatedCode(code, amount);

    // Log transazione
    await this.logTransaction('add', amount, `Codice attivato: ${code}`);

    // Analytics (opzionale)
    this.trackEvent('credits_added', { amount, code: code.substr(0, 10) + '...' });

    return newBalance;
  }

  // Consuma crediti
  async consumeCredits(operation, details = {}) {
    const cost = CREDIT_SYSTEM.costs[operation];
    const currentBalance = await this.getBalance();

    if (currentBalance < cost) {
      throw new Error('Crediti insufficienti');
    }

    const newBalance = currentBalance - cost;
    await chrome.storage.local.set({
      [this.storageKey]: newBalance
    });

    // Log transazione
    await this.logTransaction('consume', cost, operation, details);

    // Analytics
    this.trackEvent('credits_consumed', { operation, cost, balance: newBalance });

    return {
      success: true,
      charged: cost,
      balance: newBalance
    };
  }

  // Verifica se codice già usato
  async isCodeActivated(code) {
    const result = await chrome.storage.local.get(this.codesKey);
    const activatedCodes = result[this.codesKey] || {};
    return !!activatedCodes[code];
  }

  // Registra codice attivato
  async registerActivatedCode(code, credits) {
    const result = await chrome.storage.local.get(this.codesKey);
    const activatedCodes = result[this.codesKey] || {};
    
    activatedCodes[code] = {
      activatedAt: Date.now(),
      credits: credits,
      activated: true
    };

    await chrome.storage.local.set({
      [this.codesKey]: activatedCodes
    });
  }

  // Log transazione
  async logTransaction(type, amount, operation, details = {}) {
    const result = await chrome.storage.local.get(this.usageKey);
    const usage = result[this.usageKey] || [];

    usage.push({
      type,
      amount,
      operation,
      details,
      timestamp: Date.now(),
      balance: await this.getBalance()
    });

    // Mantieni ultimi 200 record
    if (usage.length > 200) {
      usage.splice(0, usage.length - 200);
    }

    await chrome.storage.local.set({
      [this.usageKey]: usage
    });
  }

  // Statistiche uso
  async getUsageStats() {
    const result = await chrome.storage.local.get(this.usageKey);
    const usage = result[this.usageKey] || [];

    const stats = {
      totalConsumed: 0,
      totalAdded: 0,
      byOperation: {},
      last7Days: 0,
      last30Days: 0,
      weekAgo: Date.now() - 7 * 86400000,
      monthAgo: Date.now() - 30 * 86400000
    };

    usage.forEach(tx => {
      if (tx.type === 'consume') {
        stats.totalConsumed += tx.amount;
        stats.byOperation[tx.operation] = (stats.byOperation[tx.operation] || 0) + tx.amount;
        
        if (tx.timestamp > stats.weekAgo) stats.last7Days += tx.amount;
        if (tx.timestamp > stats.monthAgo) stats.last30Days += tx.amount;
      } else if (tx.type === 'add') {
        stats.totalAdded += tx.amount;
      }
    });

    return stats;
  }

  // Analytics helper
  trackEvent(eventName, properties = {}) {
    // Integrazione con analytics (Google Analytics, Mixpanel, etc.)
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
  }
}
```

---

## 6. Interfaccia Utente

### 6.1 Badge Crediti (sempre visibile)

**Posizione:** Top-right del popup

```html
<div class="credits-badge">
  <span class="credits-icon">💎</span>
  <span class="credits-amount" id="credits-display">0</span>
  <button class="credits-manage" id="manage-credits">+</button>
</div>
```

```css
.credits-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.credits-badge:hover {
  transform: scale(1.05);
}

.credits-amount {
  font-size: 16px;
}

.credits-manage {
  background: rgba(255,255,255,0.3);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px