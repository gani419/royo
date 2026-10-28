import { useState, useEffect } from 'react';
import { breakpoints, getBreakpoint, BreakpointKey } from '@royo/theme';

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  isCompact: boolean;   // < 600px
  isMedium: boolean;    // 600px - 839px
  isExpanded: boolean;  // 840px - 1199px
  isLarge: boolean;     // >= 1200px
  isTabletOrLarger: boolean;
}

export function useResponsive(customWidth?: number, customHeight?: number): ResponsiveInfo {
  const getInitialDimensions = () => {
    if (customWidth !== undefined) {
      return { width: customWidth, height: customHeight ?? 800 };
    }
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1024, height: 768 }; // safe fallback for SSR
  };

  const [dimensions, setDimensions] = useState(getInitialDimensions);

  useEffect(() => {
    if (customWidth !== undefined) {
      setDimensions({ width: customWidth, height: customHeight ?? 800 });
      return;
    }

    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [customWidth, customHeight]);

  const activeBreakpoint = getBreakpoint(dimensions.width);

  return {
    width: dimensions.width,
    height: dimensions.height,
    breakpoint: activeBreakpoint,
    isCompact: activeBreakpoint === 'compact',
    isMedium: activeBreakpoint === 'medium',
    isExpanded: activeBreakpoint === 'expanded',
    isLarge: activeBreakpoint === 'large',
    isTabletOrLarger: dimensions.width >= breakpoints.medium,
  };
}

