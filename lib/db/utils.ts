import { ObjectId } from 'mongodb';

/**
 * Convert a string ID to ObjectId, or return the ObjectId if already converted
 */
export function toObjectId(id: string | ObjectId | undefined | null): ObjectId | null {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string') {
    try {
      return new ObjectId(id);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Convert ObjectId to string, or return the string if already a string
 */
export function toStringId(id: string | ObjectId | undefined | null): string | null {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (id instanceof ObjectId) return id.toString();
  return null;
}

/**
 * Create a query that matches both string and ObjectId formats
 */
export function createIdQuery(field: string, id: string | ObjectId | undefined | null) {
  if (!id) return {};
  
  const objectId = toObjectId(id);
  if (!objectId) return {};
  
  return {
    $or: [
      { [field]: id },
      { [field]: objectId },
    ],
  };
}

