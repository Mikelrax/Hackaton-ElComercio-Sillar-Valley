import type { SVGProps } from "react";

export function AyniLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="4 18 92 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ayni"
      {...props}
    >
      <circle cx="36" cy="50" r="22" fill="none" stroke="#0F766E" strokeWidth="10" />
      <circle cx="64" cy="50" r="22" fill="none" stroke="#F59E0B" strokeWidth="10" />
      <path
        d="M41.69 28.75 A22 22 0 0 1 55.94 40.7"
        fill="none"
        stroke="#0F766E"
        strokeWidth="10"
      />
    </svg>
  );
}
