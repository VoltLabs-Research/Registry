/**
 * Format an install count compactly: 1_900_000 -> "1.9M", 509_400 -> "509.4K", 142_000 -> "142K", 980 -> "980".
 */
export const compactNumber = (num: number): string => {
    if(!Number.isFinite(num)) return '0';
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    const trim = (value: number): string => value.toFixed(1).replace(/\.0$/, '');
    if(absNum >= 1_000_000){
        return sign + trim(absNum / 1_000_000) + 'M';
    }
    if(absNum >= 1_000){
        return sign + trim(absNum / 1_000) + 'K';
    }
    return sign + String(Math.round(absNum));
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
});

/**
 * Format an ISO date string as "Jan 26, 2026".
 */
export const formatDate = (iso: string): string => {
    const date = new Date(iso);
    if(Number.isNaN(date.getTime())) return iso;
    return dateFormatter.format(date);
};
