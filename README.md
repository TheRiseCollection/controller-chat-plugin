# controller-chat

Conversational search widget for React—unbranded, configurable, and works **with or without a backend**. Use keyword-only search on your local data, or plug in your own AI/LLM (e.g. Llama 3 via Ollama) for natural-language answers.

**No hardcoded backends, no cloud credentials.** You pass your API URLs (or omit them for keyword-only mode).

[![npm](https://img.shields.io/npm/v/controller-chat.svg)](https://www.npmjs.com/package/controller-chat)
[![downloads](https://img.shields.io/npm/dw/controller-chat)](https://www.npmjs.com/package/controller-chat)

## Demo

![controller-chat on redlightcam—homepage and search assistant](https://github.com/TheRiseCollection/controller-chat-plugin/blob/main/demo.png?raw=true)

*[redlightcam](https://redlightcam.co) homepage with the controller search assistant—natural language search over events, showcase, and more.*

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

---

## Llama 3 & Lightweight LLMs

controller-chat pairs well with **Ollama** and **Llama 3** for local, privacy-friendly AI search—no API keys, no cloud calls.

### Why lightweight LLMs?

| Benefit | Description |
|--------|-------------|
| **Privacy** | Data stays on your machine or your server |
| **Cost** | No per-token API fees |
| **Speed** | Smaller models (1B–8B) run on laptops and small VMs |
| **Offline** | Works without internet once models are downloaded |

### Installing Ollama & Llama 3

1. **Install Ollama** (Mac, Windows, Linux): [ollama.com](https://ollama.com)

   ```bash
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull Llama 3** (choose one for your hardware):

   ```bash
   ollama pull llama3.2:1b    # ~1.3GB - fastest, runs on almost anything
   ollama pull llama3.2:3b   # ~2GB - good balance
   ollama pull llama3.2      # ~2GB - 3B instruction-tuned (default)
   ollama pull llama3       # ~4.7GB - 8B, more capable
   ```

3. **Run Ollama** (if not running as a service):

   ```bash
   ollama serve
   ```

4. **Point your backend** at `http://localhost:11434` (or your Ollama host). Your backend calls the Ollama API; controller-chat calls your backend.

### Model size guide

| Model | Size | Use case |
|-------|------|----------|
| `llama3.2:1b` | ~1.3GB | Embedded, Raspberry Pi, low-spec |
| `llama3.2:3b` | ~2GB | Laptops, small VMs, fast responses |
| `llama3` (8B) | ~4.7GB | Higher quality, needs 8GB+ RAM |

---

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

## Examples & Resources

- **Live demo**: [redlightcam.co](https://redlightcam.co) (Events & Showcase pages)
- **Homepage**: [therisecollection.co/portfolio/controller](https://www.therisecollection.co/portfolio/controller)
- **Ollama**: [ollama.com](https://ollama.com)
- **Llama models**: [ollama.com/library/llama3.2](https://ollama.com/library/llama3.2)

## Credits

By [THE RISE COLLECTION](https://www.therisecollection.co)

## License

ISC
