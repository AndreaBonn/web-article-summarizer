import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  storage: { local: { get: vi.fn(), set: vi.fn() } },
  runtime: { id: 'test-id' },
};

// Mock dependencies
vi.mock('../src/utils/ai/citation-extractor.js', () => ({
  CitationExtractor: {
    formatCitation: vi.fn(() => 'Author (2024). Title. Source.'),
  },
}));

vi.mock('../src/utils/ai/citation-formatter.js', () => ({
  CitationFormatter: {
    getCitationTypeLabel: vi.fn((type) => {
      const labels = {
        direct_quote: 'Citazione Diretta',
        study_reference: 'Studio/Ricerca',
      };
      return labels[type] || 'Altro';
    }),
  },
}));

const { MarkdownExporter } = await import('../src/utils/export/markdown-exporter.js');

const mockArticle = {
  title: 'Test Article Title',
  url: 'https://example.com/article',
  wordCount: 1500,
  readingTimeMinutes: 7,
};

const mockMetadata = {
  provider: 'groq',
  language: 'it',
  contentType: 'general',
};

describe('MarkdownExporter', () => {
  let capturedMarkdown;

  beforeEach(() => {
    capturedMarkdown = null;
    // Mock downloadMarkdown to capture the generated markdown instead of downloading
    vi.spyOn(MarkdownExporter, 'downloadMarkdown').mockImplementation((content) => {
      capturedMarkdown = content;
    });
  });

  describe('exportToMarkdown', () => {
    it('test_exportToMarkdown_basic_includes_header_and_summary', () => {
      MarkdownExporter.exportToMarkdown(mockArticle, 'This is the summary.', [], mockMetadata);

      expect(capturedMarkdown).toContain('# Test Article Title');
      expect(capturedMarkdown).toContain('**URL:** https://example.com/article');
      expect(capturedMarkdown).toContain('1500 parole');
      expect(capturedMarkdown).toContain('groq');
      expect(capturedMarkdown).toContain('## 📝 Riassunto');
      expect(capturedMarkdown).toContain('This is the summary.');
    });

    it('test_exportToMarkdown_with_keypoints_renders_numbered_list', () => {
      const keyPoints = [
        { title: 'Point 1', paragraphs: '1-2', description: 'Description 1' },
        { title: 'Point 2', paragraphs: '3', description: 'Description 2' },
      ];

      MarkdownExporter.exportToMarkdown(mockArticle, 'Summary', keyPoints, mockMetadata);

      expect(capturedMarkdown).toContain('## 🔑 Punti Chiave');
      expect(capturedMarkdown).toContain('### 1. Point 1');
      expect(capturedMarkdown).toContain('§1-2');
      expect(capturedMarkdown).toContain('Description 1');
      expect(capturedMarkdown).toContain('### 2. Point 2');
    });

    it('test_exportToMarkdown_with_translation_includes_section', () => {
      MarkdownExporter.exportToMarkdown(
        mockArticle,
        'Summary',
        [],
        mockMetadata,
        'Translated text here',
      );

      expect(capturedMarkdown).toContain('## 🌍 Traduzione');
      expect(capturedMarkdown).toContain('Translated text here');
    });

    it('test_exportToMarkdown_with_qa_includes_qa_section', () => {
      const qa = [
        { question: 'What is it?', answer: 'It is a test.' },
        { question: 'Why?', answer: 'Because.' },
      ];

      MarkdownExporter.exportToMarkdown(mockArticle, 'Summary', [], mockMetadata, null, qa);

      expect(capturedMarkdown).toContain('Domande e Risposte');
      expect(capturedMarkdown).toContain('What is it?');
      expect(capturedMarkdown).toContain('It is a test.');
    });

    it('test_exportToMarkdown_with_notes_includes_notes_section', () => {
      MarkdownExporter.exportToMarkdown(
        mockArticle,
        'Summary',
        [],
        mockMetadata,
        null,
        null,
        'My personal notes here',
      );

      expect(capturedMarkdown).toContain('📌 Note Personali');
      expect(capturedMarkdown).toContain('My personal notes here');
    });

    it('test_exportToMarkdown_without_summary_skips_section', () => {
      MarkdownExporter.exportToMarkdown(mockArticle, null, [], mockMetadata);

      expect(capturedMarkdown).not.toContain('## 📝 Riassunto');
    });
  });

  describe('getCitationTypeLabel', () => {
    it('test_getCitationTypeLabel_delegates_to_CitationFormatter', () => {
      const result = MarkdownExporter.getCitationTypeLabel('direct_quote');
      expect(result).toBe('Citazione Diretta');
    });

    it('test_getCitationTypeLabel_unknown_returns_altro', () => {
      const result = MarkdownExporter.getCitationTypeLabel('unknown_type');
      expect(result).toBe('Altro');
    });
  });
});
