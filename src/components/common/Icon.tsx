import type { CSSProperties } from "react";
import {
  Activity,
  ArrowRight,
  BadgePlus,
  Bookmark,
  Check,
  ChevronDown,
  CircleHelp,
  Clock,
  Compass,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Home,
  type LucideIcon,
  LogOut,
  MapPin,
  MessageSquareText,
  Minus,
  Plus,
  Radio,
  ScanLine,
  Scissors,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tags,
  Ticket,
  TriangleAlert,
  Trophy,
  UtensilsCrossed,
  Wrench,
  X,
} from "lucide-react";

/**
 * Public icon surface for the app. The call-site API (name/size/className/style)
 * is unchanged from the original hand-rolled SVG set, but each name now renders a
 * lucide-react glyph for a richer, consistent, premium line-icon language.
 */
export type IconName =
  | "home"
  | "ping"
  | "matches"
  | "explore"
  | "saved"
  | "claims"
  | "rankings"
  | "reports"
  | "help"
  | "store"
  | "createOffer"
  | "offers"
  | "redeem"
  | "reviews"
  | "analytics"
  | "demo"
  | "location"
  | "chevron"
  | "close"
  | "check"
  | "alert"
  | "arrow"
  | "star"
  | "search"
  | "clock"
  | "plus"
  | "minus"
  | "ticket"
  | "food"
  | "retail"
  | "services"
  | "fitness"
  | "education"
  | "repair"
  | "entertainment"
  | "settings"
  | "logout";

const ICONS: Record<IconName, LucideIcon> = {
  home: Home,
  ping: Radio,
  matches: Sparkles,
  explore: Compass,
  saved: Bookmark,
  claims: Ticket,
  rankings: Trophy,
  reports: Activity,
  help: CircleHelp,
  store: Store,
  createOffer: BadgePlus,
  offers: Tags,
  redeem: ScanLine,
  reviews: MessageSquareText,
  analytics: Activity,
  demo: SlidersHorizontal,
  location: MapPin,
  chevron: ChevronDown,
  close: X,
  check: Check,
  alert: TriangleAlert,
  arrow: ArrowRight,
  star: Star,
  search: Search,
  clock: Clock,
  plus: Plus,
  minus: Minus,
  ticket: Ticket,
  food: UtensilsCrossed,
  retail: ShoppingBag,
  services: Scissors,
  fitness: Dumbbell,
  education: GraduationCap,
  repair: Wrench,
  entertainment: Gamepad2,
  settings: Settings,
  logout: LogOut,
};

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 18, strokeWidth = 1.8, className, style }: Props) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}
