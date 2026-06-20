import { AsyncLocalStorage } from 'async_hooks';

export type RequestContext = {
  institutionId?: string;
  userId?: string;
  role?: string;
  correlationId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const RequestContext = {
  run: (context: RequestContext, fn: () => any) => storage.run(context, fn),
  getStore: () => storage.getStore(),
  getInstitutionId: () => storage.getStore()?.institutionId,
  getUserId: () => storage.getStore()?.userId,
  getCorrelationId: () => storage.getStore()?.correlationId,
};
