import { useCallback, useEffect } from 'react';
import { arc } from 'd3-shape';
import { scaleLinear } from 'd3-scale';

export const Gauge = ({ value = 50, min = 150, max = 750, mean = 200, size = '1em', setColor = () => '' }) => {
  const backgroundArc = arc()
    .innerRadius(0.65)
    .outerRadius(1)
    .startAngle(-Math.PI * 0.5)
    .endAngle(Math.PI * 0.5)
    .cornerRadius(0.05)();

  const percentScale = scaleLinear()
    .domain([0, mean ? mean * 0.75 : min, mean, mean ? mean * 1.5 : 500, mean ? mean * 2 : max]) // scale relative to mean if provided
    .range([0, 0.1, 0.5, 0.9, 1]);

  const percent = percentScale(value);

  const angleScale = scaleLinear()
    .domain([0, 1])
    .range([-Math.PI / 2, Math.PI / 2])
    .clamp(true);

  const angle = angleScale(percent);

  const getArc = (i) => {
    const isBetween = (n1, n2, val) => val > n1 && val < n2;
    const angles = [
      [-Math.PI / 2, angle > -1.0 ? -1.0 : angle],
      [-1.0, isBetween(-1.0, 0, angle) || angle >= 0 ? angle : -1.0],
      [0, isBetween(0, 1.25, angle) || angle >= 1.25 ? angle : 0],
      [1.25, angle > 1.25 ? angle : 1.25],
    ];
    return arc().innerRadius(0.65).outerRadius(1).startAngle(angles[i][0]).endAngle(angles[i][1]).cornerRadius(0.05)();
  };

  const _color = useCallback(() => {
    if (percent < 0.15) return '#EF4444';
    if (percent >= 0.15 && percent < 0.5) return '#D97706';
    if (percent >= 0.5 && percent < 0.9) return '#10B981';
    return '#3B82F6';
  }, [percent]);

  useEffect(() => {
    setColor(_color());
  }, [_color, setColor]);

  return (
    <svg style={{ overflow: 'visible' }} width={size} viewBox={[-1, -1, 2, 1].join(' ')}>
      <defs>
        <linearGradient id="back_gradient">
          <stop className="stop1" offset="0%" />
          <stop className="stop2" offset="50%" />
          <stop className="stop3" offset="100%" />
        </linearGradient>
      </defs>

      <path d={backgroundArc} fill="#FFFFFF50" />
      <path d={getArc(0)} fill="#EF4444" />
      <path d={getArc(1)} fill="#FCD34D" />
      <path d={getArc(2)} fill="#10B981" />
      <path d={getArc(3)} fill="#3B82F6" />

      <line y1="-1" y2="-0.65" stroke="#FFFFFF50" strokeWidth="0.027" />
      <line y1="-1" y2="-0.65" stroke="#FFFFFF50" strokeWidth="0.027" transform={`rotate(${-1.0 * (180 / Math.PI)})`} />
      <line y1="-1" y2="-0.65" stroke="#FFFFFF50" strokeWidth="0.027" transform={`rotate(${1.25 * (180 / Math.PI)})`} />
      <path d="M 60,100" strokeWidth="1" />

      <path
        id="thumbs"
        style={{
          fill: 'none',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          stroke: `${_color()}`,
          strokeOpacity: 1,
          strokeMiterlimit: 4,
        }}
        d="M 13.96875 9 L 13.96875 4.96875 C 13.96875 3.375 12.65625 1.96875 10.96875 1.96875 L 7.03125 10.96875 L 7.03125 22.03125 L 18.28125 22.03125 C 19.3125 22.03125 20.15625 21.28125 20.25 20.34375 L 21.65625 11.34375 C 21.75 10.6875 21.5625 10.125 21.1875 9.65625 C 20.8125 9.28125 20.25 9 19.6875 9 Z M 7.03125 22.03125 L 4.03125 22.03125 C 2.90625 22.03125 1.96875 21.09375 1.96875 19.96875 L 1.96875 13.03125 C 1.96875 11.90625 2.90625 10.96875 4.03125 10.96875 L 7.03125 10.96875 "
        // transform={`rotate(${ (angle || -0.1) * (180 / Math.PI) - 90 } ) translate(-0.25, -0.25) scale(0.02)`}
        transform={`rotate(${
          angle <= 0 ? (angle || -0.1) * (180 / Math.PI) - 90 : 0
        } ) translate(-0.25, -0.25) scale(0.02)`}
      />
    </svg>
  );
};
