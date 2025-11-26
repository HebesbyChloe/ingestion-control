"use client";

import * as React from "react";
import { cn } from "./utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

function Slider({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }: SliderProps) {
  const currentValue = value[0] ?? min;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onValueChange?.([newValue]);
  };

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${((currentValue - min) / (max - min)) * 100}%, #e5e7eb ${((currentValue - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
        {...props}
      />
    </div>
  );
}

export { Slider };

