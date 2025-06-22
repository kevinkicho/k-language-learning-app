# Spanish Language Learning App

A modern, interactive Spanish language learning application built with Next.js 15, React 18, and Google Cloud APIs. Learn Spanish through English sentences with instant translations, audio pronunciation, and word-shuffling quizzes.

## ✨ Features

- **📝 Sentence Management**: Add English sentences that get automatically translated to Spanish
- **🔊 Audio Pronunciation**: Google Text-to-Speech generates native Spanish pronunciation
- **🌐 Professional Translation**: Google Translate API provides accurate Spanish translations
- **🧩 Interactive Quizzes**: Word-shuffling exercises to test sentence reconstruction
- **💾 Persistent Storage**: SQLite database stores all sentences, translations, and audio files
- **📊 Progress Tracking**: Quiz scores and performance analytics
- **🎨 Modern UI**: Beautiful, responsive interface with Tailwind CSS
- **🔒 Type Safety**: Full TypeScript support throughout the application
- **🔄 Comprehensive Caching**: Multi-layer caching system to minimize server calls

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud account with Translation and Text-to-Speech APIs enabled

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Place your Google Cloud credentials:**
   - Copy your `translate032625-47af80242d72.json` file to the project root
   - Ensure the service account has access to:
     - Cloud Translation API
     - Cloud Text-to-Speech API

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Modular Design

The app is built with scalability in mind using a modular architecture:

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── sentences/     # Sentence CRUD operations
│   │   ├── quiz/          # Quiz attempt tracking
│   │   └── audio/         # Audio file serving
│   ├── globals.scss       # Global variables, mixins, and base styles
│   ├── components.scss    # Component-specific styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # Reusable React components
│   ├── SentenceInput.tsx  # Sentence input form
│   ├── SentenceList.tsx   # Sentence display with audio
│   ├── AudioPlayer.tsx    # Audio playback component
│   ├── QuizModal.tsx      # Interactive quiz modal
│   ├── MultiQuizModal.tsx # Multi-sentence quiz modal
│   └── SentenceSelectionModal.tsx # Sentence selection modal
├── lib/                   # Core business logic
│   ├── database.ts        # Database operations
│   ├── cache-utils.ts     # Caching utilities
│   ├── google-services.ts # Google Cloud API integration
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
└── public/audio/          # Generated audio files
```

### Technology Stack

- **Frontend**: Next.js 15, React 18.3, TypeScript 5.3
- **Styling**: SCSS with Tailwind CSS 3.4 and custom design system
- **Database**: SQLite with native Node.js driver
- **APIs**: Google Cloud Translate & Text-to-Speech
- **Build Tools**: ESLint, PostCSS, Autoprefixer, Sass

## 📖 How It Works

### 1. Sentence Processing Pipeline

1. **Input**: User types English sentence
2. **Translation**: Google Translate API converts to Spanish
3. **Audio Generation**: Google Text-to-Speech creates pronunciation
4. **Storage**: All data saved to SQLite database
5. **Display**: Sentence appears in list with translation and audio

### 2. Quiz System

1. **Selection**: User chooses a sentence to quiz
2. **Shuffling**: Words are randomly reordered
3. **Interaction**: User clicks words in correct sequence
4. **Validation**: System checks word order and position
5. **Scoring**: Percentage score calculated and saved

### 3. Audio Integration

- **Generation**: Spanish text converted to MP3 audio
- **Storage**: Audio files saved in `public/audio/` directory
- **Playback**: Custom audio player with play/pause controls
- **Caching**: Audio files persist between sessions

## 🔧 API Endpoints

### Sentences
- `GET /api/sentences` - Retrieve all sentences
- `POST /api/sentences` - Add new sentence with translation/audio
- `GET /api/sentences/[id]` - Get specific sentence
- `DELETE /api/sentences/[id]` - Delete sentence

### Quiz
- `POST /api/quiz` - Save quiz attempt with score

### Audio
- `GET /api/audio/[id]` - Serve generated audio files

## 🗄️ Database Schema

### Sentences Table
```sql
CREATE TABLE sentences (
  id TEXT PRIMARY KEY,
  english_sentence TEXT NOT NULL,
  spanish_translation TEXT,
  audio_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Quiz Attempts Table
```sql
CREATE TABLE quiz_attempts (
  id TEXT PRIMARY KEY,
  sentence_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_words INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (sentence_id) REFERENCES sentences (id)
);
```

## 🎯 Usage Guide

### Adding Sentences
1. Type an English sentence in the input field
2. Click "Add Sentence"
3. Wait for translation and audio generation
4. Sentence appears in your list with Spanish translation and pronunciation

### Taking Quizzes
1. Click "Start Quiz" on any sentence
2. View the original sentence and Spanish translation
3. Click words in the correct order to reconstruct the sentence
4. Submit your answer to see your score
5. Try again or close the quiz

### Audio Features
- Click the play button to hear Spanish pronunciation
- Audio automatically stops when finished
- Multiple audio players can be controlled independently

## 🔒 Security & Best Practices

- **Environment Variables**: Google Cloud credentials stored securely
- **Input Validation**: All user inputs validated and sanitized
- **Error Handling**: Graceful fallbacks for API failures
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Database Security**: Parameterized queries prevent SQL injection

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Other Platforms
- **Netlify**: Compatible with Next.js static export
- **Railway**: Full-stack deployment with database
- **Docker**: Containerized deployment available

## 🔮 Future Enhancements

- **User Authentication**: Personal progress tracking
- **Spaced Repetition**: Intelligent review scheduling
- **Multiple Languages**: Support for other target languages
- **Advanced Quizzes**: Multiple choice, fill-in-the-blank
- **Progress Analytics**: Detailed learning insights
- **Offline Mode**: Cached content for offline learning
- **Mobile App**: React Native companion app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and personal projects.

## 🆘 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Google Cloud API credentials are correct
3. Ensure all dependencies are installed
4. Check that the audio directory is writable

## 🔄 Comprehensive Caching

The app implements a comprehensive caching strategy to minimize server calls and improve performance:

### 1. Server-Side Database Caching
- **Translation Cache**: Stores English-to-Spanish translations in the database
- **Word Audio Cache**: Caches individual word pronunciations to avoid regenerating audio
- **Automatic Cache Checking**: All API routes check local cache before making external API calls

### 2. Client-Side Caching
- **Memory Cache**: Fast in-memory storage for frequently accessed data
- **localStorage Persistence**: Persistent cache that survives browser sessions
- **Smart Cache Invalidation**: Automatically invalidates related cache entries when data changes

### 3. Cache Layers
```
Client Request → Memory Cache → localStorage → Server Cache → External APIs
```

### 4. Cache Benefits
- **Reduced API Costs**: Minimizes Google Translate and Text-to-Speech API calls
- **Faster Performance**: Instant responses for cached data
- **Offline Capability**: Basic functionality works with cached data
- **Bandwidth Savings**: Reduces data transfer for repeated requests

## 🔧 API Endpoints

### Sentences
- `GET /api/sentences` - Get all sentences (with caching)
- `POST /api/sentences` - Add new sentence (checks translation cache first)
- `DELETE /api/sentences/[id]` - Delete sentence
- `POST /api/audio/word` - Generate word audio (with caching)
- `POST /api/quiz` - Save quiz attempt

### Audio
- `GET /api/audio/[id]` - Serve generated audio files

## 🗄️ Database Schema

### Sentences Table
```sql
CREATE TABLE sentences (
  id TEXT PRIMARY KEY,
  english_sentence TEXT NOT NULL,
  spanish_translation TEXT,
  audio_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Quiz Attempts Table
```sql
CREATE TABLE quiz_attempts (
  id TEXT PRIMARY KEY,
  sentence_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_words INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (sentence_id) REFERENCES sentences (id)
);
```

### Word Audio Cache Table
```sql
CREATE TABLE word_audio_cache (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Translation Cache Table
```sql
CREATE TABLE translation_cache (
  id TEXT PRIMARY KEY,
  english_sentence TEXT NOT NULL,
  spanish_translation TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 🎯 Usage Guide

### Adding Sentences
1. Type an English sentence in the input field
2. Click "Add Sentence"
3. Wait for translation and audio generation
4. Sentence appears in your list with Spanish translation and pronunciation

### Taking Quizzes
1. Click "Start Quiz" on any sentence
2. View the original sentence and Spanish translation
3. Click words in the correct order to reconstruct the sentence
4. Submit your answer to see your score
5. Try again or close the quiz

### Audio Features
- Click the play button to hear Spanish pronunciation
- Audio automatically stops when finished
- Multiple audio players can be controlled independently

## 🔒 Security & Best Practices

- **Environment Variables**: Google Cloud credentials stored securely
- **Input Validation**: All user inputs validated and sanitized
- **Error Handling**: Graceful fallbacks for API failures
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Database Security**: Parameterized queries prevent SQL injection

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Other Platforms
- **Netlify**: Compatible with Next.js static export
- **Railway**: Full-stack deployment with database
- **Docker**: Containerized deployment available

## 🔮 Future Enhancements

- **User Authentication**: Personal progress tracking
- **Spaced Repetition**: Intelligent review scheduling
- **Multiple Languages**: Support for other target languages
- **Advanced Quizzes**: Multiple choice, fill-in-the-blank
- **Progress Analytics**: Detailed learning insights
- **Offline Mode**: Cached content for offline learning
- **Mobile App**: React Native companion app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and personal projects.

## 🆘 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Google Cloud API credentials are correct
3. Ensure all dependencies are installed
4. Check that the audio directory is writable

---

 