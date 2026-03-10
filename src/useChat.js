/**
 * useChat - optional AI (controllerApiUrl, chatApiUrl) or keyword-only.
 */
import { useState, useCallback, useRef } from 'react';

const EMPTY_ARRAY = [];
import { search as controllerSearch } from './controllerSearchService.js';
import { getClientFallbackResponse } from './keywordSearch.js';

async function fetchControllerApi(controllerApiUrl, { context, query, conversationHistory = [] }) {
  if (!controllerApiUrl) return null;
  try {
    const res = await fetch(controllerApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, query: query.trim(), conversationHistory }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.text) {
      return { text: data.text, results: Array.isArray(data.results) ? data.results : [] };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * @param {Object} opts
 * @param {string} opts.context - Any string; passed to your APIs. 'events' gets special client-side handling.
 * @param {Array} opts.data
 * @param {string|null} opts.controllerApiUrl - Optional. If null, no API fast path.
 * @param {string|null} opts.chatApiUrl - Optional. If null, no AI streaming.
 * @param {boolean} [opts.chatApiEnabled=true] - Use chatApiUrl when chatApiUrl is set
 * @param {() => string} [opts.getAboutResponse]
 * @param {string[]} [opts.aboutPhrases]
 */
export function useChat(opts = {}) {
  const {
    context = 'events',
    data = EMPTY_ARRAY,
    controllerApiUrl = null,
    chatApiUrl = null,
    chatApiEnabled = true,
    getAboutResponse,
    aboutPhrases,
    eventsResponseTemplate,
    showcaseResponseTemplate,
    emptyStateMessage,
  } = opts;

  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const isChatApiEnabled = Boolean(chatApiUrl && chatApiEnabled);

  const sendMessage = useCallback(
    async ({ message, conversationHistory = [], onToken, onDone }) => {
      setError(null);
      setStreamingText('');
      setIsStreaming(true);
      if (isChatApiEnabled) {
        try {
          const controller = new AbortController();
          abortRef.current = controller;
          const res = await fetch(chatApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: message.trim(),
              context,
              sessionId: `sess_${Date.now()}`,
              conversationHistory,
            }),
            signal: controller.signal,
          });
          if (!res.ok) {
            if (res.status === 429) throw new Error('Rate limit exceeded. Please wait.');
            if (res.status >= 500) throw new Error('Chat service unavailable.');
            throw new Error(`Request failed: ${res.status}`);
          }
          const reader = res.body?.getReader();
          if (!reader) throw new Error('No response body');
          const decoder = new TextDecoder();
          let buffer = '';
          let fullText = '';
          let finalSources = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.type === 'token' && parsed.content) {
                    fullText += parsed.content;
                    setStreamingText(fullText);
                    onToken?.(parsed.content, fullText);
                  } else if (parsed.type === 'done') {
                    finalSources = parsed.sources || [];
                    onDone?.({ text: fullText, sources: finalSources });
                  } else if (parsed.type === 'error') throw new Error(parsed.error || 'Chat error');
                } catch (parseErr) {
                  if (parseErr instanceof SyntaxError) continue;
                  throw parseErr;
                }
              }
            }
          }
          if (buffer.trim() && buffer.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(buffer.slice(6).trim());
              if (parsed.type === 'done') {
                finalSources = parsed.sources || [];
                onDone?.({ text: fullText, sources: finalSources });
              }
            } catch {}
          }
          setIsStreaming(false);
          abortRef.current = null;
          return { text: fullText, sources: finalSources };
        } catch (err) {
          abortRef.current = null;
          setIsStreaming(false);
          if (err.name === 'AbortError') return null;
          setError(err.message);
          return null;
        }
      }
      setIsStreaming(false);
      return null;
    },
    [context, chatApiUrl, isChatApiEnabled]
  );

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const fallbackOpts = {
    context,
    query: '',
    data,
    getAboutResponse,
    aboutPhrases,
    eventsResponseTemplate,
    showcaseResponseTemplate,
  };

  const runWithFallback = useCallback(
    async ({ message, conversationHistory = [], onToken, onDone, skipFastPath = false }) => {
      if (!skipFastPath && controllerApiUrl) {
        const serverResult = await fetchControllerApi(controllerApiUrl, {
          context,
          query: message,
          conversationHistory: conversationHistory.map(m => ({ type: m.type, text: m.text })),
        });
        if (serverResult) {
          return { text: serverResult.text, results: serverResult.results || [], fromApi: false };
        }
      }
      const apiResult = await sendMessage({ message, conversationHistory, onToken, onDone });
      if (apiResult) {
        const results = (apiResult.sources || []).map(s => s.raw || s);
        return { text: apiResult.text, results, fromApi: true };
      }
      if (data?.length) {
        const fallback = getClientFallbackResponse({ ...fallbackOpts, query: message });
        if (fallback) return { text: fallback.text, results: fallback.results || [], fromApi: false };
      }
      if (data?.length) {
        const searchResult = await controllerSearch({
          context,
          query: message,
          data,
          getAboutResponse,
          aboutPhrases,
          eventsResponseTemplate,
          showcaseResponseTemplate,
        });
        if (searchResult) return { text: searchResult.text, results: searchResult.results || [], fromApi: false };
      }
      const defMsg = emptyStateMessage ?? "I couldn't complete that search. Try another query.";
      return { text: defMsg, results: null, fromApi: false };
    },
    [context, data, controllerApiUrl, sendMessage, getAboutResponse, aboutPhrases, eventsResponseTemplate, showcaseResponseTemplate, emptyStateMessage]
  );

  const tryFastPath = useCallback(
    async ({ message, conversationHistory = [] }) => {
      if (!controllerApiUrl) return null;
      return fetchControllerApi(controllerApiUrl, {
        context,
        query: message,
        conversationHistory: conversationHistory.map(m => ({ type: m.type, text: m.text })),
      });
    },
    [context, controllerApiUrl]
  );

  return {
    sendMessage,
    runWithFallback,
    tryFastPath,
    cancel,
    streamingText,
    isStreaming,
    error,
    isChatApiEnabled: isChatApiEnabled,
  };
}
