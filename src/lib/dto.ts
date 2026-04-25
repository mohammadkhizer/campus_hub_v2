/**
 * Utility to flatten Mongoose documents into plain objects for Client Component hydration.
 * This replaces the inefficient JSON.parse(JSON.stringify(doc)) hack.
 */
export function toDTO<T>(obj: any): T {
  if (!obj) return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => toDTO(item)) as any;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }

  // Handle Mongoose Objects (HydratedDocuments)
  if (obj.toObject && typeof obj.toObject === 'function') {
    obj = obj.toObject();
  }

  // Handle standard objects
  if (typeof obj === 'object') {
    const plain: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Handle _id to id conversion
        if (key === '_id' && value) {
          plain.id = value.toString();
        } else if (key === '__v') {
          // Skip version key
          continue;
        } else {
          plain[key] = toDTO(value);
        }
      }
    }
    
    // If it has _id but no id, ensure id is set
    if (obj._id && !plain.id) {
      plain.id = obj._id.toString();
    }

    return plain;
  }

  return obj;
}

/**
 * Specifically handles Mongoose Lean objects which already have most fields as plain JS.
 */
export function fromLean<T>(doc: any): T {
  if (!doc) return doc;
  
  if (Array.isArray(doc)) {
    return doc.map(fromLean) as any;
  }

  const plain = { ...doc };
  
  if (plain._id) {
    plain.id = plain._id.toString();
    delete plain._id;
  }
  
  if (plain.__v !== undefined) {
    delete plain.__v;
  }

  // Recursively handle Dates and Nested Objects
  for (const key in plain) {
    if (plain[key] instanceof Date) {
      plain[key] = plain[key].toISOString();
    } else if (typeof plain[key] === 'object' && plain[key] !== null && !plain[key].toString().match(/^[0-9a-fA-F]{24}$/)) {
      // If it's an object but not an ObjectId string, recurse
      plain[key] = fromLean(plain[key]);
    } else if (plain[key] && typeof plain[key].toString === 'function' && plain[key].toString().match(/^[0-9a-fA-F]{24}$/)) {
      // If it's an ObjectId object, stringify it
      plain[key] = plain[key].toString();
    }
  }

  return plain as T;
}
