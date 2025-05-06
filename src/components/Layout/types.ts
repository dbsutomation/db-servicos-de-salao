
import { ReactNode } from 'react';

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  requiredRoles?: string[];
}

export interface MainLayoutProps {
  children: ReactNode;
}
