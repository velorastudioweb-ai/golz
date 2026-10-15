import { ICON_MAP } from "../utils/helpers";

/**
 * Services are shown with a drawn lucide icon; the map key comes from the
 * service record (`icon`), and anything unknown falls back to Sparkles so a
 * card never renders empty.
 */
export default function ServiceIcon({ service, size = 24, className = "" }) {
  const Icon = ICON_MAP.get(service?.icon) || ICON_MAP.get("Sparkles");
  return Icon ? <Icon size={size} className={className} aria-hidden="true" /> : null;
}
