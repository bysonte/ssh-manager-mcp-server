import { formatJSONResponse, truncateOutput } from './config.js';

function parseTextPayload(text) {
  if (typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

function hasErrorMarker(result) {
  if (!result || result.isError === true || !Array.isArray(result.content)) {
    return result?.isError === true;
  }

  return result.content.some((item) => {
    if (item?.type !== 'text') return false;
    const text = item.text || '';
    const payload = parseTextPayload(text);
    return payload?.success === false || Boolean(payload?.error) || text.trim().startsWith('❌');
  });
}

export function normalizeToolResult(result) {
  if (!result || typeof result !== 'object') {
    return result;
  }

  if (hasErrorMarker(result)) {
    return { ...result, isError: true };
  }

  return result;
}

export function toolErrorResponse(error, extra = {}) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: 'text',
        text: formatJSONResponse({
          success: false,
          error: truncateOutput(message, 1000),
          ...extra,
        }),
      },
    ],
    isError: true,
  };
}
