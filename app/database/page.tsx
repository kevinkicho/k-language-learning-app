'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface DatabaseStats {
  sentences: number;
  quizAttempts: number;
  wordAudioCache: number;
  translationCache: number;
}

interface TableData {
  sentences: any[];
  quizAttempts: any[];
  wordAudioCache: any[];
  translationCache: any[];
}

export default function DatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'sentences' | 'quiz' | 'audio' | 'translations'>('stats');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/database');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setStats(result.stats);
      setTableData(result.data);
    } catch (error) {
      console.error('Error loading database data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load database data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">
          <h4 className="alert-heading">⚠️ Error Loading Database</h4>
          <p>{error}</p>
          <hr />
          <Button
            onClick={loadDatabaseData}
            variant="danger"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <header className="text-center mb-4">
        <h1 className="display-4">Database Viewer</h1>
        <p className="lead">
          View and manage your language learning data.
        </p>
      </header>

      <div className="card mb-4">
        <div className="card-header">
            Database Info
        </div>
        <div className="card-body">
            <p className="card-text">
                <strong>Database:</strong> language_learning.db
            </p>
            <p className="card-text">
                Single SQLite database containing all application data.
            </p>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {[
          { id: 'stats', label: 'Overview' },
          { id: 'sentences', label: 'Sentences', count: stats?.sentences },
          { id: 'quiz', label: 'Quiz Attempts', count: stats?.quizAttempts },
          { id: 'audio', label: 'Audio Cache', count: stats?.wordAudioCache },
          { id: 'translations', label: 'Translation Cache', count: stats?.translationCache },
        ].map((tab) => (
            <li className="nav-item" key={tab.id}>
                <button
                    className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id as any)}
                >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="badge bg-secondary ms-2">
                        {tab.count}
                      </span>
                    )}
                </button>
            </li>
        ))}
      </ul>

        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'stats' && stats && (
            <div className="row">
                <div className="col-md-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Sentences</h5>
                            <p className="card-text display-6">{stats.sentences}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Quiz Attempts</h5>
                            <p className="card-text display-6">{stats.quizAttempts}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Audio Cache</h5>
                            <p className="card-text display-6">{stats.wordAudioCache}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-3">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Translation Cache</h5>
                            <p className="card-text display-6">{stats.translationCache}</p>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Sentences Tab */}
          {activeTab === 'sentences' && tableData && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Sentences</h3>
                <Button onClick={loadDatabaseData} variant="primary" size="sm">
                  Refresh
                </Button>
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>English</th>
                      <th>Spanish</th>
                      <th>Audio</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.sentences.map((sentence) => (
                      <tr key={sentence.id}>
                        <td title={sentence.id}><small className="font-monospace">{sentence.id.substring(0, 8)}...</small></td>
                        <td>{sentence.englishSentence}</td>
                        <td>{sentence.spanishTranslation || '-'}</td>
                        <td>{sentence.audioPath ? '✅' : '❌'}</td>
                        <td>{formatDate(sentence.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quiz Attempts Tab */}
          {activeTab === 'quiz' && tableData && (
            <div>
                <h3 className="mb-3">Quiz Attempts</h3>
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Sentence ID</th>
                                <th>Score</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.quizAttempts.map((attempt) => (
                            <tr key={attempt.id}>
                                <td title={attempt.sentenceId}><small className="font-monospace">{attempt.sentenceId.substring(0, 8)}...</small></td>
                                <td>{attempt.score}%</td>
                                <td>{formatDate(attempt.timestamp)}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}
          
          {/* Audio Cache Tab */}
          {activeTab === 'audio' && tableData && (
             <div>
                <h3 className="mb-3">Audio Cache</h3>
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Word</th>
                                <th>Language</th>
                                <th>Path</th>
                                <th>Size</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.wordAudioCache.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.word}</td>
                                    <td>{item.language}</td>
                                    <td title={item.filePath}><small className="font-monospace">{item.filePath ? item.filePath.split('\\').pop() : '-'}</small></td>
                                    <td>{formatFileSize(item.fileSizeBytes)}</td>
                                    <td>{formatDate(item.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}
          
          {/* Translation Cache Tab */}
          {activeTab === 'translations' && tableData && (
             <div>
                <h3 className="mb-3">Translation Cache</h3>
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Source Text</th>
                                <th>Spanish Text</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.translationCache.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.sourceText}</td>
                                    <td>{item.spanishText}</td>
                                    <td>{formatDate(item.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}
        </div>
    </div>
  );
} 