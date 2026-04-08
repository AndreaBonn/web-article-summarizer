// Reading-mode shared state — imported by all reading-mode modules

export const state = {
  currentData: null,
  syncScroll: true,
  isResizing: false,
  voiceController: null,
};

// DOM element references — populated by initElements() after DOMContentLoaded
export const elements = {};

export function initElements() {
  Object.assign(elements, {
    backBtn: document.getElementById('backBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    copyBtn: document.getElementById('copyBtn'),
    exportBtn: document.getElementById('exportBtn'),
    articleContent: document.getElementById('articleContent'),
    summaryContent: document.getElementById('summaryContent'),
    articleWordCount: document.getElementById('articleWordCount'),
    articleReadTime: document.getElementById('articleReadTime'),
    summaryProvider: document.getElementById('summaryProvider'),
    summaryLanguage: document.getElementById('summaryLanguage'),
    divider: document.getElementById('divider'),
    // Article views
    articleIframe: document.getElementById('articleIframe'),
    articleText: document.getElementById('articleText'),
    viewIframeBtn: document.getElementById('viewIframeBtn'),
    viewTextBtn: document.getElementById('viewTextBtn'),
    // Tab contents
    summaryTabContent: document.getElementById('summaryTabContent'),
    keypointsTabContent: document.getElementById('keypointsTabContent'),
    translationTabContent: document.getElementById('translationTabContent'),
    citationsTabContent: document.getElementById('citationsTabContent'),
    qaTabContent: document.getElementById('qaTabContent'),
    // Buttons
    translateBtn: document.getElementById('translateBtn'),
    extractCitationsBtn: document.getElementById('extractCitationsBtn'),
    qaAskBtn: document.getElementById('qaAskBtn'),
    qaInput: document.getElementById('qaInput'),
    qaHistory: document.getElementById('qaHistory'),
    // Voice controls
    ttsPlayBtn: document.getElementById('ttsPlayBtn'),
    ttsPauseBtn: document.getElementById('ttsPauseBtn'),
    ttsStopBtn: document.getElementById('ttsStopBtn'),
    qaVoiceBtn: document.getElementById('qaVoiceBtn'),
    // Font size controls
    fontIncreaseBtn: document.getElementById('fontIncreaseBtn'),
    fontDecreaseBtn: document.getElementById('fontDecreaseBtn'),
    fontSizeLabel: document.getElementById('fontSizeLabel'),
  });
}
