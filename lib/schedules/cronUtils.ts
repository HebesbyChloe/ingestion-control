export interface CronPreset {
  label: string;
  value: string;
  description: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { label: 'Every 3 hours', value: '0 */3 * * *', description: 'At minute 0 past every 3rd hour' },
  { label: 'Every 6 hours', value: '0 */6 * * *', description: 'At minute 0 past every 6th hour' },
  { label: 'Every 12 hours', value: '0 */12 * * *', description: 'At minute 0 past every 12th hour' },
  { label: 'Daily at midnight', value: '0 0 * * *', description: 'At 00:00 every day' },
  { label: 'Daily at 6am', value: '0 6 * * *', description: 'At 06:00 every day' },
  { label: 'Daily at noon', value: '0 12 * * *', description: 'At 12:00 every day' },
  { label: 'Weekly (Monday)', value: '0 0 * * 1', description: 'At 00:00 on Monday' },
  { label: 'Monthly (1st)', value: '0 0 1 * *', description: 'At 00:00 on day 1 of the month' },
  { label: 'Custom', value: 'custom', description: 'Define your own cron expression' },
];

export function cronToHuman(cron: string): string {
  if (!cron) return 'No schedule set';
  
  const parts = cron.split(' ');
  if (parts.length !== 5) return 'Invalid cron expression';
  
  const [minute, hour, dayMonth, month, dayWeek] = parts;
  
  // Check common presets
  const preset = CRON_PRESETS.find(p => p.value === cron);
  if (preset && preset.value !== 'custom') {
    return preset.description;
  }
  
  // Common patterns matching
  if (cron === '0 */3 * * *') return 'Every 3 hours';
  if (cron === '0 */6 * * *') return 'Every 6 hours';
  if (cron === '0 */12 * * *') return 'Every 12 hours';
  if (cron === '0 0 * * *') return 'Daily at midnight';
  if (cron === '0 6 * * *') return 'Daily at 6am';
  if (cron === '0 12 * * *') return 'Daily at noon';
  if (cron === '0 0 * * 1') return 'At midnight on Monday';
  if (cron === '0 0 1 * *') return 'At midnight on the 1st of every month';
  
  // Pattern-based parsing
  let description = '';
  
  // Minute
  if (minute === '*') {
    description += 'Every minute';
  } else if (minute.startsWith('*/')) {
    description += `Every ${minute.slice(2)} minutes`;
  } else {
    description += `At minute ${minute}`;
  }
  
  // Hour
  if (hour === '*') {
    description += ', every hour';
  } else if (hour.startsWith('*/')) {
    description += `, every ${hour.slice(2)} hours`;
  } else {
    description += `, at hour ${hour}`;
  }
  
  // Day of month
  if (dayMonth !== '*') {
    if (dayMonth.startsWith('*/')) {
      description += `, every ${dayMonth.slice(2)} days`;
    } else {
      description += `, on day ${dayMonth}`;
    }
  }
  
  // Month
  if (month !== '*') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (month.startsWith('*/')) {
      description += `, every ${month.slice(2)} months`;
    } else {
      const monthNum = parseInt(month, 10);
      if (monthNum >= 1 && monthNum <= 12) {
        description += `, in ${months[monthNum - 1]}`;
      } else {
        description += `, in month ${month}`;
      }
    }
  }
  
  // Day of week
  if (dayWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (dayWeek.startsWith('*/')) {
      description += `, every ${dayWeek.slice(2)} days of the week`;
    } else {
      const dayNum = parseInt(dayWeek, 10);
      if (dayNum >= 0 && dayNum <= 6) {
        description += `, on ${days[dayNum]}`;
      } else {
        description += `, on weekday ${dayWeek}`;
      }
    }
  }
  
  return description;
}

