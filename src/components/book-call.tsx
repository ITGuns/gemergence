import { SITE } from "@/lib/constants";
import { ArrowRight } from "@/components/icons";

/**
 * The site-wide offer is a call. It replaced the Free Growth Audit in the
 * restaurant swap, so every primary CTA points at the same booking link
 * rather than each page keeping its own copy of the URL and the target/rel.
 */
export function BookCall({
  className = "btn btn-primary",
  label = "Book a call",
  size = 15,
}: {
  className?: string;
  label?: string;
  size?: number;
}) {
  return (
    <a href={SITE.calendly} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <ArrowRight size={size} />
    </a>
  );
}
