import { Settings } from 'sigma/settings';
import { EdgeAttributes, NodeAttributes } from '../interface';
import { drawRoundRect } from './utils';
import { graphConfig } from '../data/graphConfig';

const interactionTypeOptions = graphConfig.find(cfg => cfg.id === 'interactionType')?.options || [];
const interactionTypeMap = Object.fromEntries(interactionTypeOptions.map(opt => [opt.value, opt.label]));

export default function drawEdgeHover(
  context: CanvasRenderingContext2D,
  data: EdgeAttributes & { x: number; y: number },
  settings: Settings<NodeAttributes, EdgeAttributes>,
) {
  if (data.hidden) return;
  const size = settings.edgeLabelSize;
  const font = settings.edgeLabelFont;
  const weight = settings.edgeLabelWeight;
  context.font = `${weight} ${size}px ${font}`;

  // Draw the edge label with an improved design
  const text = `Score ${data.score ?? ''}`;
  let typeParts: string[] = [];
  if (data.typeScores && Object.keys(data.typeScores).length > 0) {
    typeParts = Object.entries(data.typeScores)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${interactionTypeMap[k] || k}: ${Number(v).toFixed(2)}`);
  }
  const lines = [text];
  const showTypeScores = typeParts.length > 1;
  if (showTypeScores) {
    typeParts.forEach(part => lines.push(part));
  }
  const textHeight = size;
  const padding = 8;
  const radius = 6;
  const x = data.x + padding;
  const y = data.y + padding;
  const width = Math.max(...lines.map(line => context.measureText(line).width)) + 2 * padding;
  const height = lines.length * textHeight + 2 * padding;

  // Add a subtle glow effect
  context.beginPath();
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 3;
  context.shadowBlur = 10;
  context.shadowColor = 'rgba(0, 128, 128, 0.3)';

  // Use solid white background
  context.fillStyle = '#fff';
  drawRoundRect(context, x, y, width, height, radius);
  context.fill();
  // Reset shadow for border
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // Draw border with gradient
  const strokeGradient = context.createLinearGradient(x, y, x, y + height);
  strokeGradient.addColorStop(0, '#20b2aa');
  strokeGradient.addColorStop(1, '#008080');
  context.lineWidth = 2;
  context.strokeStyle = strokeGradient;
  context.stroke();

  // Draw text
  context.fillStyle = settings.edgeLabelColor.color || '#333';
  lines.forEach((line, i) => {
    let yOffset = y + padding + textHeight * (i + 0.85);
    if (showTypeScores && i > 0) {
      yOffset += textHeight * 0.5;
    }
    context.fillText(line, x + padding, yOffset);

    if (showTypeScores && i === 0) {
      context.save();

      const sepY = y + padding + textHeight * (i + 1.15);
      context.strokeStyle = strokeGradient;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x, sepY);
      context.lineTo(x + width, sepY);
      context.stroke();
      context.restore();
    }
  });
}
