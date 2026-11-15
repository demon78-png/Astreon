import serverless from 'serverless-http';
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { createApiApp } from '../../src/server/apiApp.ts';
import { normalizeNetlifyApiPath } from '../../src/utils/netlify.ts';

const app = createApiApp();
const serverlessHandler = serverless(app);

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  if ('callbackWaitsForEmptyEventLoop' in context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const normalizedEvent: HandlerEvent = {
    ...event,
    path: normalizeNetlifyApiPath(event.path || '/')
  };

  return (await serverlessHandler(normalizedEvent, context)) as HandlerResponse;
};
