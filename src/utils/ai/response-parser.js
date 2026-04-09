// Response Parser - Parsing delle risposte dai provider LLM
export class ResponseParser {
  static parseResponse(responseText) {
    const parts = responseText.split('## PUNTI CHIAVE');

    const summary = parts[0].replace('## RIASSUNTO', '').trim();

    if (!summary || summary.trim().length < 50) {
      throw new Error(
        'Il provider AI ha restituito una risposta in formato non valido. Riprova o cambia provider.',
      );
    }

    const keyPointsText = parts[1] || '';
    const keyPointsRegex = /\d+\.\s+\*\*(.+?)\*\*\s+\(§(\d+(?:-\d+)?)\)\s+(.+?)(?=\n\d+\.|$)/gs;

    const keyPoints = [];
    let match;

    while ((match = keyPointsRegex.exec(keyPointsText)) !== null) {
      keyPoints.push({
        title: match[1].trim(),
        paragraphs: match[2],
        description: match[3].trim(),
      });
    }

    return { summary, keyPoints };
  }

  static parseKeyPointsResponse(responseText) {
    // Parse solo i punti chiave (senza riassunto)
    const keyPointsText = responseText.replace('## PUNTI CHIAVE', '').trim();
    const keyPointsRegex = /\d+\.\s+\*\*(.+?)\*\*\s+\(§(\d+(?:-\d+)?)\)\s+(.+?)(?=\n\d+\.|$)/gs;

    const keyPoints = [];
    let match;

    while ((match = keyPointsRegex.exec(keyPointsText)) !== null) {
      keyPoints.push({
        title: match[1].trim(),
        paragraphs: match[2],
        description: match[3].trim(),
      });
    }

    return keyPoints;
  }
}
