'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import Image from 'next/image';

interface Company {
  name: string;
  domain: string;
  logo: string;
}

interface ClearbitAutocompleteProps {
  onCompanySelect: (company: Company) => void;
  onCustomInput: (companyName: string) => void;
  placeholder?: string;
  className?: string;
}

const ImageWithFallback = (props : any) => {
  const { src, fallbackSrc, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);

  return (
      <Image
          {...rest}
          src={imgSrc}
          onError={() => {
              setImgSrc(fallbackSrc);
          }}
      />
  );
};

const ClearbitAutocomplete: React.FC<ClearbitAutocompleteProps> = ({
  onCompanySelect,
  onCustomInput,
  placeholder = 'Enter company name...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (inputRef.current && results.length > 0) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [results.length]);

  const queryClearbit = async (searchQuery: string) => {
    if (searchQuery.length === 0) {
      setResults([]);
      setHighlightedIndex(null);
      setIsOpen(false);
      return;
    }

    try {
      const response = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${searchQuery}`);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setResults(data);
      setIsOpen(true);
    } catch (err) {
      console.error(err);
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    queryClearbit(value);
    onCustomInput(value);
  };

  const handleSelect = (company: Company) => {
    setQuery(company.name);
    setResults([]);
    setIsOpen(false);
    onCompanySelect(company);
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
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setResults([]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        console.log('clicked outside container');
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
        placeholder={placeholder}
        className="w-full"
      />
      
      {isOpen && results.length > 0 && (
        <div 
          className="fixed z-[1000000] w-[calc(100%-3rem)] mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
        >
          {results.map((company, index) => (
            <div
              key={company.domain}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                ${highlightedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''}
              `}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => {
                console.log('company selected:', company);
                handleSelect(company);
              }}
            >
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={company.logo}
                  alt={company.name}
                  width={32}
                  height={32}
                  fallbackSrc="/qm.png"
                  className="rounded-md"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-medium text-sm dark:text-gray-100">{company.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{company.domain}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClearbitAutocomplete;