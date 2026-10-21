interface Props {
  height: number;
  color: string;
}

/**
 * PLACEHOLDER for the WF | Wake Forest ZSR lockup. Replace with the official artwork
 * (white and black variants) once it is supplied; see "Open questions" in spec.md.
 */
export function Lockup({ height, color }: Props) {
  return (
    <svg
      height={height}
      viewBox="0 0 560 100"
      aria-hidden="true"
      style={{ display: 'block', color, width: 'auto' }}
    >
      <text x="0" y="78" fontSize="88" fontWeight="700" fill="currentColor">
        WF
      </text>
      <rect x="160" y="8" width="4" height="84" fill="currentColor" />
      <text x="188" y="44" fontSize="38" fontWeight="700" fill="currentColor">
        Wake Forest
      </text>
      <text x="188" y="88" fontSize="38" fontWeight="400" fill="currentColor">
        ZSR Library
      </text>
    </svg>
  );
}
