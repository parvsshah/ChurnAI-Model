import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981'];
const LABELS = ['Critical', 'High', 'Medium', 'Low'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        return (
            <div className="glass-card p-2.5 border border-border/50 shadow-xl text-sm">
                <p className="font-semibold" style={{ color: payload[0].payload.fill }}>
                    {payload[0].name}: {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function RiskDistribution({ data }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm animate-slide-up delay-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((_, idx) => (
                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} className="transition-all duration-300 hover:opacity-80" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            {/* Center label */}
                            <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-2xl font-bold">
                                {total.toLocaleString()}
                            </text>
                            <text x="50%" y="58%" textAnchor="middle" className="fill-muted-foreground text-xs">
                                Total
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                    {data.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[idx] }} />
                            <span className="text-muted-foreground">{entry.name}</span>
                            <span className="ml-auto font-semibold text-foreground">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
