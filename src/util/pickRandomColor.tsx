export function pickRandomColor(): string {
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
  ];

  return popularColors[Math.floor(Math.random() * popularColors.length)];
}
