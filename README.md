# 📜 Covenant

<p align="center">
  <b>"Binding Agreements. Clear Responsibilities."</b><br>
  Task Management & Minutes AI that sublimates meeting minutes from "records" to "contracts"
</p>

---

[🇯🇵 Japanese (日本語)](README.ja.md)

## 📖 Overview

**Covenant** is a task management and meeting minutes AI that transforms meeting records into "contracts".
It clarifies "Who", "By when", and "What to do", completely preventing task leakage due to ambiguous responsibilities.

## ✨ Concept

### 1. Action Driven
Generates minutes focused on "Action Items" rather than just a transcript of what was said.

### 2. ⚡️ Auto-Start Recording
**「話し始めたら、録音開始」**
VAD (Voice Activity Detection) により、会議の開始を自動検知。ボタンを押す手間すら省きます。

### 3. 💾 Auto-Persistence
録音停止と同時に、文字起こし・解析・保存まで一気通貫。Supabaseへ自動保存され、いつでも振り返りが可能です。

### 4. 📊 Action Item Extraction
AIが会議中の発言から「誰が」「いつまでに」「何をするか」を自動で抽出し、タスク化します。

### 5. Assign & Track
AI detects tasks and automatically assigns and sets reminders for the person in charge.

### 6. Binding
Never miss the moment a consensus is reached.

---

## 🛠 Technical Stack

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Input** | **Gemini 2.0 Flash Exp** | Audio-to-Text (Multimodal) |
| **Analysis** | **Gemini 2.0 Flash Exp** | Task Extraction & Summary |
| **Integration** | **Slack / Notion** | Workflow Integration |

---

## 👨‍💻 Developer
**Enludus**
