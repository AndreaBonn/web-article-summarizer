import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@utils/core/logger.js', () => ({
  Logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// lz-string is mocked per-test only where needed; default behaviour uses the real library.
import { CompressionCore } from '@utils/storage/compression-core.js';

describe('CompressionCore', () => {
  let core;

  beforeEach(() => {
    vi.restoreAllMocks();
    core = new CompressionCore();
  });

  // ─── compress ─────────────────────────────────────────────────────────────

  describe('compress', () => {
    it('test_compress_smallData_returnsUncompressed', () => {
      // Arrange — string below the 1000-char threshold
      const input = 'short text';
      // Act
      const result = core.compress(input);
      // Assert
      expect(result.compressed).toBe(false);
      expect(result.data).toBe('short text');
      expect(result.originalSize).toBe(input.length);
      expect(result.compressedSize).toBe(input.length);
    });

    it('test_compress_largeData_returnsCompressedWithRatio', () => {
      // Arrange — string longer than 1000 chars
      const input = 'a'.repeat(2000);
      // Act
      const result = core.compress(input);
      // Assert
      expect(result.compressed).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.originalSize).toBe(2000);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.ratio).toBeDefined();
      // ratio is a string like "95.0"
      expect(parseFloat(result.ratio)).toBeGreaterThan(0);
    });

    it('test_compress_objectInput_serializesToJson', () => {
      // Arrange — plain object below threshold
      const input = { key: 'val' };
      // Act
      const result = core.compress(input);
      // Assert — serialised to JSON before size check
      expect(result.compressed).toBe(false);
      expect(result.data).toBe(JSON.stringify(input));
    });

    it('test_compress_compressionError_returnsFallback', async () => {
      // Arrange — mock LZString to throw on compressToUTF16
      const LZString = await import('lz-string');
      vi.spyOn(LZString.default, 'compressToUTF16').mockImplementation(() => {
        throw new Error('compression failure');
      });
      const input = 'x'.repeat(2000); // exceeds threshold
      // Act
      const result = core.compress(input);
      // Assert — fallback: uncompressed data returned, error recorded
      expect(result.compressed).toBe(false);
      expect(result.data).toBe(input);
      expect(result.error).toBe('compression failure');
    });
  });

  // ─── decompress ───────────────────────────────────────────────────────────

  describe('decompress', () => {
    it('test_decompress_uncompressedString_returnsOriginal', () => {
      // Arrange
      const compressedData = { compressed: false, data: 'hello world' };
      // Act
      const result = core.decompress(compressedData);
      // Assert
      expect(result).toBe('hello world');
    });

    it('test_decompress_uncompressedObject_returnsJsonString', () => {
      // Arrange — data stored as object (edge case in the source)
      const obj = { foo: 'bar' };
      const compressedData = { compressed: false, data: obj };
      // Act
      const result = core.decompress(compressedData);
      // Assert
      expect(result).toBe(JSON.stringify(obj));
    });

    it('test_decompress_compressedData_returnsOriginal', () => {
      // Arrange — produce a real compressed payload via compress()
      const original = 'x'.repeat(2000);
      const compressed = core.compress(original);
      // Act
      const result = core.decompress(compressed);
      // Assert
      expect(result).toBe(original);
    });

    it('test_decompress_corruptedData_throwsWithCause', async () => {
      // Arrange — decompressFromUTF16 throws to simulate corrupt data
      const LZString = await import('lz-string');
      vi.spyOn(LZString.default, 'decompressFromUTF16').mockImplementation(() => {
        throw new Error('corrupt bytes');
      });
      const compressedData = { compressed: true, data: 'garbage' };
      // Act / Assert
      expect(() => core.decompress(compressedData)).toThrow(
        'Impossibile decomprimere i dati: potrebbero essere corrotti.',
      );
    });

    it('test_decompress_nullResult_throwsCorruptionError', async () => {
      // Arrange — decompressFromUTF16 returns null (LZString signal for bad data)
      const LZString = await import('lz-string');
      vi.spyOn(LZString.default, 'decompressFromUTF16').mockReturnValue(null);
      const compressedData = { compressed: true, data: 'not-real' };
      // Act / Assert
      expect(() => core.decompress(compressedData)).toThrow(
        'Impossibile decomprimere i dati: potrebbero essere corrotti.',
      );
    });
  });

  // ─── round-trip ───────────────────────────────────────────────────────────

  describe('round-trip', () => {
    it('test_roundTrip_largeText_preservesContent', () => {
      // Arrange — realistic large payload (> threshold) with varied content
      const original = JSON.stringify({
        title: 'Test article',
        body: 'Lorem ipsum '.repeat(100),
        tags: ['ai', 'test', 'compression'],
        metadata: { author: 'tester', date: '2026-04-10' },
      });
      // Act
      const compressed = core.compress(original);
      const restored = core.decompress(compressed);
      // Assert
      expect(restored).toBe(original);
    });
  });
});
