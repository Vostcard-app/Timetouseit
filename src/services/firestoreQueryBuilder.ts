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

