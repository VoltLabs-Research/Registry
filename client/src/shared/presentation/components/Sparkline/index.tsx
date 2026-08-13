import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
    values: number[];
    height?: number;
    className?: string;
}

interface SparklinePoint {
    value: number;
}

const toPoints = (values: number[]): SparklinePoint[] => {
    if (!values.length) {
        return [{ value: 0 }, { value: 0 }];
    }

    if (values.length === 1) {
        const only = Number.isFinite(values[0]) ? values[0] : 0;
        return [{ value: only }, { value: only }];
    }

    return values.map((entry) => {
        const raw = Number(entry);
        return { value: Number.isFinite(raw) ? raw : 0 };
    });
};

const MIN_DATA_MAX = 1;
const DOMAIN: [string, (dataMax: number) => number] = ['dataMin', (dataMax: number) => Math.max(dataMax, MIN_DATA_MAX)];
const MARGIN = { top: 2, right: 0, left: 0, bottom: 0 };

const Sparkline = ({ values, height = 28, className }: SparklineProps) => {
    const fillId = `${useId()}-sparkline-fill`;

    return (
        <div className={className} style={{ height }} aria-hidden='true'>
            <ResponsiveContainer width='100%' height={height}>
                <AreaChart data={toPoints(values)} margin={MARGIN}>
                    <defs>
                        <linearGradient id={fillId} x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor='var(--muted)' stopOpacity={0.18} />
                            <stop offset='100%' stopColor='var(--muted)' stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis hide domain={DOMAIN} />
                    <Area
                        type='monotone'
                        dataKey='value'
                        stroke='var(--muted)'
                        strokeWidth={1.5}
                        fill={`url(#${fillId})`}
                        fillOpacity={1}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Sparkline;
