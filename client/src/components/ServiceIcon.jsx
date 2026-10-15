import { ICON_MAP } from "../utils/helpers";

/**
 * Services carry a real emoji when one says what the service is at a glance;
 * the drawn lucide icon stays as the fallback for anything without one.
 */
export default function ServiceIcon({ service, size = 24, className = "" }) {
  const emoji = typeof service?.emoji === "string" ? service.emoji.trim() : "";
  if (emoji) {
    return (
      <span
        role="img"
        aria-label={service?.title || emoji}
        className={`inline-flex items-center justify-center leading-none ${className}`}
        style={{ fontSize: size }}
      >
        {emoji}
      </span>
    );
  }
  const Icon = ICON_MAP.get(service?.icon) || ICON_MAP.get("Sparkles");
  return Icon ? <Icon size={size} className={className} /> : null;
}
