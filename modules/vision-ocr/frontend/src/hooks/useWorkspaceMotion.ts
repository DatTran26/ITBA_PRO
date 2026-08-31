import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import type { OCRJobStatus } from "../types/ocr";
import type { RefObject } from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function useAppShellMotion(scopeRef: RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    if (!scopeRef.current || window.matchMedia(reducedMotionQuery).matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        [".app-sidebar", ".app-header", ".app-main"],
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.06,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
      );
    }, scopeRef);

    return () => context.revert();
  }, [scopeRef]);
}

export function useWorkspaceMotion(
  jobCount: number,
  selectedStatus?: OCRJobStatus,
) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const previousJobCount = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia(reducedMotionQuery).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(reducedMotionQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useLayoutEffect(() => {
    if (reducedMotion || !scopeRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        [".page-heading > *", ".queue-panel", ".review-placeholder"],
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.07,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    }, scopeRef);

    return () => context.revert();
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (reducedMotion || jobCount === 0 || !scopeRef.current) return;
    const rows = Array.from(scopeRef.current.querySelectorAll(".job-item"));
    const addedRows = rows.slice(previousJobCount.current);
    previousJobCount.current = jobCount;
    if (addedRows.length === 0) return;

    gsap.fromTo(
      addedRows,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.34,
        stagger: 0.06,
        ease: "power2.out",
      },
    );
  }, [jobCount, reducedMotion]);

  useEffect(() => {
    if (jobCount < previousJobCount.current) previousJobCount.current = jobCount;
  }, [jobCount]);

  useLayoutEffect(() => {
    if (!scopeRef.current) return;
    const workspace = scopeRef.current.querySelector(".review-workspace");
    const sweep = scopeRef.current.querySelector(".evidence-spine__sweep");

    if (sweep) gsap.killTweensOf(sweep);
    if (reducedMotion) {
      if (workspace) gsap.set(workspace, { clearProps: "all" });
      if (sweep) gsap.set(sweep, { opacity: 0, clearProps: "transform" });
      return;
    }

    if (workspace) {
      gsap.fromTo(
        workspace,
        { opacity: 0.72, y: 5 },
        { opacity: 1, y: 0, duration: 0.28, ease: "power1.out" },
      );
    }

    if (selectedStatus === "processing" && sweep) {
      const responsiveMotion = gsap.matchMedia();
      responsiveMotion.add("(min-width: 1280px)", () => {
        gsap.fromTo(
          sweep,
          { yPercent: -120, xPercent: 0, opacity: 0 },
          { yPercent: 320, opacity: 1, duration: 1.8, repeat: -1, ease: "none" },
        );
      });
      responsiveMotion.add("(max-width: 1279px)", () => {
        gsap.fromTo(
          sweep,
          { xPercent: -120, yPercent: 0, opacity: 0 },
          { xPercent: 320, opacity: 1, duration: 1.8, repeat: -1, ease: "none" },
        );
      });

      return () => {
        responsiveMotion.revert();
        if (workspace) gsap.killTweensOf(workspace);
        gsap.killTweensOf(sweep);
      };
    }

    return () => {
      if (workspace) gsap.killTweensOf(workspace);
      if (sweep) gsap.killTweensOf(sweep);
    };
  }, [reducedMotion, selectedStatus]);

  return {
    scopeRef,
    motionMode: reducedMotion ? "reduced" : "full",
  } as const;
}
