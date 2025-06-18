/**
 * This function draw in the input canvas 2D context a rectangle.
 * It only deals with tracing the path, and does not fill or stroke.
 * @param ctx - The canvas 2D context in which the rectangle will be drawn.
 * @param x - The x coordinate of the top-left corner of the rectangle.
 * @param y - The y coordinate of the top-left corner of the rectangle.
 * @param width - The width of the rectangle.
 * @param height - The height of the rectangle.
 * @param radius - The radius of the rectangle's corners.
 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const height = size * Math.sqrt(3);
  ctx.beginPath();
  ctx.moveTo(x, y - (2 / 3) * height);
  ctx.lineTo(x - size, y + (1 / 3) * height);
  ctx.lineTo(x + size, y + (1 / 3) * height);
  ctx.closePath();
}

export function drawSquare(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath();
  ctx.rect(x - size, y - size, size * 2, size * 2);
  ctx.closePath();
}
