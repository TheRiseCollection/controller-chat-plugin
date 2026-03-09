# controller-chat

Conversational search widget for React—unbranded, configurable, and works **with or without a backend**. Use keyword-only search on your local data, or plug in your own AI/LLM APIs.

**No hardcoded backends, no cloud credentials.** You pass your API URLs (or omit them for keyword-only mode).

## Installation

```bash
npm install controller-chat
```

## Quick Start

### Option 1: Keyword-only (no backend)

Works out of the box—no API setup. Searches your `data` array locally.

```jsx
import { ControllerChat } from 'controller-chat';
import 'controller-chat/styles.css';

<ControllerChat
  context="events"
  data={myEvents}
  onResultClick={(result) => navigate(`/events/${result.id}`)}
  viewAllUrl="/events"
  welcomeMessages={["How can I help find events?"]}
  suggestionChips={[
    { label: 'Upcoming', query: 'upcoming events' },
    { label: 'This Weekend', query: 'this weekend' }
  ]}
/>
```

### Option 2: With your own AI backend

Point the widget at your own API endpoints. Your backend handles RAG, LLM, or whatever you use.

```jsx
<ControllerChat
  context="events"
  data={myEvents}
  controllerApiUrl="/api/controller"   // Your RAG/search API
  chatApiUrl="/api/chat"               // Your streaming chat API
  chatApiEnabled={true}
  onResultClick={(result) => navigate(result.url)}
  getAboutResponse={() => "We organize local car events."}
/>
```

The widget sends requests to the URLs you provide. **You host and control the backend**—nothing is built into the package.

## Peer Dependencies

- `react` >= 17
- `react-dom` >= 17

## API URLs (what you provide)

| URL | Method | Purpose |
|-----|--------|---------|
| `controllerApiUrl` | POST | Fast search—RAG, keyword, or hybrid. Body: `{ context, query, conversationHistory }`. Response: `{ text, results }`. |
| `chatApiUrl` | POST | Streaming chat. Body: `{ message, context, sessionId, conversationHistory }`. Stream: `data: {"type":"token","content":"..."}` then `data: {"type":"done","sources":[...]}`. |

Use relative paths like `/api/controller` and proxy them in your app (Vite, Next.js, etc.) to your backend. The package never knows your infrastructure.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `context` | `'events' \| 'showcase' \| 'products' \| 'software'` | `'events'` | Search context |
| `data` | `Array` | `[]` | Items to search (events, products, etc.) |
| `inline` | `boolean` | `false` | Inline mode (no floating button) |
| `onResultClick` | `(result) => void` | - | Called when user clicks a result |
| `onResultsChange` | `(results) => void` | - | Called when results change |
| `viewAllUrl` | `string` | - | URL for "View all" link |
| `controllerApiUrl` | `string \| null` | `null` | Your RAG/search API URL |
| `chatApiUrl` | `string \| null` | `null` | Your streaming chat API URL |
| `chatApiEnabled` | `boolean` | `true` | Enable chat when chatApiUrl is set |
| `getAboutResponse` | `() => string` | - | Response for "about" queries |
| `aboutPhrases` | `string[]` | - | Phrases that trigger about response |
| `suggestionChips` | `Array<{label, query}>` | - | Quick-action chips |
| `welcomeMessages` | `string[]` | - | Random welcome message |
| `placeholder` | `string` | `'What are you looking for?'` | Input placeholder |
| `emptyStateMessage` | `string` | - | Message when no results |
| `title` | `string` | `'Search'` | Header title |
| `logoUrl` | `string \| null` | `null` | Logo image URL |
| `autocompleteSuggestions` | `string[]` | `[]` | Extra autocomplete hints |

## Programmatic open

```js
window.dispatchEvent(new Event('controller-open'));
```

## Credits

By [THE RISE COLLECTION](https://www.therisecollection.co)

## License

ISC
