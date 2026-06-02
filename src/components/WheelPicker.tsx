'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface WheelPickerProps {
  items: { value: number; label: string }[];
  selectedValue: number;
  onChange: (value: number) => void;
  unit?: string;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

export default function WheelPicker({ items, selectedValue, onChange, unit }: WheelPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    items.findIndex(item => item.value === selectedValue)
  );

  // Sync active index when selectedValue changes externally
  useEffect(() => {
    const idx = items.findIndex(item => item.value === selectedValue);
    if (idx !== -1 && idx !== activeIndex) {
      setActiveIndex(idx);
      scrollToIndex(idx, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, items]);

  const scrollToIndex = useCallback((index: number, smooth: boolean = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const spacerHeight = (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;
    const targetTop = index * ITEM_HEIGHT + spacerHeight - (el.clientHeight / 2 - ITEM_HEIGHT / 2);
    el.scrollTo({
      top: targetTop,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  // Initial scroll position
  useEffect(() => {
    const idx = items.findIndex(item => item.value === selectedValue);
    if (idx !== -1) {
      // Small delay to ensure layout is computed
      requestAnimationFrame(() => {
        scrollToIndex(idx, false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const spacerHeight = (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;
    const scrollTop = el.scrollTop;
    const centerOffset = scrollTop + el.clientHeight / 2 - spacerHeight - ITEM_HEIGHT / 2;
    const rawIndex = Math.round(centerOffset / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));

    setActiveIndex(clampedIndex);

    // Debounced snap
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      scrollToIndex(clampedIndex, true);
      if (items[clampedIndex].value !== selectedValue) {
        onChange(items[clampedIndex].value);
      }
    }, 100);
  }, [items, selectedValue, onChange, scrollToIndex]);

  const handleItemClick = useCallback((index: number) => {
    setActiveIndex(index);
    scrollToIndex(index, true);
    onChange(items[index].value);
  }, [items, onChange, scrollToIndex]);

  // Compute item styles for 3D effect
  const getItemStyle = (index: number): React.CSSProperties => {
    const distance = Math.abs(index - activeIndex);
    const opacity = Math.max(0.2, 1 - distance * 0.25);
    const scale = Math.max(0.85, 1 - distance * 0.05);
    return {
      opacity,
      transform: `scale(${scale})`,
    };
  };

  const spacerHeight = (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;

  return (
    <div className="calc-wheel-picker-container" style={{ height: VISIBLE_ITEMS * ITEM_HEIGHT - ITEM_HEIGHT + ITEM_HEIGHT }}>
      <div className="calc-wheel-picker-highlight" />
      <div
        ref={scrollRef}
        className="calc-wheel-picker-scroll"
        onScroll={handleScroll}
      >
        <div style={{ height: spacerHeight }} className="calc-wheel-picker-spacer" />
        {items.map((item, index) => (
          <div
            key={item.value}
            className={`calc-wheel-picker-item ${index === activeIndex ? 'active' : ''}`}
            style={getItemStyle(index)}
            onClick={() => handleItemClick(index)}
          >
            {item.label}
            {unit && <span className="calc-unit">{unit}</span>}
          </div>
        ))}
        <div style={{ height: spacerHeight }} className="calc-wheel-picker-spacer" />
      </div>
    </div>
  );
}
