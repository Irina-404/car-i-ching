export function HexagramLine({ bit, x, y, width, height, gap }: {
  bit: string; x: number; y: number; width: number; height: number; gap: number;
}) {
  const half = (width - gap) / 2;
  return bit === '1' ? <rect x={x} y={y} width={width} height={height} /> : <>
    <rect x={x} y={y} width={half} height={height} />
    <rect x={x + half + gap} y={y} width={half} height={height} />
  </>;
}

export default function Hexagram({ bits }: { bits: string }) {
  // The first bit is the bottom line; 0 is broken, 1 is solid.
  return <svg viewBox="0 0 60 60" shapeRendering="crispEdges" aria-hidden="true" className="result-hexagram">
    {bits.split('').map((bit, index) => {
      const y = 48 - index * 8;
      return <g key={index} data-bit={bit} data-axis={index + 1}>
        <HexagramLine bit={bit} x={6} y={y} width={48} height={4} gap={6} />
      </g>;
    })}
  </svg>;
}
