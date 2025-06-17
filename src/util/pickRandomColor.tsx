const popularColors = [
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#03A9F4', // Light Blue
  '#00BCD4', // Teal
  '#009688', // Green
  '#4CAF50', // Lime
  '#00796B', // Teal Green
  '#33691E', // Dark Green
  '#E67E22', // Deep Orange
  '#F4511E', // Orange
  '#FF9800', // Amber
  '#FF5722', // Material Orange
  '#795542', // Brown
  '#5D4037', // Dark Brown
  '#FFC107', // Yellow
  '#FFFF00', // Yellow
  '#FFF400', // Light Yellow
  '#8BC34A', // Lime Green
  '#4CAF50', // Light Green
  '#AEEA00', // Yellow Green
  '#66BB66', // Medium Aquamarine
  '#9CCC66', // Light Green
  '#2E7D32', // Sea Green
  '#1B5E20', // Forest Green
  '#00C853', // Green
  '#00695C', // Dark Green
  '#26A662', // Cyan
  '#00897B', // Teal Blue
  '#00B7FF', // Light Blue
  '#ADD8E6', // Light Blue
  '#F0F4FF', // Azure
  '#82CAFF', // Medium Blue
  '#2196F3', // Blue
  '#3F51B5', // Indigo
  '#663399', // Purple
  '#6200EA', // Deep Purple
  '#303F9F', // Blue Violet
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#F44336', // Red
  '#FF7F50', // Coral
  '#F06292', // Orange Red
  '#FF0080', // Red
  '#C62828', // Deep Red
  '#ED4C6D', // Crimson
  '#FF80AB', // Pink
  '#957DAD', // Plum
  '#D81B60', // Violet
  '#E67E22', // Orange
  '#009688', // Green
  '#00BCD4', // Teal
  '#03A9F4', // Light Blue
  '#2196F3', // Blue
  '#3F51B5', // Indigo
  '#673AB7', // Deep Purple
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#F44336', // Red
]

const popularColorsOKLCH = [
  'oklch(0.628 0.257 27.33)', // Red
  'oklch(0.647 0.263 352.22)', // Pink
  'oklch(0.497 0.277 307.75)', // Purple
  'oklch(0.427 0.242 301.39)', // Deep Purple
  'oklch(0.506 0.181 264.05)', // Indigo
  'oklch(0.670 0.164 252.42)', // Blue
  'oklch(0.726 0.142 235.84)', // Light Blue
  'oklch(0.764 0.137 200.72)', // Cyan
  'oklch(0.693 0.151 180.31)', // Teal
  'oklch(0.764 0.184 142.50)', // Green
  'oklch(0.544 0.131 174.77)', // Dark Teal
  'oklch(0.458 0.117 126.78)', // Dark Green
  'oklch(0.681 0.177 46.85)', // Orange
  'oklch(0.638 0.217 33.14)', // Deep Orange
  'oklch(0.771 0.171 70.67)', // Amber
  'oklch(0.686 0.225 37.68)', // Material Orange
  'oklch(0.457 0.086 61.17)', // Brown
  'oklch(0.378 0.081 53.29)', // Dark Brown
  'oklch(0.831 0.143 85.87)', // Yellow
  'oklch(0.968 0.211 109.77)', // Bright Yellow
  'oklch(0.942 0.194 104.85)', // Light Yellow
  'oklch(0.812 0.174 128.33)', // Lime Green
  'oklch(0.764 0.184 142.50)', // Light Green
  'oklch(0.886 0.204 113.85)', // Yellow Green
  'oklch(0.783 0.134 147.89)', // Medium Aquamarine
  'oklch(0.828 0.142 132.68)', // Pale Green
  'oklch(0.561 0.148 144.41)', // Sea Green
  'oklch(0.424 0.132 142.34)', // Forest Green
  'oklch(0.870 0.190 149.57)', // Bright Green
  'oklch(0.478 0.108 166.11)', // Dark Cyan Green
  'oklch(0.726 0.129 192.17)', // Aqua
  'oklch(0.623 0.118 191.25)', // Teal Blue
  'oklch(0.792 0.108 240.54)', // Sky Blue
  'oklch(0.864 0.039 253.89)', // Light Blue
  'oklch(0.976 0.013 258.48)', // Azure
  'oklch(0.823 0.063 246.06)', // Powder Blue
  'oklch(0.670 0.164 252.42)', // Blue
  'oklch(0.506 0.181 264.05)', // Indigo
  'oklch(0.476 0.152 293.73)', // Purple
  'oklch(0.451 0.313 292.65)', // Deep Purple
  'oklch(0.449 0.134 271.19)', // Blue Violet
  'oklch(0.497 0.277 307.75)', // Purple
  'oklch(0.647 0.263 352.22)', // Pink
  'oklch(0.628 0.257 27.33)', // Red
  'oklch(0.757 0.155 31.67)', // Coral
  'oklch(0.698 0.181 357.29)', // Light Pink
  'oklch(0.591 0.331 347.69)', // Hot Pink
  'oklch(0.522 0.194 16.49)', // Deep Red
  'oklch(0.678 0.201 358.34)', // Crimson
  'oklch(0.787 0.146 350.34)', // Pink
  'oklch(0.637 0.101 316.52)', // Plum
  'oklch(0.599 0.233 344.81)', // Violet Red
  'oklch(0.681 0.177 46.85)', // Orange
  'oklch(0.693 0.151 180.31)', // Teal
  'oklch(0.764 0.137 200.72)', // Cyan
  'oklch(0.726 0.142 235.84)', // Light Blue
  'oklch(0.670 0.164 252.42)', // Blue
  'oklch(0.506 0.181 264.05)', // Indigo
  'oklch(0.427 0.242 301.39)', // Deep Purple
  'oklch(0.497 0.277 307.75)', // Purple
  'oklch(0.647 0.263 352.22)', // Pink
  'oklch(0.628 0.257 27.33)', // Red
  'oklch(0.842 0.104 162.48)', // Mint Green
  'oklch(0.918 0.061 93.39)', // Cream
  'oklch(0.791 0.108 83.87)', // Peach
  'oklch(0.605 0.151 328.36)', // Mauve
  'oklch(0.724 0.092 213.68)', // Steel Blue
  'oklch(0.548 0.096 285.75)', // Slate Purple
  'oklch(0.663 0.119 49.77)', // Tan
  'oklch(0.923 0.032 106.81)', // Ivory
  'oklch(0.445 0.063 285.83)', // Dark Slate
  'oklch(0.721 0.074 195.87)', // Cadet Blue
]
export function pickRandomColor(): string {
  return popularColors[Math.floor(Math.random() * popularColors.length)]
}
