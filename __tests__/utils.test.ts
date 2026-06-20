import { cn } from '@/lib/utils';
import { describe, it, expect } from '@jest/globals';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should resolve tailwind conflicts', () => {
      // p-4 and p-2 conflict, p-2 should win
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should handle conditional classes', () => {
      const isTrue = true;
      const isFalse = false;
      expect(cn('base-class', isTrue && 'true-class', isFalse && 'false-class')).toBe('base-class true-class');
    });

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'], { 'class3': true, 'class4': false })).toBe('class1 class2 class3');
    });
  });
});
