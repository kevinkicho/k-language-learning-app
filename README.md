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

# K Language Learning App

A modern, AI-powered language learning application built with Next.js, featuring Gemini AI integration, audio pronunciation, interactive quizzes, and sentence practice.

## 🌟 Features

### 🤖 AI-Powered Learning
- **Gemini AI Integration**: Uses Google's Gemini AI for natural language processing and quiz generation
- **Natural Language Commands**: Generate quizzes using natural language like "phrases to use at dinner" or "travel vocabulary"
- **Smart Quiz Generation**: AI automatically creates relevant Spanish sentences and phrases based on your requests
- **Context-Aware Responses**: The AI intelligently interprets user requests and provides appropriate content
- **Grouped Quiz Review**: Organize AI-generated content into descriptive groups for focused practice

### 🎯 Interactive Learning
- **Sentence Practice**: Add and practice Spanish sentences with audio pronunciation
- **Word Scramble Quizzes**: Interactive word arrangement exercises
- **Multi-Sentence Quizzes**: Practice with multiple sentences at once
- **Grouped Quiz Review**: Review specific topics in shuffled order
- **Progress Tracking**: Monitor your learning progress over time

### 🔊 Audio Features
- **Text-to-Speech**: Google Cloud TTS integration for authentic pronunciation
- **Audio Caching**: Efficient audio file management and caching
- **Playback Controls**: Easy audio playback for learning

### 🗄️ Data Management
- **SQLite Database**: Local data storage with Drizzle ORM
- **Translation Caching**: Efficient translation storage
- **Audio Caching**: Optimized audio file management
- **Quiz Grouping**: Organize content by topics and themes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud credentials (for translation and TTS)
- Gemini AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kevinkicho/k-language-learning-app.git
   cd k-language-learning-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with the following variables:
   
   ```env
   # Google Cloud Gemini AI API Key (Required)
   # Get your API key from: https://makersuite.google.com/app/apikey
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   
   # Google Cloud Translation API (Required for audio generation)
   GOOGLE_CLOUD_PROJECT_ID=your_project_id
   GOOGLE_CLOUD_PRIVATE_KEY_ID=your_private_key_id
   GOOGLE_CLOUD_PRIVATE_KEY=your_private_key
   GOOGLE_CLOUD_CLIENT_EMAIL=your_client_email
   GOOGLE_CLOUD_CLIENT_ID=your_client_id
   GOOGLE_CLOUD_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   GOOGLE_CLOUD_TOKEN_URI=https://oauth2.googleapis.com/token
   GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   GOOGLE_CLOUD_CLIENT_X509_CERT_URL=your_client_x509_cert_url
   ```

4. **Set up Google Cloud APIs**
   
   Enable the following APIs in your Google Cloud Console:
   - Gemini API
   - Cloud Translation API
   - Cloud Text-to-Speech API

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 🤖 AI Features Guide

### Natural Language Commands

The AI understands various natural language commands for quiz generation:

#### Basic Commands
- `"phrases to use at dinner"`
- `"travel vocabulary"`
- `"business Spanish"`
- `"shopping phrases"`

#### Specific Requests
- `"how to order food in Spanish"`
- `"useful expressions for the airport"`
- `"greetings and introductions"`
- `"asking for directions"`

#### Context-Aware Interpretation
The AI intelligently interprets your requests:
- **"dinner"** → restaurant/dining phrases
- **"travel"** → airport, hotel, transportation phrases
- **"business"** → meetings, presentations, networking
- **"shopping"** → stores, bargaining, sizes, colors

### AI Configuration

The app uses Google's Gemini AI for natural language processing and content generation. No local model downloads are required.

## 📁 Project Structure

```
k-language-learning-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── ai/            # AI-related endpoints
│   │   ├── audio/         # Audio processing
│   │   ├── quiz/          # Quiz endpoints
│   │   └── sentences/     # Sentence management
│   ├── drizzle/           # Database schema and migrations
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── quiz/             # Quiz-related components
│   └── AICommandInterface.tsx  # AI command interface
├── lib/                   # Utility libraries
│   ├── gemini-service.ts  # Gemini AI service implementation
│   ├── cache-utils.ts     # Caching utilities
│   ├── database-drizzle.ts # Database connection
│   ├── google-services.ts # Google Cloud services
│   └── types.ts           # TypeScript type definitions
├── public/                # Static assets
└── scripts/               # Utility scripts
    └── list-gemini-models.js  # Gemini models listing script
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

### Database Management

The app uses SQLite with Drizzle ORM:

```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Open database studio
npm run db:studio
```

## 🎯 Usage Examples

### Creating AI-Generated Quizzes

1. **Open the AI Command Interface** at the top of the main page
2. **Type a natural language command** like:
   - `"phrases to use at dinner"`
   - `"travel vocabulary"`
   - `"business Spanish"`
   - `"shopping phrases"`
3. **Click Generate** to create the quiz
4. **Review and start** the generated quiz

### Managing Sentences

1. **Add sentences** using the input form
2. **Select sentences** for custom quizzes
3. **Use quick actions** for random or selected quizzes
4. **Delete sentences** as needed

### Audio Features

1. **Automatic audio generation** when adding sentences
2. **Click play button** to hear pronunciation
3. **Audio caching** for faster playback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Cloud for translation and TTS services
- Google for the Gemini AI
- Next.js team for the excellent framework
- Drizzle team for the ORM
- The open-source community for various dependencies

---

**Note**: The AI features require a Gemini AI API key. Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

 