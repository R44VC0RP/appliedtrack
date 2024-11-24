'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from './input';
import { jobTitles } from '@/data/jobTitlesOptemized.js';
import stringSimilarity from 'string-similarity';

interface JobTitleAutocompleteProps {
  onTitleSelect: (title: string) => void;
  placeholder?: string;
  className?: string;
}

// Convert string to camel case
const toCamelCase = (str: string): string => {
  return str
    .split(' ')
    .map((word, index) => 
      index === 0 
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

const JobTitleAutocomplete: React.FC<JobTitleAutocompleteProps> = ({
  onTitleSelect,
  placeholder = 'Enter job title...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string }>>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Memoize the jobTitlesArray conversion and processing
  const processedJobTitles = useMemo(() => {
    const titles = Object.values(jobTitles).flat();
    const seen = new Set<string>();
    return titles
      .filter(title => {
        const normalized = title.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .map(title => ({
        id: title.toLowerCase(),
        title: toCamelCase(title)
      }));
  }, []);

  const getSuggestions = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setHighlightedIndex(null);
      setIsOpen(false);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    
    // First try prefix matching (fast)
    const prefixMatches = processedJobTitles
      .sort((a, b) => a.title.length - b.title.length)
      .filter(item => item.title.toLowerCase().startsWith(lowerQuery))
      .slice(0, 5);

    if (prefixMatches.length > 0) {
      setSuggestions(prefixMatches);
      setHighlightedIndex(0);
      setIsOpen(true);
      return;
    }

    // If no prefix matches, try contains matching
    const containsMatches = processedJobTitles
      .filter(item => item.title.toLowerCase().includes(lowerQuery))
      .slice(0, 5);

    setSuggestions(containsMatches);
    setHighlightedIndex(0);
    setIsOpen(containsMatches.length > 0);
  };

  useEffect(() => {
    // Clear any existing timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timer
    debounceRef.current = setTimeout(() => {
      if (document.activeElement === inputRef.current) {
        getSuggestions(query);
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSelect = (item: { id: string; title: string }) => {
    // Clear any pending debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setQuery(item.title);
    setSuggestions([]);
    setIsOpen(false);
    onTitleSelect(item.title);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev === null ? 0 : (prev + 1) % suggestions.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev === null ? suggestions.length - 1 : (prev - 1 + suggestions.length) % suggestions.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex !== null) {
        handleSelect(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Tab') {
      if (suggestions.length > 0) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex ?? 0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSuggestions([]);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.trim()) {
            getSuggestions(query);
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
          }, 200);
        }}
        placeholder={placeholder}
        autoFocus
        className="w-full"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="fixed z-[1000000] w-[calc(100%-3rem)] mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
          {suggestions.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                ${highlightedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''}
              `}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(item)}
            >
              <div className="flex flex-col text-left">
                <span className="font-medium text-sm dark:text-gray-100">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobTitleAutocomplete;