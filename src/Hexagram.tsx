export default function Hexagram({ bits }: { bits: string }) {
  // The first bit is the bottom line; 0 is broken, 1 is solid.
  return <svg viewBox="0 0 60 60" shapeRendering="crispEdges" aria-hidden="true" className="result-hexagram">
    {bits.split('').map((bit, index) => {
      const y = 48 - index * 8;
      return <g key={index} data-bit={bit} data-axis={index + 1}>
        {bit === '1' ? <rect x="6" y={y} width="48" height="4" /> : <><rect x="6" y={y} width="21" height="4" /><rect x="33" y={y} width="21" height="4" /></>}
      </g>;
    })}
  </svg>;
}
