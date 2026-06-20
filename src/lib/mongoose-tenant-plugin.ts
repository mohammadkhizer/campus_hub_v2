import { Schema } from 'mongoose';
import { logger } from './logger';
import { RequestContext } from './context';

/**
 * Mongoose plugin to enforce multi-tenancy.
 * 1. Automatically adds 'institutionId' to the schema if missing.
 * 2. Injects institutionId into queries automatically.
 */
export function tenantPlugin(schema: Schema) {
  // 1. Add institutionId field if it doesn't exist
  if (!schema.path('institutionId')) {
    schema.add({
      institutionId: {
        type: String, // Stored as string or ObjectId depending on preference, consistency is key
        required: true,
        index: true,
      },
    });
  }

  // 2. Query Middleware: Inject institutionId filter
  const queryMethods = ['find', 'findOne', 'countDocuments', 'count', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'findOneAndDelete'];
  
  queryMethods.forEach(method => {
    schema.pre(method as any, function(this: any) {
      const institutionId = RequestContext.getInstitutionId();
      const role = RequestContext.getStore()?.role;

      // Skip scoping for SuperAdmins or if not in a request context (e.g. background scripts)
      if (institutionId && role !== 'superadmin') {
        this.where({ institutionId });
      }
    });
  });

  // 3. Save Middleware: Ensure institutionId is present
  schema.pre('save', async function() {
    const institutionId = RequestContext.getInstitutionId();
    const role = RequestContext.getStore()?.role;

    if (institutionId && role !== 'superadmin' && !this.get('institutionId')) {
      this.set('institutionId', institutionId);
    }

    if (this.isNew && !this.get('institutionId')) {
      logger.error('Mongoose: Attempting to save document without institutionId', { 
        model: (this.constructor as any).modelName 
      });
      // In strict mode, we could throw an error here
    }
  });
}
