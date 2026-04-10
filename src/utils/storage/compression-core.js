// Compression Core - Compressione/decompressione dati con LZ-String
import LZString from 'lz-string';
import { Logger } from '../core/logger.js';

export class CompressionCore {
  constructor() {
    this.compressionThreshold = 1000; // Comprimi solo se > 1KB
  }

  /**
   * Comprimi stringa usando LZ-String
   */
  compress(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    // Se i dati sono piccoli, non comprimere
    if (data.length < this.compressionThreshold) {
      return {
        compressed: false,
        data: data,
        originalSize: data.length,
        compressedSize: data.length,
      };
    }

    try {
      const compressed = LZString.compressToUTF16(data);
      return {
        compressed: true,
        data: compressed,
        originalSize: data.length,
        compressedSize: compressed.length,
        ratio: ((1 - compressed.length / data.length) * 100).toFixed(1),
      };
    } catch (error) {
      Logger.error('Errore nella compressione:', error);
      return {
        compressed: false,
        data: data,
        originalSize: data.length,
        compressedSize: data.length,
        error: error.message,
      };
    }
  }

  /**
   * Decomprimi stringa
   */
  decompress(compressedData) {
    if (!compressedData.compressed) {
      return typeof compressedData.data === 'string'
        ? compressedData.data
        : JSON.stringify(compressedData.data);
    }

    try {
      const result = LZString.decompressFromUTF16(compressedData.data);
      if (result === null || result === '') {
        throw new Error('Decompressione ha restituito dati vuoti — possibile corruzione');
      }
      return result;
    } catch (error) {
      Logger.error('Errore nella decompressione — dati corrotti:', error);
      throw new Error('Impossibile decomprimere i dati: potrebbero essere corrotti.', {
        cause: error,
      });
    }
  }
}
