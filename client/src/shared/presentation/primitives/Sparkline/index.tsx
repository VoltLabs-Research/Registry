import { useId } from 'react';

export interface SparklineProps {
    points: number[];
    width?: number;
    height?: number;
    strokeWidth?: number;
    className?: string;
}

const Sparkline = ({
    points,
    width = 120,
    height = 28,
    strokeWidth = 1.5,
    className
}: SparklineProps) => {
    const titleId = useId();

    if (!points || points.length === 0) {
        return null;
    }

    const padding = strokeWidth;
    const innerWidth = Math.max(1, width - padding * 2);
    const innerHeight = Math.max(1, height - padding * 2);

    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

    const coords = points.map((value, index) => {
        const x = padding + index * stepX;
        const y = padding + innerHeight - ((value - min) / span) * innerHeight;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    if (points.length === 1) {
        const midY = padding + innerHeight / 2;
        coords.push(`${(padding + innerWidth).toFixed(2)},${midY.toFixed(2)}`);
    }

    return (
        <svg
            className={className}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role='img'
            aria-labelledby={titleId}
            preserveAspectRatio='none'
        >
            <title id={titleId}>Activity</title>
            <polyline
                points={coords.join(' ')}
                fill='none'
                stroke='var(--color-text-secondary)'
                strokeWidth={strokeWidth}
                strokeLinecap='round'
                strokeLinejoin='round'
                vectorEffect='non-scaling-stroke'
            />
        </svg>
    );
};

export default Sparkline;
