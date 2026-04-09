// Multi-Analysis Page Script
import { HtmlSanitizer } from "../../utils/security/html-sanitizer.js";
import { StorageManager } from "../../utils/storage/storage-manager.js";
import { I18n } from "../../utils/i18n/i18n.js";
import { ThemeManager } from "../../utils/core/theme-manager.js";
import { HistoryManager } from "../../utils/storage/history-manager.js";
import { PromptRegistry } from "../../utils/ai/prompt-registry.js";
import { APIClient } from "../../utils/ai/api-client.js";
import { MultiAnalysisManager } from "../../utils/core/multi-analysis-manager.js";
import { PDFExporter } from "../../utils/export/pdf-exporter.js";
import { MarkdownExporter } from "../../utils/export/markdown-exporter.js";
import { EmailManager } from "../../utils/export/email-manager.js";
import { Modal } from "../../utils/core/modal.js";

let allArticles = [];
let selectedArticles = [];
let currentAnalysis = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Multi-Analysis: DOMContentLoaded");

  // Inizializza i18n
  await I18n.init();

  // Carica lingua UI salvata
  const savedUILanguage = await StorageManager.getUILanguage();
  const uiLanguageSelect = document.getElementById("uiLanguageSelect");
  if (savedUILanguage && uiLanguageSelect) {
    uiLanguageSelect.value = savedUILanguage;
  }

  // Event listener per cambio lingua UI
  if (uiLanguageSelect) {
    uiLanguageSelect.addEventListener("change", async (e) => {
      await I18n.setLanguage(e.target.value);
    });
  }

  // Controlla se stiamo riaprendo un'analisi salvata
  const result = await chrome.storage.local.get(["reopenMultiAnalysis"]);
  if (result.reopenMultiAnalysis) {
    await reopenSavedAnalysis(result.reopenMultiAnalysis);
    chrome.storage.local.remove(["reopenMultiAnalysis"]);
    return;
  }

  await loadArticles();

  const startBtn = document.getElementById("startAnalysisBtn");
  console.log("Start button trovato:", startBtn);

  document.getElementById("backBtn").addEventListener("click", () => {
    window.close();
  });

  document.getElementById("selectAllBtn").addEventListener("click", selectAll);
  document
    .getElementById("clearSelectionBtn")
    .addEventListener("click", clearSelection);
  document
    .getElementById("searchArticles")
    .addEventListener("input", filterArticles);
  document
    .getElementById("filterProvider")
    .addEventListener("change", filterArticles);

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      console.log("Click su startAnalysisBtn");
      startAnalysis();
    });
  } else {
    console.error("startAnalysisBtn non trovato!");
  }

  document
    .getElementById("closeModal")
    .addEventListener("click", closeAnalysisModal);

  document.querySelectorAll(".modal-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("exportPdfBtn").addEventListener("click", exportPdf);
  document
    .getElementById("exportMdBtn")
    .addEventListener("click", exportMarkdown);
  document.getElementById("sendEmailBtn").addEventListener("click", sendEmail);
  document.getElementById("copyBtn").addEventListener("click", copyContent);
});

async function loadArticles() {
  allArticles = await HistoryManager.getHistory();
  displayArticles(allArticles);
}

function displayArticles(articles) {
  const listEl = document.getElementById("articlesList");

  if (articles.length === 0) {
    listEl.innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Nessun articolo disponibile</p>';
    return;
  }

  listEl.innerHTML = articles
    .map(
      (article) => `
    <div class="article-item" data-id="${article.id}">
      <input type="checkbox" class="article-checkbox" data-id="${article.id}" />
      <div class="article-info">
        <div class="article-title">${HtmlSanitizer.escape(article.article.title)}</div>
        <div class="article-meta">
          <span class="meta-badge provider">${HtmlSanitizer.escape(article.metadata.provider)}</span>
          <span class="meta-badge date">${HistoryManager.formatDate(article.timestamp)}</span>
          <span class="meta-badge words">${article.article.wordCount} ${I18n.t("article.words")}</span>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  document.querySelectorAll(".article-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", handleSelection);
  });

  document.querySelectorAll(".article-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("article-checkbox")) return;
      const checkbox = item.querySelector(".article-checkbox");
      checkbox.checked = !checkbox.checked;
      handleSelection({ target: checkbox });
    });
  });
}

function handleSelection(e) {
  const id = parseInt(e.target.dataset.id);
  const item = document.querySelector(`.article-item[data-id="${id}"]`);

  if (e.target.checked) {
    selectedArticles.push(id);
    item.classList.add("selected");
  } else {
    selectedArticles = selectedArticles.filter((artId) => artId !== id);
    item.classList.remove("selected");
  }

  updateSelectionCount();
}

function updateSelectionCount() {
  const countNumber = document.getElementById("selectionCountNumber");
  if (countNumber) {
    countNumber.textContent = selectedArticles.length;
  } else {
    // Fallback se l'elemento non esiste
    document.getElementById("selectionCount").textContent =
      `${selectedArticles.length} ${I18n.t("multi.selected")}`;
  }
  document.getElementById("startAnalysisBtn").disabled =
    selectedArticles.length < 2;
}

function selectAll() {
  const visibleCheckboxes = document.querySelectorAll(
    '.article-item:not([style*="display: none"]) .article-checkbox',
  );
  visibleCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
    const id = parseInt(checkbox.dataset.id);
    if (!selectedArticles.includes(id)) {
      selectedArticles.push(id);
      document
        .querySelector(`.article-item[data-id="${id}"]`)
        .classList.add("selected");
    }
  });
  updateSelectionCount();
}

function clearSelection() {
  document.querySelectorAll(".article-checkbox").forEach((checkbox) => {
    checkbox.checked = false;
  });
  document.querySelectorAll(".article-item").forEach((item) => {
    item.classList.remove("selected");
  });
  selectedArticles = [];
  updateSelectionCount();
}

function filterArticles() {
  const searchQuery = document
    .getElementById("searchArticles")
    .value.toLowerCase();
  const providerFilter = document.getElementById("filterProvider").value;

  const filtered = allArticles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.article.title.toLowerCase().includes(searchQuery) ||
      article.article.url.toLowerCase().includes(searchQuery);

    const matchesProvider =
      !providerFilter || article.metadata.provider === providerFilter;

    return matchesSearch && matchesProvider;
  });

  displayArticles(filtered);

  selectedArticles.forEach((id) => {
    const checkbox = document.querySelector(
      `.article-checkbox[data-id="${id}"]`,
    );
    if (checkbox) {
      checkbox.checked = true;
      document
        .querySelector(`.article-item[data-id="${id}"]`)
        .classList.add("selected");
    }
  });
}

async function startAnalysis() {
  console.log(
    "startAnalysis chiamato, articoli selezionati:",
    selectedArticles.length,
  );

  if (selectedArticles.length < 2) {
    console.log("Troppo pochi articoli selezionati");
    await Modal.alert(
      I18n.t("multi.minArticles"),
      I18n.t("multi.minArticlesTitle"),
      "⚠️",
    );
    return;
  }

  const options = {
    globalSummary: document.getElementById("optGlobalSummary").checked,
    comparison: document.getElementById("optComparison").checked,
    qa: document.getElementById("optQA").checked,
  };

  if (!options.globalSummary && !options.comparison && !options.qa) {
    await Modal.alert(
      I18n.t("multi.minOptions"),
      I18n.t("multi.minOptionsTitle"),
      "⚠️",
    );
    return;
  }

  const articles = selectedArticles.map((id) =>
    allArticles.find((a) => a.id === id),
  );

  showProgress(I18n.t("multi.checkingCorrelation"), 10);

  const correlationResult =
    await MultiAnalysisManager.checkArticlesRelation(articles);

  if (!correlationResult.related) {
    hideProgress();
    const choice = await showUnrelatedModal(correlationResult.reason);

    if (choice === "cancel") return;
    if (choice === "qaOnly") {
      options.globalSummary = false;
      options.comparison = false;
      options.qa = true;
    }
  }

  try {
    showProgress(I18n.t("multi.startingAnalysis"), 20);
    currentAnalysis = await MultiAnalysisManager.analyzeArticles(
      articles,
      options,
      updateProgress,
    );
    hideProgress();

    // Salva nella cronologia
    try {
      console.log("Tentativo di salvare analisi...", currentAnalysis, articles);
      const analysisId = await HistoryManager.saveMultiAnalysis(
        currentAnalysis,
        articles,
      );
      currentAnalysis.id = analysisId;
      console.log("✓ Analisi salvata nella cronologia con ID:", analysisId);
    } catch (saveError) {
      console.error("✗ Errore nel salvataggio cronologia:", saveError);
    }

    showAnalysisModal();
  } catch (error) {
    console.error("Errore completo:", error);
    console.error("Stack trace:", error.stack);
    hideProgress();
    await Modal.alert(
      I18n.t("multi.analysisError") +
        " " +
        error.message +
        "\n\n" +
        I18n.t("multi.errorDetails") +
        " " +
        (error.stack || "N/A"),
      I18n.t("multi.errorTitle"),
      "❌",
    );
  }
}

function showProgress(message, percent) {
  const modal = document.getElementById("progressModal");
  document.getElementById("progressMessage").textContent = message;
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressPercent").textContent =
    Math.round(percent) + "%";
  modal.classList.remove("hidden");
}

function updateProgress(message, percent) {
  document.getElementById("progressMessage").textContent = message;
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressPercent").textContent =
    Math.round(percent) + "%";
}

function hideProgress() {
  document.getElementById("progressModal").classList.add("hidden");
}

function showUnrelatedModal(reason = null) {
  return new Promise((resolve) => {
    const modal = document.getElementById("unrelatedModal");
    const reasonEl = document.getElementById("unrelatedReason");

    if (reason) {
      reasonEl.textContent = "💡 " + reason;
      reasonEl.style.display = "block";
    } else {
      reasonEl.style.display = "none";
    }

    modal.classList.remove("hidden");

    const handleQAOnly = () => {
      modal.classList.add("hidden");
      cleanup();
      resolve("qaOnly");
    };

    const handleFullAnalysis = () => {
      modal.classList.add("hidden");
      cleanup();
      resolve("full");
    };

    const handleCancel = () => {
      modal.classList.add("hidden");
      cleanup();
      resolve("cancel");
    };

    const cleanup = () => {
      document
        .getElementById("unrelatedQAOnly")
        .removeEventListener("click", handleQAOnly);
      document
        .getElementById("unrelatedFullAnalysis")
        .removeEventListener("click", handleFullAnalysis);
      document
        .getElementById("unrelatedCancel")
        .removeEventListener("click", handleCancel);
    };

    document
      .getElementById("unrelatedQAOnly")
      .addEventListener("click", handleQAOnly);
    document
      .getElementById("unrelatedFullAnalysis")
      .addEventListener("click", handleFullAnalysis);
    document
      .getElementById("unrelatedCancel")
      .addEventListener("click", handleCancel);
  });
}

function showAnalysisModal() {
  if (!currentAnalysis) return;

  console.log("showAnalysisModal - currentAnalysis:", currentAnalysis);
  console.log("currentAnalysis.qa:", currentAnalysis.qa);

  if (currentAnalysis.globalSummary) {
    document.getElementById("tabSummary").innerHTML = `
      <div class="analysis-content">
        ${formatMarkdown(currentAnalysis.globalSummary)}
      </div>
    `;
  } else {
    document.getElementById("tabSummary").innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Riassunto non generato</p>';
  }

  if (currentAnalysis.comparison) {
    document.getElementById("tabComparison").innerHTML = `
      <div class="analysis-content">
        ${formatMarkdown(currentAnalysis.comparison)}
      </div>
    `;
  } else {
    document.getElementById("tabComparison").innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Confronto non generato</p>';
  }

  console.log("Verifica Q&A - qa:", currentAnalysis.qa);
  console.log("Verifica Q&A - interactive:", currentAnalysis.qa?.interactive);

  if (currentAnalysis.qa && currentAnalysis.qa.interactive) {
    console.log("Rendering Q&A interattivo");
    // Q&A Interattivo
    document.getElementById("tabQA").innerHTML = `
      <div class="qa-interactive">
        <div class="qa-chat-container" id="qaChatContainer">
          <div class="qa-welcome">
            <p>💬 <strong>Q&A Interattivo</strong></p>
            <p>Fai domande sui ${currentAnalysis.qa.articles?.length || selectedArticles.length} articoli selezionati. Il sistema risponderà basandosi esclusivamente sui loro contenuti.</p>
          </div>
        </div>
        <div class="qa-input-container">
          <input type="text" id="qaInput" placeholder="Scrivi la tua domanda..." />
          <button id="qaSubmitBtn" class="btn-primary">Invia</button>
        </div>
      </div>
    `;

    // Carica domande precedenti se esistono
    if (
      currentAnalysis.qa.questions &&
      currentAnalysis.qa.questions.length > 0
    ) {
      const chatContainer = document.getElementById("qaChatContainer");
      chatContainer.innerHTML = ""; // Rimuovi il messaggio di benvenuto

      currentAnalysis.qa.questions.forEach((qa) => {
        // Aggiungi domanda
        const questionEl = document.createElement("div");
        questionEl.className = "qa-message qa-question-msg";
        questionEl.innerHTML = `<strong>Tu:</strong> ${HtmlSanitizer.escape(qa.question)}`;
        chatContainer.appendChild(questionEl);

        // Aggiungi risposta
        const answerEl = document.createElement("div");
        answerEl.className = "qa-message qa-answer-msg";
        answerEl.innerHTML = `<strong>Assistente:</strong> ${HtmlSanitizer.escape(qa.answer)}`;
        chatContainer.appendChild(answerEl);
      });

      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Event listeners per Q&A
    document
      .getElementById("qaSubmitBtn")
      .addEventListener("click", submitQuestion);
    document.getElementById("qaInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") submitQuestion();
    });
  } else {
    document.getElementById("tabQA").innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Q&A non abilitato</p>';
  }

  document.getElementById("analysisModal").classList.remove("hidden");
}

function closeAnalysisModal() {
  document.getElementById("analysisModal").classList.add("hidden");
}

function switchTab(tabName) {
  document.querySelectorAll(".modal-tab").forEach((tab) => {
    tab.classList.remove("active");
    if (tab.dataset.tab === tabName) {
      tab.classList.add("active");
    }
  });

  document.querySelectorAll(".modal-pane").forEach((pane) => {
    pane.classList.remove("active");
  });

  // Mappa i nomi dei tab agli ID corretti
  const tabIds = {
    summary: "tabSummary",
    comparison: "tabComparison",
    qa: "tabQA",
  };

  const tabId = tabIds[tabName];
  if (tabId) {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      tabElement.classList.add("active");
    } else {
      console.error("Tab element non trovato:", tabId);
    }
  }
}

function formatMarkdown(text) {
  text = HtmlSanitizer.escape(text);
  return text
    .replace(/### (.*)/g, "<h4>$1</h4>")
    .replace(/## (.*)/g, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.*)$/, "<p>$1</p>");
}

async function exportPdf() {
  if (!currentAnalysis) return;

  try {
    // Mostra modal di selezione
    const options = await showExportOptionsModal("PDF");
    if (!options) return; // Utente ha annullato

    await PDFExporter.exportMultiAnalysisToPDF(
      currentAnalysis,
      selectedArticles.map((id) => allArticles.find((a) => a.id === id)),
      options,
    );
  } catch (error) {
    console.error("Errore PDF:", error);
    await Modal.alert(
      "Errore durante l'esportazione PDF: " + error.message,
      "Errore",
      "❌",
    );
  }
}

async function exportMarkdown() {
  if (!currentAnalysis) return;

  try {
    // Mostra modal di selezione
    const options = await showExportOptionsModal("Markdown");
    if (!options) return; // Utente ha annullato

    MarkdownExporter.exportMultiAnalysisToMarkdown(
      currentAnalysis,
      selectedArticles.map((id) => allArticles.find((a) => a.id === id)),
      options,
    );
  } catch (error) {
    console.error("Errore Markdown:", error);
    await Modal.alert(
      "Errore durante l'esportazione Markdown: " + error.message,
      "Errore",
      "❌",
    );
  }
}

function showExportOptionsModal(type) {
  return new Promise((resolve) => {
    const modal = document.getElementById("exportOptionsModal");
    const title = document.getElementById("exportModalTitle");
    const summaryOption = document.getElementById("exportSummaryOption");
    const comparisonOption = document.getElementById("exportComparisonOption");
    const qaOption = document.getElementById("exportQAOption");
    const cancelBtn = document.getElementById("exportCancelBtn");
    const confirmBtn = document.getElementById("exportConfirmBtn");

    // Imposta titolo
    title.textContent = `Esporta ${type}`;

    // Mostra/nascondi opzioni in base a cosa è disponibile
    summaryOption.style.display = currentAnalysis.summary ? "flex" : "none";
    comparisonOption.style.display = currentAnalysis.comparison
      ? "flex"
      : "none";
    qaOption.style.display = currentAnalysis.qa ? "flex" : "none";

    // Mostra modal
    modal.classList.remove("hidden");

    // Handler per conferma
    const handleConfirm = () => {
      const options = {
        includeSummary: document.getElementById("exportIncludeSummary").checked,
        includeComparison: document.getElementById("exportIncludeComparison")
          .checked,
        includeQA: document.getElementById("exportIncludeQA").checked,
      };
      cleanup();
      resolve(options);
    };

    // Handler per annulla
    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    // Cleanup
    const cleanup = () => {
      modal.classList.add("hidden");
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
    };

    // Aggiungi event listeners
    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
  });
}

async function sendEmail() {
  if (!currentAnalysis) return;

  try {
    // Mostra modal di selezione
    const options = await showExportOptionsModal("Email");
    if (!options) return; // Utente ha annullato

    // Prepara il contenuto per l'email
    let content = "# Analisi Multi Articolo\n\n";
    content += `**Data:** ${new Date(currentAnalysis.timestamp).toLocaleDateString("it-IT")}\n\n`;
    content += `**Articoli analizzati:** ${selectedArticles.length}\n\n`;
    content += "---\n\n";

    // Lista articoli
    content += "## 📚 Articoli\n\n";
    selectedArticles.forEach((id, index) => {
      const article = allArticles.find((a) => a.id === id);
      if (article) {
        content += `${index + 1}. ${article.article.title}\n`;
      }
    });
    content += "\n---\n\n";

    if (options.includeSummary && currentAnalysis.summary) {
      content += "## 📝 Riassunto Globale\n\n";
      content += currentAnalysis.summary + "\n\n---\n\n";
    }

    if (options.includeComparison && currentAnalysis.comparison) {
      content += "## ⚖️ Confronto Idee\n\n";
      content += currentAnalysis.comparison + "\n\n---\n\n";
    }

    if (
      options.includeQA &&
      currentAnalysis.qa &&
      currentAnalysis.qa.questions &&
      currentAnalysis.qa.questions.length > 0
    ) {
      content += "## 💬 Domande e Risposte\n\n";
      currentAnalysis.qa.questions.forEach((qa, index) => {
        content += `**Q${index + 1}:** ${qa.question}\n\n`;
        content += `**R${index + 1}:** ${qa.answer}\n\n`;
      });
      content += "---\n\n";
    }

    await EmailManager.showEmailModal(content, "Analisi Multi Articolo");
  } catch (error) {
    console.error("Errore email:", error);
    await Modal.alert(
      "Errore durante l'invio email: " + error.message,
      "Errore",
      "❌",
    );
  }
}

async function submitQuestion() {
  const input = document.getElementById("qaInput");
  const question = input.value.trim();

  if (!question) return;

  // Aggiungi domanda alla chat
  const chatContainer = document.getElementById("qaChatContainer");
  const questionEl = document.createElement("div");
  questionEl.className = "qa-message qa-question-msg";
  questionEl.innerHTML = `<strong>Tu:</strong> ${HtmlSanitizer.escape(question)}`;
  chatContainer.appendChild(questionEl);

  // Mostra loading
  const loadingEl = document.createElement("div");
  loadingEl.className = "qa-message qa-loading";
  loadingEl.innerHTML = "⏳ Sto pensando...";
  chatContainer.appendChild(loadingEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Pulisci input
  input.value = "";
  input.disabled = true;
  document.getElementById("qaSubmitBtn").disabled = true;

  try {
    const answer = await askQuestionToArticles(question);

    // Rimuovi loading
    loadingEl.remove();

    // Aggiungi risposta
    const answerEl = document.createElement("div");
    answerEl.className = "qa-message qa-answer-msg";
    answerEl.innerHTML = `<strong>Assistente:</strong> ${HtmlSanitizer.escape(answer)}`;
    chatContainer.appendChild(answerEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Salva Q&A nell'analisi per l'esportazione
    if (!currentAnalysis.qa.questions) {
      currentAnalysis.qa.questions = [];
    }
    currentAnalysis.qa.questions.push({
      question: question,
      answer: answer,
    });

    // Aggiorna anche nella cronologia
    if (currentAnalysis.id) {
      try {
        await HistoryManager.updateMultiAnalysisWithQA(
          currentAnalysis.id,
          question,
          answer,
        );
      } catch (error) {
        console.error("Errore aggiornamento cronologia:", error);
      }
    }
  } catch (error) {
    loadingEl.remove();
    const errorEl = document.createElement("div");
    errorEl.className = "qa-message qa-error-msg";
    errorEl.innerHTML = `<strong>Errore:</strong> ${HtmlSanitizer.escape(error.message)}`;
    chatContainer.appendChild(errorEl);
  } finally {
    input.disabled = false;
    document.getElementById("qaSubmitBtn").disabled = false;
    input.focus();
  }
}

async function askQuestionToArticles(question) {
  const settings = await StorageManager.getSettings();
  const provider = settings.selectedProvider || "groq";
  const apiKey = await StorageManager.getApiKey(provider);

  if (!apiKey) {
    throw new Error("API key non configurata");
  }

  // Prepara il contesto degli articoli
  const articlesContext = currentAnalysis.qa.articles
    .map(
      (a, index) => `
ARTICOLO ${index + 1}: ${a.title}

${a.content}
`,
    )
    .join("\n\n" + "=".repeat(80) + "\n\n");

  // Usa i prompt di Q&A esistenti (come per singolo articolo)
  const systemPrompt = `Sei un esperto analista di contenuti specializzato nel rispondere a domande basandoti esclusivamente sul contenuto degli articoli forniti.

PRINCIPI FONDAMENTALI:
1. Rispondi SOLO sulla base degli articoli forniti - non usare conoscenze esterne
2. Cita sempre gli articoli di riferimento (es. "L'articolo 1 afferma che...")
3. Se l'informazione NON è negli articoli, dillo chiaramente
4. Sii preciso: usa dati, nomi, cifre esatte dagli articoli
5. Distingui tra fatti espliciti e inferenze ragionevoli
6. Se la domanda è ambigua, chiedi chiarimento

FORMATO RISPOSTA:
- Rispondi direttamente alla domanda
- Usa citazioni o parafrasi precise dagli articoli
- Indica sempre gli articoli: "Secondo l'articolo 1..." o "Come menzionato nell'articolo 2..."
- Se l'info non c'è: "Gli articoli non menzionano [argomento]"
- Per inferenze: "Dagli articoli si può dedurre che... anche se non è esplicitamente affermato"

STILE:
- Conversazionale ma preciso
- Conciso: risposte di 2-5 frasi per domande semplici
- Più dettagliato per domande complesse
- Mai inventare informazioni`;

  const userPrompt = `# ARTICOLI DI RIFERIMENTO

${articlesContext}

---

# DOMANDA DELL'UTENTE

${question}

---

Rispondi basandoti esclusivamente sugli articoli sopra. Cita gli articoli di riferimento.`;

  return await APIClient.generateCompletion(
    provider,
    apiKey,
    systemPrompt,
    userPrompt,
    {
      temperature: 0.1,
      maxTokens: 1000,
    },
  );
}

async function copyContent() {
  if (!currentAnalysis) return;

  let text = "";

  if (currentAnalysis.globalSummary) {
    text += "RIASSUNTO GLOBALE:\n\n" + currentAnalysis.globalSummary + "\n\n";
  }

  if (currentAnalysis.comparison) {
    text +=
      "=".repeat(50) +
      "\n\nCONFRONTO IDEE:\n\n" +
      currentAnalysis.comparison +
      "\n\n";
  }

  // Per Q&A interattivo, copia la conversazione
  if (currentAnalysis.qa && currentAnalysis.qa.interactive) {
    const chatContainer = document.getElementById("qaChatContainer");
    if (chatContainer) {
      const messages = chatContainer.querySelectorAll(
        ".qa-message:not(.qa-loading):not(.qa-welcome)",
      );
      if (messages.length > 0) {
        text += "=".repeat(50) + "\n\nCONVERSAZIONE Q&A:\n\n";
        messages.forEach((msg) => {
          text += msg.textContent + "\n\n";
        });
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("copyBtn");
    const originalText = btn.textContent;
    btn.textContent = "✓ Copiato!";
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  } catch (error) {
    await Modal.alert(
      I18n.t("multi.copyError"),
      I18n.t("multi.errorTitle"),
      "❌",
    );
  }
}

// ===== REOPEN SAVED ANALYSIS =====

async function reopenSavedAnalysis(data) {
  console.log("Riapertura analisi salvata:", data);

  // Imposta l'analisi corrente
  currentAnalysis = {
    id: data.id,
    timestamp: Date.now(),
    globalSummary: data.analysis.globalSummary,
    comparison: data.analysis.comparison,
    qa: data.analysis.qa,
    metadata: {
      provider: data.analysis.metadata?.provider || "unknown",
    },
  };

  // Imposta gli articoli
  selectedArticles = data.articles.map((a) => a.id);
  allArticles = data.articles.map((a) => ({
    id: a.id,
    article: {
      title: a.title,
      url: a.url,
      wordCount: a.wordCount,
    },
  }));

  // Nascondi la selezione e mostra direttamente il modal
  document.querySelector(".selection-panel").style.display = "none";
  document.querySelector(".analysis-panel").style.display = "none";

  // Aggiungi pulsante per tornare indietro
  const header = document.querySelector("header");
  header.innerHTML = `
    <h1>🔬 Analisi Multi Articolo</h1>
    <button id="backBtn" class="btn-back">← Cronologia</button>
  `;

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = chrome.runtime.getURL(
      "src/pages/history/history.html",
    );
  });

  // Aggiungi event listeners per i pulsanti del modal
  document.getElementById("closeModal").addEventListener("click", () => {
    window.location.href = chrome.runtime.getURL(
      "src/pages/history/history.html",
    );
  });

  document.querySelectorAll(".modal-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("exportPdfBtn").addEventListener("click", exportPdf);
  document
    .getElementById("exportMdBtn")
    .addEventListener("click", exportMarkdown);
  document.getElementById("sendEmailBtn").addEventListener("click", sendEmail);
  document.getElementById("copyBtn").addEventListener("click", copyContent);

  // Mostra il modal con l'analisi
  showAnalysisModal();
}

// Theme Toggle
async function toggleTheme() {
  const settings = await StorageManager.getSettings();
  const newDarkMode = !settings.darkMode;

  settings.darkMode = newDarkMode;
  await StorageManager.saveSettings(settings);

  if (newDarkMode) {
    document.body.classList.add("dark-mode");
    document.getElementById("themeToggleBtn").textContent = "☀️";
    document.getElementById("themeToggleBtn").title = "Tema Chiaro";
  } else {
    document.body.classList.remove("dark-mode");
    document.getElementById("themeToggleBtn").textContent = "🌙";
    document.getElementById("themeToggleBtn").title = "Tema Scuro";
  }
}

// Inizializza tema
(async function initTheme() {
  const settings = await StorageManager.getSettings();
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
    if (settings.darkMode) {
      themeBtn.textContent = "☀️";
      themeBtn.title = "Tema Chiaro";
    }
  }
})();
