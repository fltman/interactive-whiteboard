import { WhiteboardObject, Point, PathData, ShapeData, ImageData } from '../types/whiteboard';

const imageCache = new Map<string, HTMLImageElement>();

export function drawObject(
  ctx: CanvasRenderingContext2D,
  object: WhiteboardObject,
  isSelected: boolean
): void {
  ctx.save();

  ctx.globalAlpha = object.style.opacity;
  ctx.strokeStyle = object.style.strokeColor;
  ctx.fillStyle = object.style.fillColor;
  ctx.lineWidth = object.style.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Apply rotation for objects that support it
  if (object.rotation && (object.type === 'image' || object.type === 'sticky' || object.type === 'shape')) {
    const bounds = getObjectBounds(object);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((object.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  switch (object.type) {
    case 'path':
      drawPath(ctx, object);
      break;
    case 'shape':
      drawShape(ctx, object);
      break;
    case 'text':
      drawText(ctx, object);
      break;
    case 'sticky':
      drawSticky(ctx, object);
      break;
    case 'image':
      drawImage(ctx, object);
      break;
  }

  ctx.restore();

  // Draw selection box separately (after restore) so it's not affected by object's opacity
  if (isSelected) {
    ctx.save();
    drawSelectionBox(ctx, object);
    ctx.restore();
  }
}

function drawPath(ctx: CanvasRenderingContext2D, object: WhiteboardObject): void {
  const data = object.data as PathData;
  if (data.points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(
    object.position.x + data.points[0].x,
    object.position.y + data.points[0].y
  );

  for (let i = 1; i < data.points.length; i++) {
    ctx.lineTo(
      object.position.x + data.points[i].x,
      object.position.y + data.points[i].y
    );
  }

  if (data.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  }

  ctx.stroke();
}

function drawShape(ctx: CanvasRenderingContext2D, object: WhiteboardObject): void {
  const data = object.data as ShapeData;
  const { x, y } = object.position;
  const width = object.size?.width || 0;
  const height = object.size?.height || 0;

  ctx.beginPath();

  switch (data.shapeType) {
    case 'rectangle':
      ctx.rect(x, y, width, height);
      break;
    case 'ellipse':
      ctx.ellipse(
        x + width / 2,
        y + height / 2,
        Math.abs(width / 2),
        Math.abs(height / 2),
        0,
        0,
        Math.PI * 2
      );
      break;
    case 'line':
      ctx.moveTo(x, y);
      ctx.lineTo(data.endPoint?.x || x, data.endPoint?.y || y);
      break;
    case 'arrow':
      drawArrow(ctx, x, y, data.endPoint?.x || x, data.endPoint?.y || y);
      break;
  }

  if (object.style.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): void {
  const headLength = 15;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);

  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );

  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
}

function drawText(ctx: CanvasRenderingContext2D, object: WhiteboardObject): void {
  const data = object.data as { content: string; fontSize: number; fontFamily: string };
  ctx.font = `${data.fontSize}px ${data.fontFamily}`;
  ctx.fillStyle = object.style.strokeColor;
  ctx.fillText(data.content, object.position.x, object.position.y);
}

function drawSticky(ctx: CanvasRenderingContext2D, object: WhiteboardObject): void {
  const data = object.data as { content: string; backgroundColor: string };
  const width = object.size?.width || 150;
  const height = object.size?.height || 150;

  ctx.fillStyle = data.backgroundColor;
  ctx.fillRect(object.position.x, object.position.y, width, height);

  ctx.strokeStyle = '#00000022';
  ctx.strokeRect(object.position.x, object.position.y, width, height);

  ctx.fillStyle = '#000000';
  ctx.font = '14px sans-serif';
  wrapText(ctx, data.content, object.position.x + 10, object.position.y + 25, width - 20, 18);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

function drawImage(ctx: CanvasRenderingContext2D, object: WhiteboardObject): void {
  const data = object.data as ImageData;
  const width = object.size?.width || 100;
  const height = object.size?.height || 100;

  let img = imageCache.get(data.src);
  if (!img) {
    img = new Image();
    img.src = data.src;
    imageCache.set(data.src, img);
  }

  if (img.complete) {
    ctx.drawImage(img, object.position.x, object.position.y, width, height);
  }
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, object: WhiteboardObject): void {
  const bounds = getObjectBounds(object);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  ctx.save();

  // Apply rotation around center
  if (object.rotation) {
    ctx.translate(centerX, centerY);
    ctx.rotate((object.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  // Selection border
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);

  const handleSize = 10;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 2;

  // Resize handles (corners and edges)
  const handles = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width / 2, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height / 2 },
  ];

  handles.forEach((handle) => {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });

  // Rotation handle (circle above the object)
  const rotateHandleY = bounds.y - 30;

  // Line from top center to rotation handle
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 1;
  ctx.moveTo(centerX, bounds.y);
  ctx.lineTo(centerX, rotateHandleY + 8);
  ctx.stroke();

  // Rotation handle circle
  ctx.beginPath();
  ctx.arc(centerX, rotateHandleY, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rotation icon inside circle
  ctx.beginPath();
  ctx.arc(centerX, rotateHandleY, 4, 0, Math.PI * 1.5);
  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

export function getObjectBounds(object: WhiteboardObject): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (object.type === 'path') {
    const data = object.data as PathData;
    if (data.points.length === 0) {
      return { x: object.position.x, y: object.position.y, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const point of data.points) {
      minX = Math.min(minX, object.position.x + point.x);
      minY = Math.min(minY, object.position.y + point.y);
      maxX = Math.max(maxX, object.position.x + point.x);
      maxY = Math.max(maxY, object.position.y + point.y);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  return {
    x: object.position.x,
    y: object.position.y,
    width: object.size?.width || 100,
    height: object.size?.height || 100,
  };
}

export function isPointInObject(point: Point, object: WhiteboardObject): boolean {
  const bounds = getObjectBounds(object);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}
