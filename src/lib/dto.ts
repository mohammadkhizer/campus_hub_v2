/**
 * Deeply serializes a Mongoose object or array to a plain JavaScript object.
 * Replaces _id with id and removes __v and other Mongoose metadata.
 */
export function toDTO<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toDTO(item)) as any;
  }
  
  if (typeof obj !== 'object' || obj instanceof Date || obj._bsontype) {
    if (obj._id) return { ...obj, id: obj._id.toString() } as any;
    return obj;
  }

  // Handle Mongoose documents and plain objects
  const plainObj = typeof obj.toObject === 'function' ? obj.toObject() : obj;
  const newObj: any = {};

  for (const key in plainObj) {
    if (key === '_id') {
      newObj.id = plainObj._id.toString();
    } else if (key === '__v') {
      // Skip version key
    } else if (plainObj[key] && typeof plainObj[key] === 'object' && !(plainObj[key] instanceof Date)) {
      newObj[key] = toDTO(plainObj[key]);
    } else {
      newObj[key] = plainObj[key];
    }
  }

  return newObj as T;
}
