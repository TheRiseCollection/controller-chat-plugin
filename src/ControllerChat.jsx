/**
 * Unbranded conversational search widget. Keyword-only or optional AI.
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from './useFocusTrap.js';
import { useChat } from './useChat.js';
import { cleanText } from './cleanText.js';
import { formatControllerText } from './formatControllerText.js';
import { funnyCurseFilter } from './funnyCurseFilter.js';
import './styles/ControllerChat.css';

const MAX_DISPLAYED_EVENTS = 8;
const MAX_DISPLAYED_SHOWCASE = 6;
const MAX_DISPLAYED_MIXED = 10;

const DEFAULT_SUGGESTION_CHIPS = {
  events: [
    { label: 'Upcoming Events', query: 'upcoming events' },
    { label: 'This Weekend', query: 'this weekend' },
  ],
  products: [
    { label: 'What can I buy?', query: 'what products can I buy' },
    { label: 'Browse store', query: 'show me products' },
  ],
  showcase: [
    { label: 'Search', query: 'search' },
  ],
  software: [
    { label: 'controller', query: 'controller' },
    { label: 'Keep On Trucking', query: 'keep on trucking' },
  ],
};

const DEFAULT_WELCOME_MESSAGES = [
  "How can I help? What are you looking for?",
  "Ask me anything—I'll help you find what you need.",
];

const EMPTY_ARRAY = [];

const defaultAvatarSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

export default function ControllerChat({
  context = 'events',
  data = EMPTY_ARRAY,
  inline = false,
  onResultsChange = null,
  onResultClick = null,
  viewAllUrl = null,
  controllerApiUrl = null,
  chatApiUrl = null,
  chatApiEnabled = true,
  getAboutResponse = null,
  aboutPhrases,
  suggestionChips = DEFAULT_SUGGESTION_CHIPS[context] || DEFAULT_SUGGESTION_CHIPS.showcase,
  welcomeMessages = DEFAULT_WELCOME_MESSAGES,
  placeholder = 'What are you looking for?',
  emptyStateMessage = "I couldn't complete that search. Try another query.",
  title = 'Search',
  logoUrl = null,
  autocompleteSuggestions = EMPTY_ARRAY,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const initialIsMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [isOpen, setIsOpen] = useState(inline ? true : false);
  const [isMinimized, setIsMinimized] = useState(inline ? true : false);
  const [isFullscreen, setIsFullscreen] = useState(!inline && !initialIsMobile);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [isTyping, setIsTyping] = useState(false);
  const [showTimeEstimate, setShowTimeEstimate] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const typingStartedAtRef = useRef(0);
  const MIN_TYPING_DISPLAY_MS = 600;

  useFocusTrap(isOpen && !inline && !isMinimized, dialogRef);

  const { runWithFallback, tryFastPath } = useChat({
    context,
    data,
    controllerApiUrl,
    chatApiUrl,
    chatApiEnabled,
    getAboutResponse,
    aboutPhrases,
    emptyStateMessage,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setIsMinimized(false);
      setIsOpen(true);
      setIsFullscreen(true);
      if (inline) {
        requestAnimationFrame(() => {
          const el = document.querySelector('.ctrl-chat-window.ctrl-chat-inline');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    };
    window.addEventListener('controller-open', onOpen);
    return () => window.removeEventListener('controller-open', onOpen);
  }, [inline]);

  useEffect(() => {
    const shouldShowMessage = inline ? !isMinimized : isOpen && !isMinimized;
    if (shouldShowMessage && messages.length === 0) {
      const text = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      setMessages([{ type: 'bot', text, timestamp: new Date() }]);
    }
  }, [isOpen, isMobile, isMinimized, inline, messages.length, welcomeMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isTyping) {
      setShowTimeEstimate(false);
      return;
    }
    const t = setTimeout(() => setShowTimeEstimate(true), 5000);
    return () => clearTimeout(t);
  }, [isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (input.trim().length <= 1 || isTyping) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const trimmed = input.trim().toLowerCase();
    const list = [...autocompleteSuggestions];
    if (context === 'events' && data?.length) {
      data.forEach(e => {
        const name = e.title?.toLowerCase() || '';
        const loc = e.location?.toLowerCase() || '';
        const city = e.city?.toLowerCase() || '';
        if (name.includes(trimmed) && !list.includes(e.title)) list.unshift(e.title);
        if (loc.includes(trimmed) && !list.includes(e.location)) list.push(e.location);
        if (city.includes(trimmed) && !list.includes(e.city)) list.push(e.city);
      });
    } else if (data?.length) {
      data.forEach(item => {
        const name = item.name?.toLowerCase() || '';
        if (name.includes(trimmed) && !list.includes(item.name)) list.unshift(item.name);
        (item.services || []).forEach(s => {
          const sl = (s || '').toLowerCase();
          if (sl.includes(trimmed) && !list.includes(sl)) list.push(sl);
        });
      });
    }
    setSuggestions(list.slice(0, 5));
    setShowSuggestions(list.length > 0 && input.trim().length > 0);
  }, [input, data, context, isTyping, autocompleteSuggestions]);

  const handleSend = async (e, queryText = null) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const raw = (queryText || input).trim();
    if (!raw || isTyping) return;
    const userMessage = funnyCurseFilter(raw);
    setInput('');
    setShowSuggestions(false);
    const userMsg = { type: 'user', text: userMessage, timestamp: new Date() };
    const conversationHistory = messages.map(m => ({ type: m.type, text: m.text }));
    setMessages(prev => [...prev, userMsg]);
    typingStartedAtRef.current = Date.now();
    setIsTyping(true);

    const ensureMinTypingDisplay = () => {
      const elapsed = Date.now() - typingStartedAtRef.current;
      if (elapsed >= MIN_TYPING_DISPLAY_MS) setIsTyping(false);
      else setTimeout(() => setIsTyping(false), MIN_TYPING_DISPLAY_MS - elapsed);
    };

    const fastResult = await tryFastPath({ message: userMessage, conversationHistory });
    if (fastResult) {
      setMessages(prev => [...prev, { type: 'bot', text: fastResult.text, results: fastResult.results || [], timestamp: new Date() }]);
      ensureMinTypingDisplay();
      setCurrentResults(fastResult.results || []);
      if (onResultsChange) onResultsChange(fastResult.results || []);
      if (isMobile && fastResult.results?.length) {
        setTimeout(() => { setIsMinimized(true); setIsFullscreen(false); setIsOpen(true); }, 400);
      }
      return;
    }

    const placeholderBot = { type: 'bot', text: '', results: [], timestamp: new Date() };
    setMessages(prev => [...prev, placeholderBot]);

    const onToken = (_, fullText) => {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.type === 'bot') next[next.length - 1] = { ...last, text: fullText };
        return next;
      });
    };

    const onDone = ({ text, sources }) => {
      const results = (sources || []).map(s => s.raw || s);
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.type === 'bot') next[next.length - 1] = { ...last, text, results };
        return next;
      });
      setCurrentResults(results);
      if (onResultsChange) onResultsChange(results);
    };

    let result;
    try {
      result = await runWithFallback({
        message: userMessage,
        conversationHistory,
        onToken,
        onDone,
        skipFastPath: true,
      });
    } catch {
      result = null;
    }

    if (!result) {
      setMessages(prev => [...prev, { type: 'bot', text: emptyStateMessage, timestamp: new Date() }]);
      setCurrentResults(null);
      if (onResultsChange) onResultsChange(null);
    } else {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.type === 'bot') {
          next[next.length - 1] = { ...last, text: result.text || last.text, results: result.results || last.results || [] };
        } else {
          next.push({ type: 'bot', text: result.text, results: result.results || [], timestamp: new Date() });
        }
        return next;
      });
      setCurrentResults(result.results || []);
      if (onResultsChange) onResultsChange(result.results || []);
    }
    ensureMinTypingDisplay();
    if (isMobile && result?.results?.length) {
      setTimeout(() => { setIsMinimized(true); setIsFullscreen(false); setIsOpen(true); }, 400);
    }
  };

  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result);
      setTimeout(() => { setIsMinimized(true); setIsFullscreen(false); setIsOpen(true); }, 300);
      return;
    }
    const target = result.url || (result.type === 'product' ? viewAllUrl : null);
    if (target) {
      window.location.href = target;
      setTimeout(() => { setIsMinimized(true); setIsFullscreen(false); setIsOpen(true); }, 300);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const AvatarIcon = logoUrl ? (
    <img src={logoUrl} alt="" width="18" height="18" />
  ) : defaultAvatarSvg();

  const maxDisplayed = context === 'events' ? MAX_DISPLAYED_EVENTS : context === 'showcase' ? MAX_DISPLAYED_SHOWCASE : MAX_DISPLAYED_MIXED;
  const resultsSlice = (arr) => (arr || []).slice(0, maxDisplayed);

  const chatWindow = (
    <div
      className={`ctrl-chat-window ${inline ? 'ctrl-chat-inline' : ''} ${isMinimized ? 'ctrl-chat-minimized' : ''} ${isFullscreen ? 'ctrl-chat-fullscreen' : ''}`}
      data-inline={inline ? 'true' : 'false'}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      role={!inline ? 'dialog' : undefined}
      aria-modal={!inline ? 'true' : undefined}
      aria-labelledby={!inline ? 'ctrl-chat-title' : undefined}
      ref={!inline ? dialogRef : undefined}
      style={
        isFullscreen
          ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', maxHeight: '100vh', maxWidth: '100vw', margin: 0, borderRadius: 0, zIndex: 10001 }
          : isMinimized ? { cursor: 'pointer' } : undefined
      }
    >
      <div
        className="ctrl-chat-header"
        onClick={e => {
          e.stopPropagation();
          if (isMinimized) {
            setIsMinimized(false);
            setIsOpen(true);
            setIsFullscreen(true);
          }
        }}
        style={isMinimized ? { cursor: 'pointer' } : {}}
      >
        <div className="ctrl-chat-header-info">
          <div className="ctrl-chat-avatar">
            {logoUrl ? <img src={logoUrl} alt="" /> : defaultAvatarSvg()}
          </div>
          <div>
            <div id="ctrl-chat-title" className="ctrl-chat-title">{title}</div>
            {!isMinimized && (isOpen || inline) && (
              <div className="ctrl-chat-subtitle">
                {currentResults && currentResults.length > 0
                  ? `${currentResults.length} ${currentResults.length === 1 ? 'result' : 'results'} found`
                  : 'Finding matches...'}
              </div>
            )}
          </div>
        </div>
        <div className="ctrl-chat-header-actions" onClick={e => e.stopPropagation()}>
          <button
            className="ctrl-chat-minimize"
            onClick={e => {
              e.stopPropagation();
              const newMinimizedState = !isMinimized;
              setIsMinimized(newMinimizedState);
              setIsOpen(true);
              setIsFullscreen(!newMinimizedState);
              if (!newMinimizedState && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
            }}
            aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMinimized ? <path d="M12 5v14M5 12h14" /> : <path d="M5 12h14" />}
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (isOpen || inline) && (
        <div className="ctrl-chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`ctrl-chat-message ctrl-chat-message-${msg.type}`}>
              {msg.type === 'bot' && (
                <div className="ctrl-chat-avatar-small">{AvatarIcon}</div>
              )}
              <div className="ctrl-chat-message-content ctrl-chat-message-content--bot">
                <p className="ctrl-chat-message-text">
                  {msg.text ? formatControllerText(funnyCurseFilter(msg.text)) : ''}
                </p>
                {msg.results && msg.results.length > 0 && (
                  <>
                    <div className="ctrl-chat-results">
                      {resultsSlice(msg.results).map(result => (
                        <div
                          key={result.id ?? idx}
                          className="ctrl-chat-result-card"
                          onClick={() => handleResultClick(result)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="ctrl-chat-result-info">
                            <div className="ctrl-chat-result-name">
                              {funnyCurseFilter(cleanText(result.title || result.name || ''))}
                            </div>
                            {result.title && (result.displayDate || result.time) && (
                              <div className="ctrl-chat-result-meta">
                                {[result.displayDate, result.time].filter(Boolean).join(' · ')}
                              </div>
                            )}
                            {!result.title && result.type && (
                              <div className="ctrl-chat-result-type">{result.type}</div>
                            )}
                            {result.title && (result.location || result.city) && (
                              <div className="ctrl-chat-result-location">
                                {funnyCurseFilter(cleanText(result.location || result.city))}
                              </div>
                            )}
                            {result.description && (
                              <div className="ctrl-chat-result-desc">
                                {funnyCurseFilter(cleanText(result.description))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {msg.results.length > maxDisplayed && viewAllUrl && (
                      <a href={viewAllUrl} className="ctrl-chat-view-all">
                        View all {msg.results.length} results →
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="ctrl-chat-message ctrl-chat-message-bot ctrl-chat-thinking">
              <div className="ctrl-chat-avatar-small">{AvatarIcon}</div>
              <div className="ctrl-chat-message-content">
                <span className="ctrl-chat-thinking-label">Searching...</span>
                {showTimeEstimate && (
                  <span className="ctrl-chat-time-estimate">Usually responds in 15–30 seconds</span>
                )}
                <div className="ctrl-chat-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {!isMinimized && (isOpen || inline) && (
        <form className="ctrl-chat-input-container" onSubmit={handleSend}>
          <div className="ctrl-chat-suggestions">
            <span className="ctrl-chat-suggestions-label">Try:</span>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="ctrl-chat-suggestion-chip"
                onClick={() => {
                  setInput(chip.query);
                  setTimeout(() => handleSend(null, chip.query), 50);
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="ctrl-chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                if (isMobile && inputRef.current) {
                  requestAnimationFrame(() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
                }
              }}
              placeholder={placeholder}
              className="ctrl-chat-input"
              disabled={isTyping}
              aria-label="Search"
              id="ctrl-chat-input"
            />
            <button type="submit" className="ctrl-chat-send" disabled={!input.trim() || isTyping} aria-label="Send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </form>
      )}

      {!isMinimized && isOpen && showSuggestions && suggestions.length > 0 && (
        <div className="ctrl-chat-autocomplete">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              className="ctrl-chat-autocomplete-item"
              onClick={() => {
                setInput(suggestion);
                setShowSuggestions(false);
                handleSend(null, suggestion);
              }}
            >
              {AvatarIcon}
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const shouldRender = (inline && !isMinimized) || (!inline && isOpen && !isMinimized);
  return (
    <>
      {shouldRender &&
        (isFullscreen && !inline && typeof document !== 'undefined'
          ? createPortal(chatWindow, document.body)
          : chatWindow)}
    </>
  );
}
