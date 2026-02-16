"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { createPortal } from "react-dom";

type SuggestionResponse = {
  clients: string[];
  designations: string[];
};

type SuggestiveSearchInputProps = {
  value: string;
  onChange: (next: string) => void;
  onSearch: () => void;
  placeholder: string;
  inputClassName?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  suggestionScope?: "all" | "clients" | "designations";
  strict?: boolean;
  onInvalidSelection?: (value: string) => void;
};

const fetchSuggestions = async (): Promise<SuggestionResponse> => {
  const response = await fetch("/api/v1/search_suggestions");
  if (!response.ok) {
    throw new Error("Failed to load search suggestions.");
  }
  return response.json();
};

const uniqueMerge = (values: string[]) => {
  const map = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!map.has(key)) {
      map.set(key, trimmed);
    }
  });
  return Array.from(map.values());
};

export default function SuggestiveSearchInput({
  value,
  onChange,
  onSearch,
  placeholder,
  inputClassName = "w-full px-4 py-2.5 pr-10 rounded-full bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 shadow-md hover:shadow-lg",
  buttonClassName = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-900 transition-colors duration-200",
  dropdownClassName = "absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg text-xs text-slate-700 max-h-48 overflow-auto",
  suggestionScope = "all",
  strict = false,
  onInvalidSelection,
}: SuggestiveSearchInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestionsData } = useQuery({
    queryKey: ["searchSuggestions"],
    queryFn: fetchSuggestions,
    staleTime: 5 * 60 * 1000,
  });

  const allSuggestions = useMemo(() => {
    if (suggestionScope === "clients") {
      return uniqueMerge([...(suggestionsData?.clients ?? [])]);
    }
    if (suggestionScope === "designations") {
      return uniqueMerge([...(suggestionsData?.designations ?? [])]);
    }
    return uniqueMerge([
      ...(suggestionsData?.clients ?? []),
      ...(suggestionsData?.designations ?? []),
    ]);
  }, [suggestionScope, suggestionsData?.clients, suggestionsData?.designations]);

  const normalizedSuggestions = useMemo(() => {
    const map = new Map<string, string>();
    allSuggestions.forEach((item) => {
      map.set(item.toLowerCase(), item);
    });
    return map;
  }, [allSuggestions]);

  const filteredSuggestions = useMemo(() => {
    const input = value.trim().toLowerCase();
    if (!input) return [];
    return allSuggestions.filter((item) => item.toLowerCase().startsWith(input)).slice(0, 8);
  }, [value, allSuggestions]);

  const isValidSelection = (input: string) => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return false;
    return normalizedSuggestions.has(trimmed);
  };

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const updateDropdownPosition = () => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    updateDropdownPosition();
    const handleUpdate = () => updateDropdownPosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [showSuggestions, filteredSuggestions.length]);

  const handleSelect = (item: string) => {
    const normalized = normalizedSuggestions.get(item.toLowerCase()) ?? item;
    onChange(normalized);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleSearch = () => {
    if (!strict) {
      onSearch();
      return;
    }
    if (isValidSelection(value)) {
      onSearch();
      return;
    }
    if (value.trim()) {
      onInvalidSelection?.(value);
    }
    setShowSuggestions(true);
    setActiveIndex(-1);
  };

  return (
    <div className="relative">
      <input
        type="text"
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setShowSuggestions(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 150);
          if (!strict) return;
          if (value.trim() && !isValidSelection(value)) {
            onInvalidSelection?.(value);
            onChange("");
          }
        }}
        className={inputClassName}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && filteredSuggestions.length) {
            event.preventDefault();
            setShowSuggestions(true);
            setActiveIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
            return;
          }
          if (event.key === "ArrowUp" && filteredSuggestions.length) {
            event.preventDefault();
            setShowSuggestions(true);
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
            return;
          }
          if (event.key === "Enter") {
            if (showSuggestions && activeIndex >= 0) {
              event.preventDefault();
              handleSelect(filteredSuggestions[activeIndex]);
              return;
            }
            handleSearch();
          }
          if (event.key === "Escape") {
            setShowSuggestions(false);
            setActiveIndex(-1);
          }
        }}
      />
      <button onClick={handleSearch} className={buttonClassName} aria-label="Search">
        <Search className="h-4 w-4" />
      </button>
      {(() => {
        if (!showSuggestions || filteredSuggestions.length === 0) return null;
        const dropdownStyle: CSSProperties | undefined = portalTarget
          ? {
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999,
            }
          : undefined;
        const dropdown = (
          <ul className={dropdownClassName} style={dropdownStyle}>
            {filteredSuggestions.map((item, index) => (
              <li
                key={`${item}-${index}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(item);
                }}
                className={`px-3 py-2 cursor-pointer transition ${
                  index === activeIndex ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50"
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        );
        return portalTarget ? createPortal(dropdown, portalTarget) : dropdown;
      })()}
    </div>
  );
}
