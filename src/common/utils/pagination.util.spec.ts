import { describe, it, expect, vi } from 'vitest';
import {
  buildPaginatedResponse,
  paginateQueryBuilder,
} from './pagination.util.js';

describe('Pagination Utility', () => {
  describe('buildPaginatedResponse', () => {
    it('should correctly calculate pagination metadata for middle page', () => {
      const data = ['item1', 'item2'];
      const result = buildPaginatedResponse(data, 50, 2, 10);

      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should correctly indicate first page (no previous page)', () => {
      const result = buildPaginatedResponse(['item'], 30, 1, 10);

      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should correctly indicate last page (no next page)', () => {
      const result = buildPaginatedResponse(['item'], 30, 3, 10);

      expect(result.meta.page).toBe(3);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should handle empty result set cleanly', () => {
      const result = buildPaginatedResponse([], 0, 1, 20);

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should sanitize negative or zero page and limit inputs', () => {
      const result = buildPaginatedResponse(['item'], 10, -5, 0);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(1);
    });
  });

  describe('paginateQueryBuilder', () => {
    it('should apply skip and take on SelectQueryBuilder and wrap result', async () => {
      const mockItems = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      const mockQb = {
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockItems, 25]),
      };

      const result = await paginateQueryBuilder(mockQb as any, { page: 3, limit: 10 });

      expect(mockQb.skip).toHaveBeenCalledWith(20); // (3 - 1) * 10
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(result.data).toEqual(mockItems);
      expect(result.meta).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should apply transform mapping if provided', async () => {
      const mockItems = [{ id: 1, name: 'alice' }];
      const mockQb = {
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockItems, 1]),
      };

      const result = await paginateQueryBuilder(
        mockQb as any,
        { page: 1, limit: 10 },
        (item) => ({ id: item.id, upper: item.name.toUpperCase() }),
      );

      expect(result.data).toEqual([{ id: 1, upper: 'ALICE' }]);
    });
  });
});
