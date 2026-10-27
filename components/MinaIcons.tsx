// Small stroke icons for the Mina dashboard. Decorative unless given a label.
type IconProps = { size?: number; label?: string }
function Svg({ size = 20, label, children }: IconProps & { children: React.ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>{children}</svg>
}
export const MoonIcon = (p: IconProps) => <Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Svg>
export const SunIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>
export const WaveIcon = (p: IconProps) => <Svg {...p}><path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 11v2" /></Svg>
export const CompareIcon = (p: IconProps) => <Svg {...p}><path d="M7 4v16M17 4v16M3 8h8M13 16h8" /></Svg>
export const GameIcon = (p: IconProps) => <Svg {...p}><rect x="3" y="7" width="18" height="11" rx="4" /><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01" /></Svg>
export const CheckInIcon = (p: IconProps) => <Svg {...p}><rect x="5" y="4" width="14" height="17" rx="3" /><path d="M9 4.5V3h6v1.5M9 12l2 2 4-4" /></Svg>
export const ChartIcon = (p: IconProps) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const DotsIcon = (p: IconProps) => <Svg {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Svg>
export const PhoneIcon = (p: IconProps) => <Svg {...p}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></Svg>
export const PlayIcon = ({ size = 20 }: IconProps) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
export const BackIcon = (p: IconProps) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>
export const SilenceIcon = (p: IconProps) => <Svg {...p}><path d="M11 5 6 9H3v6h3l5 4V5zM22 9l-6 6M16 9l6 6" /></Svg>
