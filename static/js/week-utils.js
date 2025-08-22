// Week Utilities - Ensures Monday-Sunday week structure across all modules
const WeekUtils = {
    // Get ISO week number (Monday as first day)
    getISOWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7; // Make Sunday = 7 instead of 0
        d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday in current week
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    // Get all days in a specific week of a month (Monday to Sunday)
    getDaysInWeek(year, month, weekNum) {
        const days = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Find first Monday of the month
        let firstMonday = 1;
        const firstDayOfWeek = firstDay.getDay();
        if (firstDayOfWeek !== 1) { // If not Monday
            if (firstDayOfWeek === 0) { // Sunday
                firstMonday = 2;
            } else {
                firstMonday = 1 + (8 - firstDayOfWeek);
            }
        }
        
        // Calculate week start
        const weekStart = firstMonday + (weekNum * 7);
        
        // Add days for this week (up to 7 days, but not beyond month)
        for (let i = 0; i < 7 && weekStart + i <= daysInMonth; i++) {
            days.push(weekStart + i);
        }
        
        // Handle first week if it doesn't start on Monday
        if (weekNum === 0 && firstMonday > 1) {
            const preDays = [];
            for (let d = 1; d < firstMonday; d++) {
                preDays.push(d);
            }
            return [...preDays, ...days];
        }
        
        return days;
    },
    
    // Get number of weeks in a month (Monday-based)
    getWeeksInMonth(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Find first Monday
        let firstMonday = 1;
        const firstDayOfWeek = firstDay.getDay();
        if (firstDayOfWeek !== 1) {
            if (firstDayOfWeek === 0) {
                firstMonday = 2;
            } else {
                firstMonday = 1 + (8 - firstDayOfWeek);
            }
        }
        
        // Count weeks
        let weeks = 1; // First week (even if partial)
        let remainingDays = daysInMonth - firstMonday + 1;
        weeks += Math.ceil(remainingDays / 7);
        
        return Math.min(weeks, 6); // Cap at 6 weeks max
    },
    
    // Check if a date is weekend
    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    },
    
    // Get day name abbreviation (starting with Monday)
    getDayShort(dayOfWeek) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dayOfWeek];
    },
    
    // Get day single letter (starting with Monday)
    getDaySingleLetter(dayOfWeek) {
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return days[dayOfWeek];
    },
    
    // Add weekend class if needed
    getWeekendClass(date) {
        if (typeof date === 'number') {
            // If it's a day number, we need year and month context
            return '';
        }
        return this.isWeekend(date) ? 'weekend-cell' : '';
    },
    
    // Add weekend class for day of week (0=Sunday, 6=Saturday)
    getWeekendClassForDay(dayOfWeek) {
        return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend-cell' : '';
    },
    
    // Get weekend class for a specific day in a month
    getWeekendClassForMonthDay(year, month, day) {
        const date = new Date(year, month, day);
        return this.isWeekend(date) ? 'weekend-cell' : '';
    }
};

// Make globally available
window.WeekUtils = WeekUtils;