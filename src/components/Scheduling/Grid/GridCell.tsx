
import React from 'react';
import { cn } from '@/lib/utils';

interface GridCellProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GridCell = ({ children, className, onClick }: GridCellProps) => {
  return (
    <div 
      className={cn("px-4 py-3 border-r border-gray-100 last:border-r-0", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
