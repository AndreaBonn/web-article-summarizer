// Popup shared state — imported by all popup modules
// Properties are mutated at runtime, the object reference stays the same.
import { I18n } from "../../utils/i18n/i18n.js";

export const state = {
  currentArticle: null,
  currentResults: null,
  selectedLanguage: "it",
  selectedContentType: "auto",
  currentQA: [],
  progressTracker: null,
};

// DOM element references — populated by initElements() after DOMContentLoaded
export const elements = {};

export function initElements() {
  Object.assign(elements, {
    // States
    initialState: document.getElementById("initialState"),
    loadingState: document.getElementById("loadingState"),
    errorState: document.getElementById("errorState"),
    resultsState: document.getElementById("resultsState"),

    // Article info
    articleInfo: document.getElementById("articleInfo"),
    articleTitle: document.getElementById("articleTitle"),
    articleStats: document.getElementById("articleStats"),

    // Controls
    controls: document.getElementById("controls"),
    providerSelect: document.getElementById("providerSelect"),
    languageSelect: document.getElementById("languageSelect"),
    contentTypeSelect: document.getElementById("contentTypeSelect"),
    languageSelectReady: document.getElementById("languageSelectReady"),
    contentTypeSelectReady: document.getElementById("contentTypeSelectReady"),

    // Buttons
    analyzeBtn: document.getElementById("analyzeBtn"),
    generateBtn: document.getElementById("generateBtn"),
    retryBtn: document.getElementById("retryBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    settingsBtn: document.getElementById("settingsBtn"),
    historyBtn: document.getElementById("historyBtn"),
    multiAnalysisBtn: document.getElementById("multiAnalysisBtn"),
    pdfAnalysisBtn: document.getElementById("pdfAnalysisBtn"),
    readingModeBtn: document.getElementById("readingModeBtn"),
    copyBtn: document.getElementById("copyBtn"),
    newBtn: document.getElementById("newBtn"),
    exportPdfBtn: document.getElementById("exportPdfBtn"),
    exportMdBtn: document.getElementById("exportMdBtn"),
    sendEmailBtn: document.getElementById("sendEmailBtn"),
    askBtn: document.getElementById("askBtn"),

    // Content
    loadingText: document.getElementById("loadingText"),
    errorMessage: document.getElementById("errorMessage"),
    summaryContent: document.getElementById("summaryContent"),
    keypointsContent: document.getElementById("keypointsContent"),
    translationContent: document.getElementById("translationContent"),

    // Q&A
    questionInput: document.getElementById("questionInput"),
    qaAnswer: document.getElementById("qaAnswer"),

    // Translation
    translateBtn: document.getElementById("translateBtn"),

    // Citations
    extractCitationsBtn: document.getElementById("extractCitationsBtn"),
    citationsContent: document.getElementById("citationsContent"),
  });
}

// UI state helpers — used by multiple modules
export function showState(stateName) {
  elements.initialState.classList.add("hidden");
  elements.loadingState.classList.add("hidden");
  elements.errorState.classList.add("hidden");
  elements.resultsState.classList.add("hidden");
  elements.articleInfo.classList.add("hidden");
  elements.controls.classList.add("hidden");

  if (stateName === "initial") {
    elements.initialState.classList.remove("hidden");
  } else if (stateName === "loading") {
    elements.loadingState.classList.remove("hidden");
  } else if (stateName === "error") {
    elements.errorState.classList.remove("hidden");
  } else if (stateName === "ready") {
    elements.articleInfo.classList.remove("hidden");
    elements.controls.classList.remove("hidden");
    I18n.updateUI();
  } else if (stateName === "results") {
    elements.articleInfo.classList.remove("hidden");
    elements.resultsState.classList.remove("hidden");
    I18n.updateUI();
  }
}

export function showError(message) {
  elements.errorMessage.textContent = message;
  showState("error");
}
