'use client';

import React, { useState } from 'react';

interface Company {
  name: string;
  domain: string;
  logo: string;
}

interface ClearbitAutocompleteProps {
  onCompanySelect: (company: Company) => void;
  placeholder?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  companiesProps?: React.HTMLAttributes<HTMLDivElement>;
  companyProps?: React.HTMLAttributes<HTMLDivElement>;
  renderResults?: () => React.ReactNode;
}

const ClearbitAutocomplete: React.FC<ClearbitAutocompleteProps> = ({
  onCompanySelect,
  placeholder = 'Company name...',
  inputProps = {},
  companiesProps = { className: 'companies' },
  companyProps = { className: 'company' },
  renderResults
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
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    queryClearbit(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    let currentIndex = highlightedIndex;

    if (e.key === 'ArrowDown') {
      currentIndex = currentIndex === null ? 0 : (currentIndex + 1) % results.length;
      setHighlightedIndex(currentIndex);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex === null || currentIndex === -1) {
        currentIndex = results.length - 1;
      } else {
        currentIndex = currentIndex - 1;
      }
      setHighlightedIndex(currentIndex);
    }

    if (e.key === 'Enter' && currentIndex !== null && currentIndex >= 0) {
      handleSelect(currentIndex);
    }
  };

  const handleSelect = (index: number) => {
    const company = results[index];
    setQuery(company.name);
    setResults([]);
    onCompanySelect(company);
  };

  const defaultRenderResults = () => {
    return results.map((result, index) => {
      const companyClassName = companyProps.className;
      return (
        <div
          key={index}
          className={`${companyClassName} ${highlightedIndex === index ? 'selected' : ''}`}
          onMouseEnter={() => setHighlightedIndex(index)}
          onMouseDown={() => handleSelect(index)}
        >
          <img src={result.logo} alt={result.name} className="h-6 w-6" />
          <span className={`${companyClassName}-name`}>{result.name}</span>
          <span className={`${companyClassName}-domain`}>{result.domain}</span>
        </div>
      );
    });
  };

  return (
    <div className="relative w-full">
      <input
        {...inputProps}
        type="text"
        value={query}
        autoComplete="off"
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {results.length > 0 && (
        <div {...companiesProps} className="absolute w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {renderResults ? renderResults() : defaultRenderResults()}
        </div>
      )}
    </div>
  );
};

export default ClearbitAutocomplete;