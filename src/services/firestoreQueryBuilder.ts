/**
 * Firestore Query Builder Utilities
 * Reusable query patterns for common Firestore operations
 */

import {
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type Query,
  type QueryConstraint,
  type DocumentData,
  type WhereFilterOp,
  collection,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Build a user-scoped query
 */
export function buildUserQuery(
  collectionName: string,
  userId: string,
  constraints: QueryConstraint[] = []
): Query<DocumentData> {
  const baseConstraints: QueryConstraint[] = [
    where('userId', '==', userId),
    ...constraints
  ];

  return query(collection(db, collectionName), ...baseConstraints);
}

/**
 * Build a user-scoped query with ordering
 */
export function buildUserQueryWithOrder(
  collectionName: string,
  userId: string,
  orderByField: string,
  orderDirection: 'asc' | 'desc' = 'asc',
  additionalConstraints: QueryConstraint[] = []
): Query<DocumentData> {
  return buildUserQuery(collectionName, userId, [
    orderBy(orderByField, orderDirection),
    ...additionalConstraints
  ]);
}

/**
 * Build a paginated query
 */
export function buildPaginatedQuery(
  collectionName: string,
  userId: string,
  orderByField: string,
  pageSize: number = 20,
  lastDoc?: DocumentData,
  orderDirection: 'asc' | 'desc' = 'asc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [
    orderBy(orderByField, orderDirection),
    limit(pageSize)
  ];

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  return buildUserQuery(collectionName, userId, constraints);
}

/**
 * Build a query with multiple where clauses
 */
export function buildQueryWithFilters(
  collectionName: string,
  userId: string,
  filters: Array<[string, WhereFilterOp, unknown]>,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = filters.map(([field, op, value]) =>
    where(field, op, value)
  );

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  return buildUserQuery(collectionName, userId, constraints);
}

/**
 * Helper to get the last document from a snapshot for pagination
 */
export function getLastDocument(snapshot: QuerySnapshot<DocumentData>): DocumentData | undefined {
  if (snapshot.empty) {
    return undefined;
  }
  return snapshot.docs[snapshot.docs.length - 1];
}

/**
 * Build a query with date range filtering
 */
export function buildDateRangeQuery(
  collectionName: string,
  userId: string,
  dateField: string,
  startDate: Date,
  endDate: Date,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [
    where(dateField, '>=', startDate),
    where(dateField, '<=', endDate),
  ];

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  return buildUserQuery(collectionName, userId, constraints);
}

/**
 * Build a query with array contains filter
 */
export function buildArrayContainsQuery(
  collectionName: string,
  userId: string,
  arrayField: string,
  value: unknown,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [
    where(arrayField, 'array-contains', value),
  ];

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  return buildUserQuery(collectionName, userId, constraints);
}

/**
 * Build a query with multiple array-contains-any filters
 */
export function buildArrayContainsAnyQuery(
  collectionName: string,
  userId: string,
  arrayField: string,
  values: unknown[],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [
    where(arrayField, 'array-contains-any', values),
  ];

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  return buildUserQuery(collectionName, userId, constraints);
}

/**
 * Build a query with in filter
 */
export function buildInQuery(
  collectionName: string,
  userId: string,
  field: string,
  values: unknown[],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [
    where(field, 'in', values),
  ];

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  return buildUserQuery(collectionName, userId, constraints);
}

