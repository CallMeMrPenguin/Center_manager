# 🤖 Gemini API Integration — Future TODO

> **Model**: `gemini-2.5-flash` (via Google AI API)
> **Priority**: Ranked from highest to lowest ROI
> **Status**: 📋 Planned

---

## ✅ Pre-requisites (Do This First)

- [ ] Get a Google AI Studio API key from https://aistudio.google.com/apikey
- [ ] Add `GEMINI_API_KEY` to environment variables or a `.env` file (never hardcode)
- [ ] Install `google-generativeai` on the backend: `pip install google-generativeai`
- [ ] Create `backend/services/gemini_service.py` as a shared wrapper for all Gemini calls
- [ ] Add `.env` to `.gitignore` so the key is never committed

### Suggested `gemini_service.py` skeleton:
```python
import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

def ask_gemini(prompt: str, user_text: str) -> str:
    """Send a combined system prompt + user content to Gemini, return raw text response."""
    response = model.generate_content(f"{prompt}\n\n---\nINPUT:\n{user_text}")
    return response.text
```

### `.env` example (add to `.gitignore`!):
```
GEMINI_API_KEY=AIzaSy...
```

---

## 🥇 Feature 1: Test Formatter Auto-Parse Button (HIGHEST PRIORITY)

**What it does**: Adds a "✨ Parse với AI" button in the Trình Tạo Đề Thi tab. User pastes raw test text → Gemini parses it → JSON editor auto-populates.

**Why**: Eliminates the copy-paste-between-apps bottleneck. The schema prompt already exists in `prompts.json` — just wire up the API call.

### Backend Tasks:
- [ ] Add `POST /api/ai/parse-test` route in a new `backend/routers/ai.py`
- [ ] Accept `{ "text": "...", "prompt_id": "tf_2" }` in request body
- [ ] Load the matching prompt from `prompts.json` by `prompt_id`
- [ ] Call `ask_gemini(prompt, user_text)` and return raw JSON string
- [ ] Strip the backtick fences from the response before returning
- [ ] Extract JSON using: `re.search(r'```json\s*([\s\S]*?)\s*```', response)`

### Frontend Tasks:
- [ ] Add a `Sparkles` icon button labeled "Parse với AI" next to the JSON editor in `frontend/src/pages/test-formatter/index.tsx`
- [ ] Show a loading spinner while waiting for the API call
- [ ] On success, populate the JSON editor with the returned JSON
- [ ] On failure, show a toast error message

---

## 🥈 Feature 2: Smart Answer Key Verification & Error Detection

**What it does**: After JSON is loaded in the Test Formatter, a "🔍 Kiểm tra đáp án" button sends all questions to Gemini and returns a report of suspicious or missing answers.

### Backend Tasks:
- [ ] Add `POST /api/ai/verify-answer-key` route
- [ ] Accept the full `{ "data": [...] }` exercise array
- [ ] Build a verification prompt that instructs Gemini to check:
  - Missing `"a"` fields
  - Duplicate answer letters within same block
  - Questions where the correct option text does not match the answer letter
  - `"er"` type questions where the underlined part actually seems grammatically correct
- [ ] Return a structured list: `[{ "q": "5", "issue": "Answer key says B but option B seems correct" }]`

### Frontend Tasks:
- [ ] Add "Kiểm tra đáp án" button in the editor topbar
- [ ] Display issues in a side panel or modal with references to the offending question numbers
- [ ] Allow one-click fix for auto-fillable missing answers

---

## 🥉 Feature 3: Vocabulary Bank Auto-Enrichment

**What it does**: When adding a new word to the vocabulary bank, a "✨ Tự động điền" button calls Gemini to fill in IPA, part of speech, Vietnamese meaning, example sentence, and word family forms.

### Backend Tasks:
- [ ] Add `POST /api/ai/enrich-vocabulary` route
- [ ] Accept `{ "word": "...", "context": "optional sentence" }`
- [ ] Build a prompt asking Gemini to output JSON:
  ```json
  {
    "ipa": "...",
    "pos": "...",
    "meaning": "...",
    "example": "...",
    "word_family": { "noun": "...", "verb": "...", "adj": "...", "adv": "..." }
  }
  ```
- [ ] Return parsed JSON to frontend

### Frontend Tasks:
- [ ] Add "✨ Tự động điền" button in the Add/Edit vocabulary modal in `frontend/src/pages/vocabulary-bank/index.tsx`
- [ ] Pre-fill form fields with returned data (user can still edit before saving)

---

## 4️⃣ Feature 4: Student Performance AI Summary (Reports Page)

**What it does**: On the Reports page, a "📊 Phân tích AI" button generates a plain-Vietnamese written summary of a student's or class's performance trends.

### Backend Tasks:
- [ ] Add `POST /api/ai/performance-summary` route
- [ ] Accept `{ "type": "student" | "class", "data": { ...grades... } }`
- [ ] Build a prompt instructing Gemini to write a 3-5 sentence Vietnamese summary covering: strengths, weaknesses, and recommendations
- [ ] Return `{ "summary": "..." }`

### Frontend Tasks:
- [ ] Add an "AI Phân Tích" button in the student detail view and class report view in `frontend/src/pages/reports.tsx`
- [ ] Display the generated summary in a highlighted card with a copy-to-clipboard button

---

## 5️⃣ Feature 5: Question Bank Auto-Generation

**What it does**: Given a vocabulary list + exercise type + difficulty + grade, Gemini generates ready-to-import questions in question bank format.

### Backend Tasks:
- [ ] Add `POST /api/ai/generate-questions` route
- [ ] Accept `{ "vocab_list": [...], "type": "fb" | "sy" | "an" | "er", "grade": 10, "count": 10 }`
- [ ] Build a generation prompt based on the existing prompt in `prompts.json` under `"qb_1"`
- [ ] Return an array of question objects matching the existing DB schema
- [ ] Optionally auto-insert into DB or return for user review first

### Frontend Tasks:
- [ ] Add "✨ Tạo câu hỏi với AI" button in `frontend/src/pages/question-bank/index.tsx`
- [ ] Show a config modal: vocab input, type selector, grade, question count
- [ ] Show a preview of generated questions before import
- [ ] Allow user to deselect individual questions before bulk inserting

---

## 🏗️ Shared Architecture Notes

| Component | Location | Purpose |
|---|---|---|
| `gemini_service.py` | `backend/services/` | Shared Gemini API wrapper |
| `ai.py` router | `backend/routers/` | All `/api/ai/*` endpoints |
| `GEMINI_API_KEY` | `.env` / environment | API key — never commit to git! |
| Frontend API calls | `frontend/src/api.ts` | Add `ai.*` methods alongside existing ones |

### `api.ts` additions:
```ts
ai: {
  parseTest: (text: string, promptId: string) =>
    fetchJson('/api/ai/parse-test', { method: 'POST', body: JSON.stringify({ text, prompt_id: promptId }) }),
  verifyAnswerKey: (data: any[]) =>
    fetchJson('/api/ai/verify-answer-key', { method: 'POST', body: JSON.stringify({ data }) }),
  enrichVocabulary: (word: string, context?: string) =>
    fetchJson('/api/ai/enrich-vocabulary', { method: 'POST', body: JSON.stringify({ word, context }) }),
  performanceSummary: (type: string, data: any) =>
    fetchJson('/api/ai/performance-summary', { method: 'POST', body: JSON.stringify({ type, data }) }),
  generateQuestions: (params: any) =>
    fetchJson('/api/ai/generate-questions', { method: 'POST', body: JSON.stringify(params) }),
}
```

---

## ⚠️ Important Reminders

- **Never commit `GEMINI_API_KEY`** to git. Add `.env` to `.gitignore`.
- Rate limit: Gemini 2.5 Flash free tier is **15 RPM** (requests per minute). Add proper error handling for `429 Too Many Requests`.
- Always show a **loading state** in the UI while Gemini is processing — it can take 2–10 seconds.
- All Gemini features must be **optional graceful enhancements** — the app must remain fully functional without an API key.
- Consider adding a **Settings page input field** where users can enter their own personal API key (stored in `backend/settings.json`).
