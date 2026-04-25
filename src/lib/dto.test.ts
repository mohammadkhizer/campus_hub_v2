import { describe, it, expect } from 'vitest';
import { toDTO, fromLean } from './dto';

describe('DTO Utilities', () => {
  describe('toDTO', () => {
    it('should handle null or undefined', () => {
      expect(toDTO(null)).toBeNull();
      expect(toDTO(undefined)).toBeUndefined();
    });

    it('should convert Dates to ISO strings', () => {
      const date = new Date('2026-04-25T12:00:00.000Z');
      expect(toDTO(date)).toBe('2026-04-25T12:00:00.000Z');
    });

    it('should convert _id to id and stringify it', () => {
      const mockObj = { _id: '507f1f77bcf86cd799439011', name: 'Test' };
      const dto: any = toDTO(mockObj);
      expect(dto.id).toBe('507f1f77bcf86cd799439011');
      expect(dto.name).toBe('Test');
    });

    it('should strip __v from objects', () => {
      const mockObj = { id: '123', __v: 0, name: 'Test' };
      const dto: any = toDTO(mockObj);
      expect(dto.__v).toBeUndefined();
    });

    it('should handle arrays correctly', () => {
      const arr = [{ _id: '1', __v: 0 }, { _id: '2', __v: 0 }];
      const dto: any = toDTO(arr);
      expect(dto).toHaveLength(2);
      expect(dto[0].id).toBe('1');
      expect(dto[0].__v).toBeUndefined();
    });
  });

  describe('fromLean', () => {
    it('should handle basic object mapping', () => {
      const leanDoc = { _id: '123', name: 'Lean Test', __v: 0 };
      const dto: any = fromLean(leanDoc);
      expect(dto.id).toBe('123');
      expect(dto._id).toBeUndefined();
      expect(dto.__v).toBeUndefined();
    });
  });
});
