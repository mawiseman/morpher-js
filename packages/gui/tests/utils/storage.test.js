/**
 * Tests for storage utility
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as storage from '../../src/utils/storage.js';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(storage.isStorageAvailable()).toBe(true);
    });
  });

  describe('getItem / setItem', () => {
    it('should store and retrieve a string', () => {
      storage.setItem('test', 'value');
      expect(storage.getItem('test')).toBe('value');
    });

    it('should store and retrieve an object', () => {
      const obj = { foo: 'bar', num: 42 };
      storage.setItem('test', obj);
      expect(storage.getItem('test')).toEqual(obj);
    });

    it('should store and retrieve an array', () => {
      const arr = [1, 2, 3, 'four'];
      storage.setItem('test', arr);
      expect(storage.getItem('test')).toEqual(arr);
    });

    it('should return default value for non-existent key', () => {
      expect(storage.getItem('missing', 'default')).toBe('default');
    });

    it('should return null for non-existent key without default', () => {
      expect(storage.getItem('missing')).toBe(null);
    });
  });

  describe('removeItem', () => {
    it('should remove an item', () => {
      storage.setItem('test', 'value');
      expect(storage.hasItem('test')).toBe(true);

      storage.removeItem('test');
      expect(storage.hasItem('test')).toBe(false);
    });

    it('should return true on successful removal', () => {
      storage.setItem('test', 'value');
      expect(storage.removeItem('test')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      storage.setItem('test1', 'value1');
      storage.setItem('test2', 'value2');
      storage.setItem('test3', 'value3');

      expect(storage.getKeys().length).toBe(3);

      storage.clear();
      expect(storage.getKeys().length).toBe(0);
    });

    it('should return true on successful clear', () => {
      expect(storage.clear()).toBe(true);
    });
  });

  describe('getKeys', () => {
    it('should return all keys', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.setItem('key3', 'value3');

      const keys = storage.getKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys.length).toBe(3);
    });

    it('should filter keys by prefix', () => {
      storage.setItem('project_1', 'value1');
      storage.setItem('project_2', 'value2');
      storage.setItem('image_1', 'value3');

      const projectKeys = storage.getKeys('project_');
      expect(projectKeys).toContain('project_1');
      expect(projectKeys).toContain('project_2');
      expect(projectKeys).not.toContain('image_1');
      expect(projectKeys.length).toBe(2);
    });

    it('should return empty array when no keys exist', () => {
      expect(storage.getKeys()).toEqual([]);
    });
  });

  describe('getItems', () => {
    it('should get multiple items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.setItem('key3', 'value3');

      const items = storage.getItems(['key1', 'key2']);
      expect(items).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });
  });

  describe('setItems', () => {
    it('should set multiple items', () => {
      const items = {
        key1: 'value1',
        key2: 'value2',
        key3: { nested: 'object' },
      };

      storage.setItems(items);

      expect(storage.getItem('key1')).toBe('value1');
      expect(storage.getItem('key2')).toBe('value2');
      expect(storage.getItem('key3')).toEqual({ nested: 'object' });
    });
  });

  describe('hasItem', () => {
    it('should return true for existing items', () => {
      storage.setItem('test', 'value');
      expect(storage.hasItem('test')).toBe(true);
    });

    it('should return false for non-existing items', () => {
      expect(storage.hasItem('missing')).toBe(false);
    });
  });

  describe('getSize', () => {
    it('should return size estimate', () => {
      const initialSize = storage.getSize();

      storage.setItem('test', 'value');
      const afterSize = storage.getSize();

      expect(afterSize).toBeGreaterThan(initialSize);
    });

    it('should return 0 for empty storage', () => {
      storage.clear();
      expect(storage.getSize()).toBe(0);
    });
  });

  describe('createNamespace', () => {
    it('should create namespaced storage', () => {
      const projectStorage = storage.createNamespace('project');

      projectStorage.setItem('name', 'Test Project');
      projectStorage.setItem('id', 123);

      expect(projectStorage.getItem('name')).toBe('Test Project');
      expect(projectStorage.getItem('id')).toBe(123);

      // Check that keys are prefixed
      expect(storage.hasItem('project:name')).toBe(true);
      expect(storage.hasItem('project:id')).toBe(true);
    });

    it('should isolate namespaces', () => {
      const ns1 = storage.createNamespace('ns1');
      const ns2 = storage.createNamespace('ns2');

      ns1.setItem('key', 'value1');
      ns2.setItem('key', 'value2');

      expect(ns1.getItem('key')).toBe('value1');
      expect(ns2.getItem('key')).toBe('value2');
    });

    it('should clear only namespaced items', () => {
      const projectStorage = storage.createNamespace('project');

      storage.setItem('global', 'value');
      projectStorage.setItem('name', 'Test');
      projectStorage.setItem('id', 123);

      projectStorage.clear();

      expect(projectStorage.hasItem('name')).toBe(false);
      expect(projectStorage.hasItem('id')).toBe(false);
      expect(storage.hasItem('global')).toBe(true);
    });

    it('should get namespaced keys', () => {
      const projectStorage = storage.createNamespace('project');

      projectStorage.setItem('key1', 'value1');
      projectStorage.setItem('key2', 'value2');

      const keys = projectStorage.getKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).not.toContain('project:key1');
    });
  });
});
