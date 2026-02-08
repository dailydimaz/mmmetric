/**
 * Heatmap Renderer - Canvas-based gradient heatmap visualization
 */

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}

export interface HeatmapConfig {
  radius: number;
  blur: number;
  maxOpacity: number;
  minOpacity: number;
  gradient: Record<number, string>;
}

const DEFAULT_CONFIG: HeatmapConfig = {
  radius: 25,
  blur: 15,
  maxOpacity: 0.8,
  minOpacity: 0.05,
  gradient: {
    0.0: "#0000ff",
    0.25: "#00ffff",
    0.5: "#00ff00",
    0.75: "#ffff00",
    1.0: "#ff0000",
  },
};

export class HeatmapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shadowCanvas: HTMLCanvasElement;
  private shadowCtx: CanvasRenderingContext2D;
  private config: HeatmapConfig;
  private gradientPalette: Uint8ClampedArray | null = null;
  private points: HeatmapPoint[] = [];
  private maxValue: number = 1;

  constructor(canvas: HTMLCanvasElement, config: Partial<HeatmapConfig> = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Shadow canvas for alpha mask
    this.shadowCanvas = document.createElement("canvas");
    this.shadowCanvas.width = canvas.width;
    this.shadowCanvas.height = canvas.height;
    this.shadowCtx = this.shadowCanvas.getContext("2d")!;

    this.createGradientPalette();
  }

  private createGradientPalette() {
    const paletteCanvas = document.createElement("canvas");
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const ctx = paletteCanvas.getContext("2d")!;

    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    Object.entries(this.config.gradient).forEach(([stop, color]) => {
      gradient.addColorStop(parseFloat(stop), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);

    this.gradientPalette = ctx.getImageData(0, 0, 256, 1).data;
  }

  private drawPoint(x: number, y: number, value: number) {
    const { radius, blur } = this.config;
    const r = radius + blur;

    // Create radial gradient for each point
    const gradient = this.shadowCtx.createRadialGradient(x, y, 0, x, y, r);
    const alpha = Math.min(1, value / this.maxValue);
    
    gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.shadowCtx.fillStyle = gradient;
    this.shadowCtx.beginPath();
    this.shadowCtx.arc(x, y, r, 0, Math.PI * 2);
    this.shadowCtx.fill();
  }

  public setData(points: HeatmapPoint[]) {
    this.points = points;
    
    // Calculate max value for normalization
    this.maxValue = Math.max(1, ...points.map((p) => p.value));
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.shadowCanvas.width = width;
    this.shadowCanvas.height = height;
  }

  public render() {
    // Clear canvases
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shadowCtx.clearRect(0, 0, this.shadowCanvas.width, this.shadowCanvas.height);

    // Draw points to shadow canvas (alpha mask)
    this.points.forEach((point) => {
      this.drawPoint(point.x, point.y, point.value);
    });

    // Colorize the alpha mask
    this.colorize();
  }

  private colorize() {
    if (!this.gradientPalette) return;

    const imageData = this.shadowCtx.getImageData(
      0,
      0,
      this.shadowCanvas.width,
      this.shadowCanvas.height
    );
    const pixels = imageData.data;
    const { maxOpacity, minOpacity } = this.config;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3]; // Get alpha value
      if (alpha < 1) continue;

      // Map alpha to gradient palette index (0-255)
      const paletteIndex = Math.min(255, alpha) * 4;

      // Get color from gradient palette
      pixels[i] = this.gradientPalette[paletteIndex];      // R
      pixels[i + 1] = this.gradientPalette[paletteIndex + 1]; // G
      pixels[i + 2] = this.gradientPalette[paletteIndex + 2]; // B
      
      // Adjust final opacity
      const normalizedAlpha = alpha / 255;
      pixels[i + 3] = Math.round(
        (minOpacity + normalizedAlpha * (maxOpacity - minOpacity)) * 255
      );
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  public clear() {
    this.points = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shadowCtx.clearRect(0, 0, this.shadowCanvas.width, this.shadowCanvas.height);
  }
}

/**
 * Aggregate clicks into heatmap points with clustering
 */
export function aggregateClicksToPoints(
  clicks: Array<{ x: number; y: number; viewport_w: number }>,
  targetWidth: number,
  gridSize: number = 20
): HeatmapPoint[] {
  const grid = new Map<string, { x: number; y: number; count: number; totalX: number; totalY: number }>();

  clicks.forEach((click) => {
    // Scale X coordinate to target width
    const scale = targetWidth / (click.viewport_w || 1280);
    const scaledX = Math.round(click.x * scale);
    const scaledY = click.y; // Y doesn't need scaling

    // Grid cell key
    const cellX = Math.floor(scaledX / gridSize);
    const cellY = Math.floor(scaledY / gridSize);
    const key = `${cellX},${cellY}`;

    const existing = grid.get(key);
    if (existing) {
      existing.count++;
      existing.totalX += scaledX;
      existing.totalY += scaledY;
    } else {
      grid.set(key, { x: scaledX, y: scaledY, count: 1, totalX: scaledX, totalY: scaledY });
    }
  });

  // Convert to points with averaged positions
  return Array.from(grid.values()).map((cell) => ({
    x: Math.round(cell.totalX / cell.count),
    y: Math.round(cell.totalY / cell.count),
    value: cell.count,
  }));
}

/**
 * Create scroll depth visualization data
 */
export function createScrollDepthBands(
  scrolls: Array<{ scroll_percent: number; scroll_y: number }>,
  pageHeight: number
): Array<{ percent: number; count: number; y: number }> {
  const bands: Record<number, number> = {};

  // Initialize bands (0%, 10%, 20%, ... 100%)
  for (let i = 0; i <= 100; i += 10) {
    bands[i] = 0;
  }

  // Count scrolls per band
  scrolls.forEach((scroll) => {
    const band = Math.floor(scroll.scroll_percent / 10) * 10;
    bands[band] = (bands[band] || 0) + 1;
  });

  // Convert to array with Y positions
  return Object.entries(bands).map(([percent, count]) => ({
    percent: parseInt(percent),
    count,
    y: Math.round((parseInt(percent) / 100) * pageHeight),
  }));
}
