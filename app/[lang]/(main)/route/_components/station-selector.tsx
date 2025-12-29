/**
 * Station Selector Component
 *
 * A bottom sheet component for searching and selecting metro stations.
 * Features:
 * - Full-text search across station names
 * - Shows station lines with colored badges
 * - RTL support for Persian interface
 *
 * @module app/[lang]/(main)/route/_components/station-selector
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search } from 'lucide-react';
import stationsData from '@/data/stations.json';
import linesData from '@/data/lines.json';
import type { StationsMap, LinesMap } from '@/types/metro';

// Type assertions for JSON data
const stations = stationsData as StationsMap;
const lines = linesData as LinesMap;

/**
 * Station Selector Props
 */
interface StationSelectorProps {
  /** Trigger element that opens the bottom sheet */
  trigger: React.ReactNode;
  /** Title shown in the bottom sheet header */
  title: string;
  /** Description text below the title */
  description: string;
  /** Placeholder text for search input */
  placeholder: string;
  /** Callback when a station is selected */
  onSelect: (stationId: string) => void;
  /** Translation dictionary */
  dict: {
    no_stations_found: string;
  };
  /** Controlled open state (optional) */
  open?: boolean;
  /** Controlled open state change handler (optional) */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Station Selector Component
 *
 * Renders a button that opens a bottom sheet with searchable station list.
 * Supports both controlled and uncontrolled usage.
 *
 * @example
 * <StationSelector
 *   trigger={<Button>Select Station</Button>}
 *   title="Select Origin"
 *   description="Search for your starting station"
 *   placeholder="Search stations..."
 *   onSelect={(id) => setFromStation(id)}
 *   dict={{ no_stations_found: "No stations found" }}
 * />
 */
export function StationSelector({
  trigger,
  title,
  description,
  placeholder,
  onSelect,
  dict,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: StationSelectorProps) {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] as 'en' | 'fa';

  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  /**
   * Filter stations based on search query
   * Searches in both English and Persian names
   */
  const filteredStations = Object.values(stations).filter((station) => {
    const displayName = lang === 'fa' ? station.translations.fa : station.name;
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  /**
   * Handles station selection
   * Closes sheet and clears search
   */
  const handleSelect = (stationId: string) => {
    onSelect(stationId);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <BottomSheet open={isOpen} onOpenChange={setIsOpen}>
      <BottomSheetTrigger asChild>{trigger}</BottomSheetTrigger>

      <BottomSheetContent
        header={
          <BottomSheetHeader>
            <BottomSheetTitle>{title}</BottomSheetTitle>
            <BottomSheetDescription>{description}</BottomSheetDescription>

            {/* Search Input */}
            <div className="container">
              <InputGroup>
                <InputGroupInput
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </BottomSheetHeader>
        }
      >
        {/* Station List */}
        <div className="max-h-full overflow-y-auto">
          {filteredStations.length === 0 ? (
            // Empty state
            <div className="p-4 text-center text-sm text-muted-foreground">
              {dict.no_stations_found}
            </div>
          ) : (
            // Station items
            <div>
              {filteredStations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => handleSelect(station.id)}
                  className="w-full px-3 py-2 text-start hover:bg-accent hover:text-accent-foreground rounded-sm text-sm"
                >
                  <div className="flex items-center gap-2">
                    {/* Station name */}
                    <span>
                      {lang === 'fa' ? station.translations.fa : station.name}
                    </span>

                    {/* Line badges */}
                    <div className="flex gap-1">
                      {station.lines.map((lineId) => {
                        const line = lines[lineId];
                        return line ? (
                          <span
                            key={lineId}
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              ['line_3', 'line_4'].includes(lineId)
                                ? 'text-black'
                                : 'text-white'
                            }`}
                            style={{ backgroundColor: line.color }}
                          >
                            {line.name[lang]}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
