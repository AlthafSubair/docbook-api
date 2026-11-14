import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../interfaces/paginated-response.interface.js';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Builds standard pagination metadata and wraps items in a PaginatedResponse envelope.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 20,
): PaginatedResponse<T> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.ceil(total / safeLimit) || 1;

  const meta: PaginationMeta = {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };

  return {
    data,
    meta,
  };
}

/**
 * Applies skip & take to any TypeORM SelectQueryBuilder, executes count & fetch,
 * and returns a standard PaginatedResponse. Supports an optional synchronous transform mapping.
 */
export async function paginateQueryBuilder<T extends ObjectLiteral, R = T>(
  queryBuilder: SelectQueryBuilder<T>,
  pagination: PaginationOptions,
  transform?: (item: T) => R,
): Promise<PaginatedResponse<R>> {
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 20;
  const skip = (page - 1) * limit;

  queryBuilder.skip(skip).take(limit);

  const [items, total] = await queryBuilder.getManyAndCount();
  const data = transform ? items.map(transform) : (items as unknown as R[]);

  return buildPaginatedResponse(data, total, page, limit);
}
