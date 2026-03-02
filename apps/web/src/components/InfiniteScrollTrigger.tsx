import { useEffect, useRef } from "react";

export function InfiniteScrollTrigger({
  onVisible,
}: {
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onVisible();
    });

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [onVisible]);

  return <div ref={ref} style={{ height: 1 }} />;
}
