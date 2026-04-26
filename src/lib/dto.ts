/**
 * Deeply serializes a Mongoose object or array to a plain JavaScript object.
 * Replaces _id with id and removes __v and other Mongoose metadata.
 * Also handles Uint8Array and MongoDB Binary objects by converting them to strings/hex.
 */
export function toDTO<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toDTO(item)) as any;
  }
  
  // Handle Uint8Array or MongoDB Binary/UUID which Next.js cannot pass to client
  if (obj instanceof Uint8Array || (obj.buffer && obj.buffer instanceof Uint8Array)) {
    return (obj.toString('hex') || 'binary-data') as any;
  }

  if (typeof obj !== 'object' || obj instanceof Date || obj._bsontype) {
    // If it's a MongoDB type like ObjectId or Binary but NOT handled above
    if (obj._id) return { ...obj, id: obj._id.toString() } as any;
    if (typeof obj.toString === 'function' && obj._bsontype) return obj.toString() as any;
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
