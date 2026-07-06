import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { buildWeightChartData, toSvgPath } from '../lib/chartGeometry';
import { colors } from '../theme';
import { Weight } from '../types';

export function WeightChart({ weights, width, height }: { weights: Weight[]; width: number; height: number }) {
  const data = buildWeightChartData(weights, width, height);
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <View>
      <Svg width={width} height={height}>
        <Path d={toSvgPath(data.linePoints)} stroke={colors.cyan} strokeWidth={1.5} fill="none" />
        <Path d={toSvgPath(data.maPoints)} stroke={colors.green} strokeWidth={3} fill="none" strokeLinecap="round" />
        {data.linePoints.map((point, i) =>
          sorted[i]?.flag === 'outlier' ? (
            <Circle key={sorted[i].id} cx={point.x} cy={point.y} r={4} fill={colors.orange} />
          ) : null
        )}
      </Svg>
    </View>
  );
}
