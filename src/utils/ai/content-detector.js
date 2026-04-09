// Content Detector - Analisi del tipo di contenuto e della lingua
export class ContentDetector {
  static detectContentType(article) {
    const titleLower = article.title.toLowerCase();
    const contentSample = article.content.toLowerCase().slice(0, 2000);

    // Scientific: presenza di termini accademici
    if (
      contentSample.includes('methodology') ||
      contentSample.includes('hypothesis') ||
      contentSample.includes('participants') ||
      contentSample.includes('p <') ||
      contentSample.includes('study') ||
      /\bp\s*=\s*0\.\d+/.test(contentSample)
    )
      return 'scientific';

    // News: riferimenti temporali recenti e fonti
    if (
      /\b(today|yesterday|breaking|reported|according to|oggi|ieri)\b/.test(contentSample) ||
      /\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4}/i.test(
        contentSample,
      )
    )
      return 'news';

    // Tutorial: presenza di istruzioni step-by-step
    if (
      /\b(step|how to|tutorial|guide|install|configure|setup|guida|installare|configurare)\b/.test(
        titleLower,
      ) ||
      /\b(first|second|third|next|then|finally|primo|secondo|terzo|poi|infine)\b/.test(
        contentSample,
      )
    )
      return 'tutorial';

    // Business: termini aziendali
    if (
      /\b(revenue|market|strategy|roi|growth|company|business|ceo|azienda|mercato|strategia)\b/.test(
        contentSample,
      ) ||
      /\$\d+[MBK]|€\d+[MBK]/.test(contentSample)
    )
      return 'business';

    // Opinion: prima persona e argomenti
    if (
      /\b(i believe|in my view|i think|we should|we must|credo che|penso che|dovremmo)\b/.test(
        contentSample,
      ) ||
      /\b(opinion|editorial|commentary|opinione|editoriale)\b/.test(titleLower)
    )
      return 'opinion';

    return 'general';
  }

  static detectLanguage(text) {
    const sample = text.toLowerCase().slice(0, 1000);

    const patterns = {
      it: ['che', 'della', 'degli', 'delle', 'questo', 'questa', 'sono', 'essere', 'nell', 'alla'],
      en: ['the', 'and', 'that', 'this', 'with', 'from', 'have', 'been', 'which', 'their'],
      es: ['que', 'del', 'los', 'las', 'esta', 'este', 'para', 'con', 'una', 'por'],
      fr: ['que', 'les', 'des', 'cette', 'dans', 'pour', 'avec', 'sont', 'qui', 'pas'],
      de: ['der', 'die', 'das', 'und', 'ist', 'des', 'dem', 'den', 'nicht', 'sich'],
    };

    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, words] of Object.entries(patterns)) {
      const score = words.filter((word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        return regex.test(sample);
      }).length;
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }
}
