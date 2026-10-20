import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: 'primary' | 'destructive' | 'neutral';
  size?: 'lg' | 'md';
}

const toneStyles = {
  primary: { card: 'bg-accent border-primary/20', icon: 'bg-primary/15 text-primary' },
  destructive: { card: 'bg-destructive/10 border-destructive/20', icon: 'bg-destructive/15 text-destructive' },
  neutral: { card: 'bg-card border-border', icon: 'bg-accent text-primary' },
};

const StatCard = ({ label, value, icon, tone = 'neutral', size = 'md' }: StatCardProps) => {
  const t = toneStyles[tone];
  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-xl border p-4 shadow-sm min-w-0', t.card)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground leading-snug">{label}</p>
        <p className={cn('font-bold text-foreground tabular-nums leading-tight break-words', size === 'lg' ? 'text-2xl lg:text-xl xl:text-2xl' : 'text-xl')}>{value}</p>
      </div>
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', t.icon)}>{icon}</div>
    </div>
  );
};

export default StatCard;
