'use client';

import React, { useState } from 'react';
import { Input } from './input';

interface JobTitleAutocompleteProps {
  onTitleSelect: (title: string) => void;
  placeholder?: string;
  className?: string;
}

const JobTitleAutocomplete: React.FC<JobTitleAutocompleteProps> = ({
  onTitleSelect,
  placeholder = 'Enter job title...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length === 0) {
      setSuggestions([]);
      setHighlightedIndex(0);
      return;
    }

    try {
      const response = await fetch(`/api/job-titles?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setSuggestions(data);
      setHighlightedIndex(0);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          (prev - 1 + suggestions.length) % suggestions.length
        );
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
        break;
      case 'Tab':
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
        break;
    }
  };

  const handleSelect = (title: string) => {
    setQuery(title);
    setSuggestions([]);
    onTitleSelect(title);
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        className="w-full"
      />
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {suggestions.map((title, index) => (
            <div
              key={title}
              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors
                ${highlightedIndex === index ? 'bg-gray-50' : ''}
              `}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(title)}
            >
              <span className="text-sm">{title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobTitleAutocomplete; 