'use client';

import { useState } from 'react';
import Button from './ui/Button';

interface SentenceInputProps {
  onAddSentence: (englishSentence: string) => void;
  isPending: boolean;
}

export default function SentenceInput({ onAddSentence, isPending }: SentenceInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onAddSentence(inputValue);
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="d-grid gap-2">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type an English sentence..."
        className="form-control"
        rows={3}
        disabled={isPending}
      />
      <Button type="submit" loading={isPending} disabled={!inputValue.trim()}>
        Add Sentence
      </Button>
    </form>
  );
} 