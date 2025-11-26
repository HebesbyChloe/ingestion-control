'use client';

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
}

export function CronBuilder({ value, onChange }: CronBuilderProps) {
  const parts = value.split(' ');
  const [minute = '0', hour = '*', dayMonth = '*', month = '*', dayWeek = '*'] = parts;
  
  const updateCron = (newValue: string, index: number) => {
    const newParts = value.split(' ');
    // Ensure we have 5 parts
    while (newParts.length < 5) {
      newParts.push('*');
    }
    newParts[index] = newValue;
    onChange(newParts.join(' '));
  };
  
  return (
    <div className="space-y-3 p-4 border border-slate-200 rounded-md bg-slate-50 mt-2">
      <div className="text-sm font-medium text-slate-700 mb-2">Advanced Cron Expression</div>
      <div className="grid grid-cols-5 gap-3">
        {/* Minute */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">Minute</label>
          <input 
            type="text"
            value={minute}
            onChange={(e) => updateCron(e.target.value, 0)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder="0-59"
          />
          <div className="text-xs text-slate-400 mt-1">0-59</div>
        </div>
        
        {/* Hour */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">Hour</label>
          <input 
            type="text"
            value={hour}
            onChange={(e) => updateCron(e.target.value, 1)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder="0-23"
          />
          <div className="text-xs text-slate-400 mt-1">0-23</div>
        </div>
        
        {/* Day of Month */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">Day</label>
          <input 
            type="text"
            value={dayMonth}
            onChange={(e) => updateCron(e.target.value, 2)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder="1-31"
          />
          <div className="text-xs text-slate-400 mt-1">1-31</div>
        </div>
        
        {/* Month */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">Month</label>
          <input 
            type="text"
            value={month}
            onChange={(e) => updateCron(e.target.value, 3)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder="1-12"
          />
          <div className="text-xs text-slate-400 mt-1">1-12</div>
        </div>
        
        {/* Day of Week */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block font-medium">Weekday</label>
          <input 
            type="text"
            value={dayWeek}
            onChange={(e) => updateCron(e.target.value, 4)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder="0-6"
          />
          <div className="text-xs text-slate-400 mt-1">0-6</div>
        </div>
      </div>
      
      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
        <div className="font-medium mb-1">Syntax guide:</div>
        <ul className="space-y-0.5 ml-2">
          <li><code className="bg-white px-1 rounded">*</code> = any value</li>
          <li><code className="bg-white px-1 rounded">*/n</code> = every n units (e.g., */3 = every 3)</li>
          <li><code className="bg-white px-1 rounded">1,2,5</code> = specific values (comma-separated)</li>
          <li><code className="bg-white px-1 rounded">1-5</code> = range of values</li>
        </ul>
      </div>
      
      <div className="text-xs font-mono bg-white p-2 rounded border border-slate-200">
        Current: <span className="text-indigo-600 font-semibold">{value}</span>
      </div>
    </div>
  );
}

