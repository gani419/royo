import { tokens } from './tokens';

export const breakpoints = {
  compact: 0,      // Mobile Phones (<600px)
  medium: tokens.compact,
  expanded: tokens.expanded,
  large: tokens.large,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

export const getBreakpoint = (width: number): BreakpointKey => {
  if (width >= breakpoints.large) return 'large';
  if (width >= breakpoints.expanded) return 'expanded';
  if (width >= breakpoints.medium) return 'medium';
  return 'compact';
};

