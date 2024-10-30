'use client';

import React, { useState } from 'react';
import { Input } from './input';
import Image from 'next/image';

interface Company {
  name: string;
  domain: string;
  logo: string;
}

interface ClearbitAutocompleteProps {
  onCompanySelect: (company: Company) => void;
  placeholder?: string;
  className?: string;
}

const ClearbitAutocomplete: React.FC<ClearbitAutocompleteProps> = ({
  onCompanySelect,
  placeholder = 'Enter company name...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const queryClearbit = async (searchQuery: string) => {
    if (searchQuery.length === 0) {
      setResults([]);
      setHighlightedIndex(null);
      return;
    }

    try {
      const response = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${searchQuery}`);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    queryClearbit(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev === null ? 0 : (prev + 1) % results.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev === null ? results.length - 1 : (prev - 1 + results.length) % results.length
      );
    } else if (e.key === 'Enter' && highlightedIndex !== null) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    }
  };

  const handleSelect = (company: Company) => {
    setQuery(company.name);
    setResults([]);
    onCompanySelect(company);
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
      {results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {results.map((company, index) => (
            <div
              key={company.domain}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors
                ${highlightedIndex === index ? 'bg-gray-50' : ''}
              `}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(company)}
            >
              <div className="flex-shrink-0">
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={32}
                  height={32}
                  className="rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{company.name}</span>
                <span className="text-xs text-gray-500">{company.domain}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClearbitAutocomplete;