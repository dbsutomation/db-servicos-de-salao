import { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RevenueRecord {
  date: string; // YYYY-MM-DD (já em horário de Brasília)
  serviceValue: number;
  service?: { price?: number } | null;
}

interface RevenueEvolutionChartProps {
  records: RevenueRecord[];
}

const TIME_ZONE = 'America/Sao_Paulo';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RevenueEvolutionChart = ({ records }: RevenueEvolutionChartProps) => {
  const data = useMemo(() => {
    const now = toZonedTime(new Date(), TIME_ZONE);

    // Últimos 6 meses incluindo o mês atual
    const months = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      return {
        key: format(monthDate, 'yyyy-MM'),
        label: format(monthDate, 'MMM', { locale: ptBR }).replace('.', ''),
        fullLabel: format(monthDate, "MMMM 'de' yyyy", { locale: ptBR }),
        start: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
        end: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
        total: 0,
      };
    });

    // Mesma regra do card Faturamento Total: serviceValue ?? service.price
    for (const record of records) {
      const month = months.find((m) => record.date >= m.start && record.date <= m.end);
      if (month) {
        month.total += Number(record.serviceValue || record.service?.price || 0);
      }
    }

    return months.map((m) => ({
      label: m.label.charAt(0).toUpperCase() + m.label.slice(1),
      fullLabel: m.fullLabel.charAt(0).toUpperCase() + m.fullLabel.slice(1),
      total: m.total,
    }));
  }, [records]);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Evolução do Faturamento</CardTitle>
          <CardDescription>Acompanhe a evolução do faturamento nos últimos meses</CardDescription>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap pt-1">Últimos 6 meses</span>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={70}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value: number) =>
                  value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  })
                }
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.fullLabel ?? _label
                }
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueEvolutionChart;
