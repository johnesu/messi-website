import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const CartIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h2.2l2.1 12.3a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.2L21 8H6" />
  </svg>
);

export const StarIcon = (props: IconProps) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.9 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.95z" />
  </svg>
);

export const HeartIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.2a5 5 0 1 1 7.5 6.4z" />
  </svg>
);

export const BoltIcon = (props: IconProps) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13z" />
  </svg>
);

export const TruckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M1 5h13v11H1zM14 9h4l4 3v4h-8z" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="18" cy="18" r="1.6" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 2.5 20 6v6c0 5-3.5 8.2-8 9.5C7.5 20.2 4 17 4 12V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const RefreshIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

export const ImagePlaceholderIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5-9 9" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
