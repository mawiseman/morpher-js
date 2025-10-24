/**
 * Tests for id-generator utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as idGenerator from '../../src/utils/id-generator.js';

describe('id-generator', () => {
  beforeEach(() => {
    idGenerator.resetCounter();
  });

  describe('generateNumericId', () => {
    it('should generate sequential numeric IDs', () => {
      expect(idGenerator.generateNumericId()).toBe(1);
      expect(idGenerator.generateNumericId()).toBe(2);
      expect(idGenerator.generateNumericId()).toBe(3);
    });
  });

  describe('generateId', () => {
    it('should generate sequential IDs with default prefix', () => {
      expect(idGenerator.generateId()).toBe('id_1');
      expect(idGenerator.generateId()).toBe('id_2');
    });

    it('should generate IDs with custom prefix', () => {
      expect(idGenerator.generateId('project')).toBe('project_1');
      expect(idGenerator.generateId('image')).toBe('image_2');
    });
  });

  describe('generateRandomId', () => {
    it('should generate random ID with default length', () => {
      const id = idGenerator.generateRandomId();
      expect(id).toHaveLength(8);
    });

    it('should generate random ID with custom length', () => {
      const id = idGenerator.generateRandomId(16);
      expect(id).toHaveLength(16);
    });

    it('should generate different IDs', () => {
      const id1 = idGenerator.generateRandomId();
      const id2 = idGenerator.generateRandomId();
      expect(id1).not.toBe(id2);
    });

    it('should only contain alphanumeric characters', () => {
      const id = idGenerator.generateRandomId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('generateUUID', () => {
    it('should generate valid UUID format', () => {
      const uuid = idGenerator.generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate different UUIDs', () => {
      const uuid1 = idGenerator.generateUUID();
      const uuid2 = idGenerator.generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should have version 4 indicator', () => {
      const uuid = idGenerator.generateUUID();
      // 13th character should be '4'
      expect(uuid[14]).toBe('4');
    });
  });

  describe('generateShortId', () => {
    it('should generate short ID', () => {
      const id = idGenerator.generateShortId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate different IDs', () => {
      const id1 = idGenerator.generateShortId();
      const id2 = idGenerator.generateShortId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateTimestampId', () => {
    it('should generate timestamp-based ID', () => {
      const id = idGenerator.generateTimestampId();
      expect(id).toMatch(/^\d+_\d+$/);
    });

    it('should generate ID with prefix', () => {
      const id = idGenerator.generateTimestampId('project');
      expect(id).toMatch(/^project_\d+_\d+$/);
    });

    it('should generate different IDs', () => {
      const id1 = idGenerator.generateTimestampId();
      const id2 = idGenerator.generateTimestampId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('resetCounter', () => {
    it('should reset counter to 0', () => {
      idGenerator.generateNumericId();
      idGenerator.generateNumericId();
      expect(idGenerator.getCounter()).toBe(2);

      idGenerator.resetCounter();
      expect(idGenerator.getCounter()).toBe(0);

      expect(idGenerator.generateNumericId()).toBe(1);
    });
  });

  describe('getCounter', () => {
    it('should return current counter value', () => {
      expect(idGenerator.getCounter()).toBe(0);
      idGenerator.generateNumericId();
      expect(idGenerator.getCounter()).toBe(1);
      idGenerator.generateNumericId();
      expect(idGenerator.getCounter()).toBe(2);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      const uuid = idGenerator.generateUUID();
      expect(idGenerator.isValidUUID(uuid)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(idGenerator.isValidUUID('invalid')).toBe(false);
      expect(idGenerator.isValidUUID('12345678-1234-1234-1234-123456789012')).toBe(true);
      expect(idGenerator.isValidUUID('not-a-uuid')).toBe(false);
    });
  });

  describe('hashCode', () => {
    it('should generate hash from string', () => {
      const hash = idGenerator.hashCode('test');
      expect(typeof hash).toBe('number');
      expect(hash).toBeGreaterThanOrEqual(0);
    });

    it('should generate consistent hash', () => {
      const hash1 = idGenerator.hashCode('test');
      const hash2 = idGenerator.hashCode('test');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different strings', () => {
      const hash1 = idGenerator.hashCode('test1');
      const hash2 = idGenerator.hashCode('test2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createNamespacedGenerator', () => {
    it('should create namespaced generator', () => {
      const generator = idGenerator.createNamespacedGenerator('project');
      expect(generator.generateId()).toBe('project_1');
      expect(generator.generateId()).toBe('project_2');
    });

    it('should isolate namespace counters', () => {
      const gen1 = idGenerator.createNamespacedGenerator('project');
      const gen2 = idGenerator.createNamespacedGenerator('image');

      expect(gen1.generateId()).toBe('project_1');
      expect(gen2.generateId()).toBe('image_1');
      expect(gen1.generateId()).toBe('project_2');
      expect(gen2.generateId()).toBe('image_2');
    });

    it('should reset namespaced counter', () => {
      const generator = idGenerator.createNamespacedGenerator('test');
      generator.generateId();
      generator.generateId();

      expect(generator.getCounter()).toBe(2);
      generator.reset();
      expect(generator.getCounter()).toBe(0);
      expect(generator.generateId()).toBe('test_1');
    });
  });
});
