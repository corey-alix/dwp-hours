/**
 * Animation CSS source — single source of truth for keyframes and utility
 * classes. All durations, easings, and distances reference tokens defined in
 * tokens.css via var(). No :root redefinitions here.
 */
export const animationCSS = `
  /* ── Keyframes ── */

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  @keyframes slide-in-right {
    from { transform: translateX(var(--slide-distance)); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }

  @keyframes slide-in-left {
    from { transform: translateX(calc(-1 * var(--slide-distance))); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }

  @keyframes slide-out-left {
    from { transform: translateX(0); opacity: 1; }
    to   { transform: translateX(calc(-1 * var(--slide-distance))); opacity: 0; }
  }

  @keyframes slide-out-right {
    from { transform: translateX(0); opacity: 1; }
    to   { transform: translateX(var(--slide-distance)); opacity: 0; }
  }

  @keyframes slide-down-in {
    from { transform: translateY(calc(-1 * var(--slide-offset))); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }

  @keyframes slide-up-out {
    from { transform: translateY(0); opacity: 1; }
    to   { transform: translateY(calc(-1 * var(--slide-offset))); opacity: 0; }
  }

  @keyframes pop {
    0%   { transform: scale(0.92); opacity: 0; }
    60%  { transform: scale(1.08); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes scale-down {
    from { transform: scale(1); opacity: 1; }
    to   { transform: scale(0.25); opacity: 0; }
  }

  /* ── Utility classes ── */

  .anim-fade-in {
    animation: fade-in var(--duration-normal) var(--easing-decelerate) backwards;
  }

  .anim-slide-in-right {
    animation: slide-in-right var(--duration-normal) var(--easing-decelerate) backwards;
  }

  .anim-slide-in-left {
    animation: slide-in-left var(--duration-normal) var(--easing-decelerate) backwards;
  }

  .anim-slide-out-left {
    animation: slide-out-left var(--duration-normal) var(--easing-accelerate) forwards;
  }

  .anim-slide-out-right {
    animation: slide-out-right var(--duration-normal) var(--easing-accelerate) forwards;
  }

  .anim-slide-down-in {
    animation: slide-down-in var(--duration-normal) var(--easing-decelerate) backwards;
  }

  .anim-slide-up-out {
    animation: slide-up-out var(--duration-normal) var(--easing-accelerate) forwards;
  }

  .anim-pop {
    animation: pop var(--duration-fast) var(--easing-standard) backwards;
  }

  .anim-scale-down {
    animation: scale-down var(--duration-normal) var(--easing-accelerate) forwards;
  }

  /* ── Accessibility: disable all animations for reduced-motion preference ── */

  @media (prefers-reduced-motion: reduce) {

    .anim-fade-in,
    .anim-slide-in-right,
    .anim-slide-in-left,
    .anim-slide-out-left,
    .anim-slide-out-right,
    .anim-slide-down-in,
    .anim-slide-up-out,
    .anim-pop,
    .anim-scale-down {
      animation: none;
    }
  }
`;
