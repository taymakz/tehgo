"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import jalaali from "jalaali-js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JalaliDatePickerProps {
  date?: string; // Format: YYYY/MM/DD
  onDateChange?: (date: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showPresets?: boolean;
  enableTime?: boolean;
}

export function JalaliDatePicker({
  date,
  onDateChange,
  placeholder = "انتخاب تاریخ",
  className,
  disabled = false,
  showPresets = false,
  enableTime = false,
}: JalaliDatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<string | undefined>(
    date,
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [showYearPicker, setShowYearPicker] = React.useState(false);
  const yearScrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Time state
  const [selectedHour, setSelectedHour] = React.useState<number>(12);
  const [selectedMinute, setSelectedMinute] = React.useState<number>(0);

  // Get current Persian date
  const getCurrentPersianDate = () => {
    const now = new Date();
    const j = jalaali.toJalaali(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    );
    return { year: j.jy, month: j.jm, day: j.jd };
  };

  const currentPersian = getCurrentPersianDate();
  const [currentYear, setCurrentYear] = React.useState(currentPersian.year);
  const [currentMonth, setCurrentMonth] = React.useState(currentPersian.month);

  // Scroll to current year when year picker opens
  React.useEffect(() => {
    if (showYearPicker && yearScrollContainerRef.current) {
      // Use setTimeout to ensure the DOM is updated
      setTimeout(() => {
        const currentYearElement =
          yearScrollContainerRef.current?.querySelector(
            `[data-year="${currentYear}"]`,
          ) as HTMLElement;
        if (currentYearElement) {
          currentYearElement.scrollIntoView({
            block: "center",
          });
        }
      }, 0);
    }
  }, [showYearPicker, currentYear]);

  // Persian month names
  const persianMonths = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  // Persian weekday names
  const persianWeekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  // Preset options
  const presets = [
    { value: 0, label: "امروز" },
    { value: 1, label: "فردا" },
    { value: 3, label: "۳ روز بعد" },
    { value: 7, label: "۱ هفته بعد" },
    { value: 30, label: "۱ ماه بعد" },
  ];

  // Generate year range
  const yearRange = React.useMemo(() => {
    const years = [];
    for (let i = currentPersian.year - 40; i <= currentPersian.year + 40; i++) {
      years.push(i);
    }
    return years;
  }, [currentPersian.year]);

  // Display value
  const displayValue = React.useMemo(() => {
    if (!selectedDate) return placeholder;

    try {
      const parts = selectedDate.split("/");
      if (parts.length === 3) {
        const year = parseInt(parts[0] || "");
        const month = parseInt(parts[1] || "");
        const day = parseInt(parts[2] || "");

        if (month >= 1 && month <= 12) {
          let dateStr = `${day} ${persianMonths[month - 1]} ${year}`;

          if (enableTime) {
            dateStr += ` ${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
          }

          return dateStr;
        }
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }

    return selectedDate;
  }, [
    selectedDate,
    persianMonths,
    enableTime,
    selectedHour,
    selectedMinute,
    placeholder,
  ]);

  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    try {
      // Get the number of days in the current Jalali month
      // For Jalali calendar: months 1-6 have 31 days, 7-11 have 30 days, 12 has 29 or 30 (leap year)
      let daysInMonth: number;
      if (currentMonth <= 6) {
        daysInMonth = 31;
      } else if (currentMonth <= 11) {
        daysInMonth = 30;
      } else {
        // Check if it's a leap year for month 12
        daysInMonth = jalaali.isLeapJalaaliYear(currentYear) ? 30 : 29;
      }

      const firstDayOfMonth = jalaali.toGregorian(currentYear, currentMonth, 1);
      const firstDayWeekday = new Date(
        firstDayOfMonth.gy,
        firstDayOfMonth.gm - 1,
        firstDayOfMonth.gd,
      ).getDay();

      // Adjust for Persian week (Saturday = 0)
      const adjustedFirstDay = (firstDayWeekday + 1) % 7;

      const days = [];

      // Today's date
      const todayJalali = `${currentPersian.year}/${currentPersian.month.toString().padStart(2, "0")}/${currentPersian.day.toString().padStart(2, "0")}`;

      // Add empty cells
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push({ day: "", disabled: true, isCurrentMonth: false });
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${currentYear}/${currentMonth.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
        // Compare only the date part (without time) for selection
        const selectedDateOnly = selectedDate?.split(" ")[0];
        const isSelected = selectedDateOnly === dateString;
        const isToday = dateString === todayJalali;

        days.push({
          day: day.toString(),
          disabled: false,
          isCurrentMonth: true,
          isSelected,
          dateString,
          isToday,
        });
      }

      return days;
    } catch (error) {
      console.error("Error generating calendar days:", error);
      return [];
    }
  }, [currentYear, currentMonth, selectedDate, currentPersian]);

  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectDate = (day: any) => {
    if (day.disabled || !day.isCurrentMonth) return;

    let dateValue = day.dateString;

    if (enableTime) {
      dateValue += ` ${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    }

    setSelectedDate(dateValue);
    onDateChange?.(dateValue);
    setIsOpen(false);
  };

  const selectYear = (year: number) => {
    setCurrentYear(year);
    setShowYearPicker(false);
  };

  const selectPreset = (value: string) => {
    const days = parseInt(value);
    const now = new Date();
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const j = jalaali.toJalaali(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      targetDate.getDate(),
    );

    let dateString = `${j.jy}/${j.jm.toString().padStart(2, "0")}/${j.jd.toString().padStart(2, "0")}`;

    if (enableTime) {
      dateString += ` ${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    }

    setSelectedDate(dateString);
    onDateChange?.(dateString);
    setCurrentYear(j.jy);
    setCurrentMonth(j.jm);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-right font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          dir="rtl"
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="mx-auto flex max-w-screen-lg flex-col gap-2 p-2">
          {/* Presets */}
          {showPresets && (
            <div className="border-b pb-2">
              <Select onValueChange={selectPreset}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب سریع" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem
                      key={preset.value}
                      value={preset.value.toString()}
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Calendar Content */}
          <div className="p-1">
            {/* Year Picker View */}
            {showYearPicker ? (
              <div className="space-y-4 w-64">
                <div className="space-y-3 border-b pb-2">
                  <div className="text-center text-sm font-medium">
                    انتخاب سال
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowYearPicker(false)}
                  >
                    بازگشت
                  </Button>
                </div>

                <div
                  className="max-h-64 space-y-1 overflow-y-auto"
                  ref={yearScrollContainerRef}
                >
                  {yearRange.map((year) => (
                    <button
                      key={year}
                      type="button"
                      data-year={year}
                      className={cn(
                        "w-full rounded-md p-2 text-center text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        year === currentYear &&
                        "bg-primary text-primary-foreground",
                        year === currentPersian.year && "font-medium",
                      )}
                      onClick={() => selectYear(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Header with navigation */}
                <div className="mb-4 flex items-center justify-between">
                  <button
                    className="rounded-md p-1 transition-colors hover:bg-accent"
                    type="button"
                    onClick={goToPreviousMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    className="rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-accent/50"
                    type="button"
                    onClick={() => setShowYearPicker(true)}
                  >
                    {persianMonths[currentMonth - 1]} {currentYear}
                  </button>

                  <button
                    className="rounded-md p-1 transition-colors hover:bg-accent"
                    type="button"
                    onClick={goToNextMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {persianWeekDays.map((weekDay) => (
                    <div
                      key={weekDay}
                      className="flex h-8 select-none items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                      {weekDay}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={day.disabled || !day.isCurrentMonth}
                      className={cn(
                        "h-8 w-8 rounded-md text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                        (day.disabled || !day.isCurrentMonth) &&
                        "cursor-not-allowed text-muted-foreground",
                        day.isToday &&
                        !day.isSelected &&
                        "bg-primary/10 text-primary hover:text-primary",
                        day.isSelected &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                      onClick={() => selectDate(day)}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>

                {/* Time Picker */}
                {enableTime && (
                  <div className="mt-4 border-t pt-3">
                    <div
                      className="flex items-center justify-center gap-4"
                      dir="ltr"
                    >
                      {/* Hours */}
                      <div className="text-center">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={selectedHour}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 0 && val <= 23) setSelectedHour(val);
                          }}
                          className="h-8 w-12 rounded border bg-input text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          dir="ltr"
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          ساعت
                        </div>
                      </div>
                      <span className="text-xl">:</span>
                      {/* Minutes */}
                      <div className="text-center">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={selectedMinute}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 0 && val <= 59) setSelectedMinute(val);
                          }}
                          className="h-8 w-12 rounded border bg-input text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          dir="ltr"
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          دقیقه
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
