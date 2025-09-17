// ===== 型定義 =====
interface BlockData {
    id: string;
    begin: number;
    end: number;
    label: string;
}

interface NormalizedBlock extends BlockData {
    normalized: {
        begin: number;
        end: number;
        range: number;
    };
}

interface BarData {
    id: string;
    label: string;
    blocks: BlockData[];
}

interface ExportBarData extends BarData {
    blocks: NormalizedBlock[];
}

interface Metrics {
    max: number;
    min: number;
    range: number;
}

interface ExportData {
    bars: ExportBarData[];
    metrics: Metrics;
}

interface CanvasConfig {
    MARGIN_LEFT: number;
    MARGIN_RIGHT: number;
    BAR_HEIGHT: number;
    BAR_MARGIN: number;
    GRID_LINES: number;
}

declare const dayjs: any;
declare const jsyaml: any;

// ===== 設定とユーティリティ =====
class Config {
    static readonly PALETTE: string[] = [
        '#F5E6D3', '#E6B422', '#F8C471', '#F39C12', '#FF6B9D', '#FFB6C1',
        '#98FB98', '#90EE90', '#87CEEB', '#B0E0E6', '#DDA0DD', '#E6E6FA',
        '#F0F8FF', '#FFF8DC', '#FFFACD', '#F5DEB3'
    ];

    static readonly CANVAS: CanvasConfig = {
        MARGIN_LEFT: 100,
        MARGIN_RIGHT: 50,
        BAR_HEIGHT: 50,
        BAR_MARGIN: 15,
        GRID_LINES: 10
    };
}

class Utils {
    static stringToHash(str: string): number {
        const FNV_OFFSET_BASIS = 2166136261;
        const FNV_PRIME = 16777619;
        let hash = FNV_OFFSET_BASIS;

        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * FNV_PRIME) >>> 0;
        }
        return hash;
    }

    static createSeededRandom(seed: number): () => number {
        let current = seed % 2147483647;
        if (current <= 0) current += 2147483646;

        return function (): number {
            current = current * 16807 % 2147483647;
            return (current - 1) / 2147483646;
        };
    }

    static selectColorByText(text: string): string {
        const hash = this.stringToHash(text);
        const random = this.createSeededRandom(hash);
        const index = Math.floor(random() * Config.PALETTE.length);
        return Config.PALETTE[index] as string;
    }

    static validateDate(dateStr: string): boolean {
        return dayjs(dateStr).isValid();
    }

    static showError(message: string): void {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        const container = document.querySelector('.container');
        if (container) {
            document.body.insertBefore(errorDiv, container);
        } else {
            document.body.appendChild(errorDiv);
        }
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// ===== データモデル =====
class Block {
    public readonly id: string;
    public readonly begin: number;
    public readonly end: number;
    public readonly label: string;

    constructor(begin: string, end: string, label: string) {
        this.id = crypto.randomUUID();

        if (!Utils.validateDate(begin)) {
            throw new Error(`無効な開始日: ${begin}`);
        }
        if (!Utils.validateDate(end)) {
            throw new Error(`無効な終了日: ${end}`);
        }
        if (dayjs(end).isBefore(dayjs(begin))) {
            throw new Error(`終了日は開始日より後である必要があります: ${begin} - ${end}`);
        }

        this.begin = dayjs(begin).unix();
        this.end = dayjs(end).unix();
        this.label = label;
    }

    getDuration(): number {
        return this.end - this.begin;
    }

    toJSON(): BlockData {
        return {
            id: this.id,
            begin: this.begin,
            end: this.end,
            label: this.label
        };
    }
}

class Bar {
    public readonly id: string;
    public readonly label: string;
    public readonly blocks: Array<Block>;

    constructor(label: string) {
        this.id = crypto.randomUUID();
        this.label = label;
        this.blocks = [];
    }

    addBlock(block: Block): void {
        this.blocks.push(block);
    }

    removeBlock(blockId: string): void {
        const index = this.blocks.findIndex(block => block.id === blockId);
        if (index !== -1) {
            this.blocks.splice(index, 1);
        }
    }

    toJSON(): BarData {
        return {
            id: this.id,
            label: this.label,
            blocks: this.blocks.map(block => block.toJSON())
        };
    }
}

// ===== データ管理 =====
class DataManager {
    private bars: Bar[];

    constructor() {
        this.bars = [];
        this.reset();
    }

    reset(): void {
        this.bars = [];
        this.initializeDefaultData();
    }

    private initializeDefaultData(): void {
        // デフォルトデータの作成
        const bar1 = this.addBar('プロジェクト A');
        const bar2 = this.addBar('プロジェクト B');
        const bar3 = this.addBar('プロジェクト C');

        try {
            const block1 = new Block('2024-06-01', '2024-06-05', 'フェーズ 1');
            const block2 = new Block('2024-06-03', '2024-06-10', 'フェーズ 2');
            const block3 = new Block('2024-06-15', '2024-06-20', 'フェーズ 3');

            this.assignBlockToBar(block1, bar1.id);
            this.assignBlockToBar(block2, bar1.id);
            this.assignBlockToBar(block3, bar2.id);
        } catch (error) {
            Utils.showError(`初期データ作成エラー: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    addBar(label: string): Bar {
        const bar = new Bar(label);
        this.bars.push(bar);
        return bar;
    }

    findBar(barId: string): Bar | undefined {
        return this.bars.find(bar => bar.id === barId);
    }

    addBlock(begin: string, end: string, label: string): Block {
        return new Block(begin, end, label);
    }

    assignBlockToBar(block: Block, barId: string): string {
        const bar = this.findBar(barId);
        if (!bar) {
            throw new Error(`バーが見つかりません: ${barId}`);
        }
        bar.addBlock(block);
        return block.id;
    }

    getMetrics(): Metrics {
        let max = -Infinity;
        let min = Infinity;

        this.bars.forEach(bar => {
            bar.blocks.forEach(block => {
                max = Math.max(max, block.end);
                min = Math.min(min, block.begin);
            });
        });

        return {
            max: max === -Infinity ? dayjs().unix() : max,
            min: min === Infinity ? dayjs().unix() : min,
            range: max - min || 86400 // 最小1日
        };
    }

    exportData(): ExportData {
        const metrics = this.getMetrics();

        return {
            bars: this.bars.map(bar => ({
                ...bar.toJSON(),
                blocks: bar.blocks.map(block => ({
                    ...block.toJSON(),
                    normalized: {
                        begin: (block.begin - metrics.min) / metrics.range,
                        end: (block.end - metrics.min) / metrics.range,
                        range: (block.end - block.begin) / metrics.range
                    }
                }))
            })),
            metrics
        };
    }

    importData(strData: string | ExportData): void {
        try {
            const data: ExportData = typeof strData === 'string' ? jsyaml.load(strData) : strData;

            this.bars = [];

            data.bars.forEach(barData => {
                const bar = new Bar(barData.label);

                barData.blocks.forEach(blockData => {
                    const block = new Block(
                        dayjs.unix(blockData.begin).format('YYYY-MM-DD'),
                        dayjs.unix(blockData.end).format('YYYY-MM-DD'),
                        blockData.label
                    );
                    bar.addBlock(block);
                });

                this.bars.push(bar);
            });
        } catch (error) {
            throw new Error(`データインポートエラー: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    get allBars(): readonly Bar[] {
        return this.bars;
    }
}

// ===== レンダラー =====
class GanttCanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas context を取得できませんでした');
        }
        this.ctx = context;
    }

    render(data: ExportData): void {
        this.clearCanvas();
        this.drawBackground();
        this.drawGrid(data.metrics);
        this.drawBars(data.bars, data.metrics);
    }

    private clearCanvas(): void {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
    }

    private drawBackground(): void {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = 'aliceblue';
        this.ctx.fillRect(0, 0, width, height);
    }

    private drawGrid(metrics: Metrics): void {
        const { width, height } = this.canvas;
        const { MARGIN_LEFT, GRID_LINES } = Config.CANVAS;

        this.ctx.strokeStyle = '#cccccc';
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px Arial';

        for (let i = 0; i <= GRID_LINES; i++) {
            const x = MARGIN_LEFT + i * (width - MARGIN_LEFT - Config.CANVAS.MARGIN_RIGHT) / GRID_LINES;

            // 縦線を描画
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();

            // 日付ラベルを描画
            const timestamp = metrics.min + i * metrics.range / GRID_LINES;
            const date = dayjs.unix(timestamp).format('YYYY/MM/DD');
            this.ctx.fillText(date, x - 15, height - 10 - (i % 3) * 15);
        }
    }

    private drawBars(bars: ExportBarData[], metrics: Metrics): void {
        const { width } = this.canvas;
        const { MARGIN_LEFT, MARGIN_RIGHT, BAR_HEIGHT, BAR_MARGIN } = Config.CANVAS;

        bars.forEach((bar, barIndex) => {
            const y = barIndex * (BAR_HEIGHT + BAR_MARGIN) + BAR_MARGIN;

            // バーラベルを描画
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(bar.label, 10, y + BAR_HEIGHT / 2 + 5);

            // ブロックを描画
            bar.blocks.forEach(block => {
                this.drawBlock(block, y, width - MARGIN_LEFT - MARGIN_RIGHT);
            });
        });
    }

    private drawBlock(block: NormalizedBlock, y: number, availableWidth: number): void {
        const { MARGIN_LEFT, BAR_HEIGHT } = Config.CANVAS;

        const x = MARGIN_LEFT + block.normalized.begin * availableWidth;
        const w = Math.max(block.normalized.range * availableWidth, 1); // 最小幅1px

        // ブロックの背景を描画
        this.ctx.fillStyle = Utils.selectColorByText(block.label);
        this.ctx.fillRect(x, y, w, BAR_HEIGHT);

        // ブロックの枠線を描画
        this.ctx.strokeStyle = '#000000';
        this.ctx.strokeRect(x, y, w, BAR_HEIGHT);

        // ブロックラベルを描画
        if (w > 60) { // 幅が十分な場合のみラベルを表示
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(block.label, x + 5, y + BAR_HEIGHT / 2 + 4);
        }
    }
}

// ===== SVGレンダラー =====
class GanttSvgRenderer {
    private container: HTMLElement;
    private svg!: SVGSVGElement;
    private defs!: SVGDefsElement;
    private mainGroup!: SVGGElement;

    constructor(container: HTMLElement | string) {
        if (typeof container === 'string') {
            const element = document.getElementById(container);
            if (!element) {
                throw new Error(`要素が見つかりません: ${container}`);
            }
            this.container = element;
        } else {
            this.container = container;
        }

        this.initializeSvg();
    }

    private initializeSvg(): void {
        // 既存のSVGがあれば削除
        const existingSvg = this.container.querySelector('svg');
        if (existingSvg) {
            existingSvg.remove();
        }

        // SVG要素を作成
        this.svg = this.createSvgElement('svg', {
            width: '100%',
            height: '500',
            viewBox: '0 0 1000 500',
            xmlns: 'http://www.w3.org/2000/svg'
        });

        // デフィニション要素を作成（パターン、グラデーション等用）
        this.defs = this.createSvgElement('defs') as SVGDefsElement;
        this.svg.appendChild(this.defs);

        // メイングループを作成
        this.mainGroup = this.createSvgElement('g', {
            id: 'main-group'
        }) as SVGGElement;
        this.svg.appendChild(this.mainGroup);

        this.container.appendChild(this.svg);
    }

    private createSvgElement<T extends SVGElement>(
        tagName: string,
        attributes: Record<string, string | number> = {}
    ): T {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tagName) as T;
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, String(value));
        });

        return element;
    }

    render(data: ExportData): void {
        this.clearContent();
        this.createGradientDefs();
        this.calculateDimensions(data);
        this.drawBackground();
        this.drawGrid(data.metrics);
        this.drawBars(data.bars, data.metrics);
        this.addInteractivity();
    }

    private clearContent(): void {
        // メイングループの内容をクリア
        this.mainGroup.innerHTML = '';
        // デフィニションもクリア
        this.defs.innerHTML = '';
    }

    private createGradientDefs(): void {
        // ブロック用のグラデーションを作成
        const gradient = this.createSvgElement('linearGradient', {
            id: 'blockGradient',
            x1: '0%',
            y1: '0%',
            x2: '0%',
            y2: '100%'
        });

        const stop1 = this.createSvgElement('stop', {
            offset: '0%',
            'stop-color': 'rgba(255,255,255,0.3)'
        });

        const stop2 = this.createSvgElement('stop', {
            offset: '100%',
            'stop-color': 'rgba(0,0,0,0.1)'
        });

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        this.defs.appendChild(gradient);

        // ホバー用のドロップシャドウフィルターを作成
        const filter = this.createSvgElement('filter', {
            id: 'dropShadow',
            x: '-20%',
            y: '-20%',
            width: '140%',
            height: '140%'
        });

        const feDropShadow = this.createSvgElement('feDropShadow', {
            dx: '2',
            dy: '2',
            'flood-color': 'rgba(0,0,0,0.3)',
            'flood-opacity': '0.5'
        });

        filter.appendChild(feDropShadow);
        this.defs.appendChild(filter);
    }

    private calculateDimensions(data: ExportData): void {
        const barCount = data.bars.length;
        const requiredHeight = Math.max(
            barCount * (Config.CANVAS.BAR_HEIGHT + Config.CANVAS.BAR_MARGIN) + Config.CANVAS.BAR_MARGIN + 100,
            500
        );

        this.svg.setAttribute('height', String(requiredHeight));
        this.svg.setAttribute('viewBox', `0 0 1000 ${requiredHeight}`);
    }

    private drawBackground(): void {
        const rect = this.createSvgElement('rect', {
            x: '0',
            y: '0',
            width: '100%',
            height: '100%',
            fill: 'aliceblue',
            'fill-opacity': '0.3'
        });

        this.mainGroup.appendChild(rect);
    }

    private drawGrid(metrics: Metrics): void {
        const gridGroup = this.createSvgElement('g', {
            id: 'grid-group',
            'stroke': '#cccccc',
            'stroke-width': '1',
            'stroke-opacity': '0.7'
        }) as SVGGElement;

        const labelsGroup = this.createSvgElement('g', {
            id: 'grid-labels',
            'font-family': 'Arial, sans-serif',
            'font-size': '12',
            'fill': '#666666',
            'text-anchor': 'middle'
        }) as SVGGElement;

        const { MARGIN_LEFT, MARGIN_RIGHT, GRID_LINES } = Config.CANVAS;
        const svgWidth = 1000; // viewBox width
        const availableWidth = svgWidth - MARGIN_LEFT - MARGIN_RIGHT;

        for (let i = 0; i <= GRID_LINES; i++) {
            const x = MARGIN_LEFT + (i * availableWidth) / GRID_LINES;

            // 縦線
            const line = this.createSvgElement('line', {
                x1: x,
                y1: '0',
                x2: x,
                y2: '100%'
            });
            gridGroup.appendChild(line);

            // 日付ラベル
            const timestamp = metrics.min + (i * metrics.range) / GRID_LINES;
            const date = dayjs.unix(timestamp).format('YYYY/MM/DD');
            
            const text = this.createSvgElement('text', {
                x: x,
                y: `calc(100% - ${20 + (i % 3) * 15}px)`,
                'dominant-baseline': 'text-before-edge'
            });
            text.textContent = date;
            labelsGroup.appendChild(text);
        }

        this.mainGroup.appendChild(gridGroup);
        this.mainGroup.appendChild(labelsGroup);
    }

    private drawBars(bars: ExportBarData[], metrics: Metrics): void {
        const barsGroup = this.createSvgElement('g', {
            id: 'bars-group'
        }) as SVGGElement;

        const { MARGIN_LEFT, MARGIN_RIGHT, BAR_HEIGHT, BAR_MARGIN } = Config.CANVAS;
        const svgWidth = 1000;
        const availableWidth = svgWidth - MARGIN_LEFT - MARGIN_RIGHT;

        bars.forEach((bar, barIndex) => {
            const y = barIndex * (BAR_HEIGHT + BAR_MARGIN) + BAR_MARGIN;

            // バーグループを作成
            const barGroup = this.createSvgElement('g', {
                id: `bar-${bar.id}`,
                class: 'bar-group'
            }) as SVGGElement;

            // バーラベル
            const barLabel = this.createSvgElement('text', {
                x: '10',
                y: y + BAR_HEIGHT / 2,
                'font-family': 'Arial, sans-serif',
                'font-size': '14',
                'font-weight': 'bold',
                'fill': '#000000',
                'dominant-baseline': 'middle'
            });
            barLabel.textContent = bar.label;
            barGroup.appendChild(barLabel);

            // ブロックを描画
            bar.blocks.forEach((block, blockIndex) => {
                const blockElement = this.drawBlock(block, y, availableWidth, blockIndex);
                barGroup.appendChild(blockElement);
            });

            barsGroup.appendChild(barGroup);
        });

        this.mainGroup.appendChild(barsGroup);
    }

    private drawBlock(block: NormalizedBlock, y: number, availableWidth: number, blockIndex: number): SVGGElement {
        const { MARGIN_LEFT, BAR_HEIGHT } = Config.CANVAS;

        const x = MARGIN_LEFT + block.normalized.begin * availableWidth;
        const w = Math.max(block.normalized.range * availableWidth, 2); // 最小幅2px

        // ブロックグループ
        const blockGroup = this.createSvgElement('g', {
            id: `block-${block.id}`,
            class: 'block-group',
            'data-block-id': block.id,
            'data-label': block.label,
            'data-begin': dayjs.unix(block.begin).format('YYYY-MM-DD'),
            'data-end': dayjs.unix(block.end).format('YYYY-MM-DD')
        }) as SVGGElement;

        // ブロックの背景矩形
        const blockRect = this.createSvgElement('rect', {
            x: x,
            y: y,
            width: w,
            height: BAR_HEIGHT,
            fill: Utils.selectColorByText(block.label),
            stroke: '#000000',
            'stroke-width': '1',
            'stroke-opacity': '0.8',
            rx: '2', // 角を少し丸める
            ry: '2'
        });

        // グラデーションオーバーレイ
        const gradientOverlay = this.createSvgElement('rect', {
            x: x,
            y: y,
            width: w,
            height: BAR_HEIGHT,
            fill: 'url(#blockGradient)',
            'pointer-events': 'none',
            rx: '2',
            ry: '2'
        });

        blockGroup.appendChild(blockRect);
        blockGroup.appendChild(gradientOverlay);

        // ラベルテキスト（幅が十分な場合のみ）
        if (w > 60) {
            const blockLabel = this.createSvgElement('text', {
                x: x + 5,
                y: y + BAR_HEIGHT / 2,
                'font-family': 'Arial, sans-serif',
                'font-size': '12',
                'fill': '#000000',
                'dominant-baseline': 'middle',
                'pointer-events': 'none' // テキストをクリック対象から除外
            });
            blockLabel.textContent = block.label;
            blockGroup.appendChild(blockLabel);
        }

        return blockGroup;
    }

    private addInteractivity(): void {
        // ホバー効果
        const blocks = this.mainGroup.querySelectorAll('.block-group');
        
        blocks.forEach(block => {
            const rect = block.querySelector('rect:first-child') as SVGRectElement;
            if (!rect) return;

            block.addEventListener('mouseenter', () => {
                rect.setAttribute('filter', 'url(#dropShadow)');
                rect.setAttribute('stroke-width', '2');
                this.showTooltip(block as SVGGElement);
            });

            block.addEventListener('mouseleave', () => {
                rect.removeAttribute('filter');
                rect.setAttribute('stroke-width', '1');
                this.hideTooltip();
            });

            block.addEventListener('click', () => {
                this.handleBlockClick(block as SVGGElement);
            });
        });
    }

    private showTooltip(blockElement: SVGGElement): void {
        const label = blockElement.getAttribute('data-label') || '';
        const begin = blockElement.getAttribute('data-begin') || '';
        const end = blockElement.getAttribute('data-end') || '';

        // 既存のツールチップを削除
        this.hideTooltip();

        const tooltip = this.createSvgElement('g', {
            id: 'tooltip',
            'pointer-events': 'none'
        }) as SVGGElement;

        const tooltipText = `${label}\n${begin} → ${end}`;
        const lines = tooltipText.split('\n');

        // ツールチップの背景
        const tooltipBg = this.createSvgElement('rect', {
            x: '0',
            y: '0',
            width: Math.max(...lines.map(line => line.length * 7)) + 16,
            height: lines.length * 16 + 8,
            fill: '#333333',
            'fill-opacity': '0.9',
            stroke: '#666666',
            'stroke-width': '1',
            rx: '4',
            ry: '4'
        });

        tooltip.appendChild(tooltipBg);

        // ツールチップのテキスト
        lines.forEach((line, index) => {
            const text = this.createSvgElement('text', {
                x: '8',
                y: 16 + index * 16,
                'font-family': 'Arial, sans-serif',
                'font-size': '12',
                'fill': '#ffffff'
            });
            text.textContent = line;
            tooltip.appendChild(text);
        });

        // マウス位置の近くに配置（簡易実装）
        tooltip.setAttribute('transform', 'translate(100, 50)');

        this.svg.appendChild(tooltip);
    }

    private hideTooltip(): void {
        const tooltip = this.svg.querySelector('#tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    private handleBlockClick(blockElement: SVGGElement): void {
        const blockId = blockElement.getAttribute('data-block-id');
        const label = blockElement.getAttribute('data-label');
        
        console.log('Block clicked:', { blockId, label });
        
        // カスタムイベントを発火
        const event = new CustomEvent('blockClick', {
            detail: {
                blockId,
                label,
                begin: blockElement.getAttribute('data-begin'),
                end: blockElement.getAttribute('data-end')
            }
        });
        
        this.container.dispatchEvent(event);
    }

    // パブリックメソッド: 特定のブロックをハイライト
    public highlightBlock(blockId: string): void {
        // 既存のハイライトを削除
        this.clearHighlights();

        const blockElement = this.mainGroup.querySelector(`[data-block-id="${blockId}"]`);
        if (blockElement) {
            const rect = blockElement.querySelector('rect:first-child') as SVGRectElement;
            if (rect) {
                rect.setAttribute('stroke', '#ff0000');
                rect.setAttribute('stroke-width', '3');
                rect.setAttribute('filter', 'url(#dropShadow)');
            }
        }
    }

    // パブリックメソッド: ハイライトをクリア
    public clearHighlights(): void {
        const highlightedBlocks = this.mainGroup.querySelectorAll('.block-group rect[stroke="#ff0000"]');
        highlightedBlocks.forEach(rect => {
            rect.setAttribute('stroke', '#000000');
            rect.setAttribute('stroke-width', '1');
            rect.removeAttribute('filter');
        });
    }

    // パブリックメソッド: SVGをダウンロード
    public exportSvg(filename: string = `gantt_chart_${dayjs().format('YYYY-MM-DD')}.svg`): void {
        const svgData = new XMLSerializer().serializeToString(this.svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // パブリックメソッド: PNGとしてエクスポート
    public exportPng(filename: string = `gantt_chart_${dayjs().format('YYYY-MM-DD')}.png`): void {
        const svgData = new XMLSerializer().serializeToString(this.svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Canvas context を取得できませんでした');
        }

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = img.width || 1000;
            canvas.height = img.height || 500;
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(blob => {
                if (blob) {
                    const pngUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = pngUrl;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(pngUrl);
                }
            }, 'image/png');

            URL.revokeObjectURL(url);
        };

        img.src = url;
    }
}

// ===== ファイル操作 =====
class FileHandler {
    private dataManager: DataManager;

    constructor(dataManager: DataManager) {
        this.dataManager = dataManager;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const uploadArea = document.getElementById('uploadArea') as HTMLDivElement;
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;

        if (!uploadArea || !fileInput) {
            throw new Error('必要なDOM要素が見つかりません');
        }

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver);
        uploadArea.addEventListener('dragleave', this.handleDragLeave);
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    private handleDragOver(e: DragEvent): void {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.add('dragover');
    }

    private handleDragLeave(e: DragEvent): void {
        (e.currentTarget as HTMLElement).classList.remove('dragover');
    }

    private handleDrop(e: DragEvent): void {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.remove('dragover');
        if (e.dataTransfer?.files) {
            this.handleFiles(e.dataTransfer.files);
        }
    }

    private handleFileSelect(e: Event): void {
        const target = e.target as HTMLInputElement;
        if (target.files) {
            this.handleFiles(target.files);
        }
    }

    private handleFiles(files: FileList): void {
        Array.from(files).forEach(file => {
            if (file.type === 'application/yaml' || file.name.endsWith('.yaml')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const result = e.target?.result;
                        if (typeof result === 'string') {
                            this.dataManager.importData(result);
                            if (typeof app !== 'undefined') {
                                app.updateUI();
                            }
                        }
                    } catch (error) {
                        Utils.showError(`ファイル読み込みエラー: ${error instanceof Error ? error.message : String(error)}`);
                    }
                };
                reader.readAsText(file);
            } else {
                Utils.showError('JSONファイルを選択してください');
            }
        });
    }

    exportData(): void {
        const data = this.dataManager.exportData();
        const blob = new Blob([jsyaml.dump(data)], {
            type: 'application/yaml;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gantt_data_${dayjs().format('YYYY-MM-DD')}.yaml`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ===== UIコントローラー =====
class UIController {
    private dataManager: DataManager;
    private renderer: GanttSvgRenderer;
    private fileHandler: FileHandler;

    constructor(dataManager: DataManager, renderer: GanttSvgRenderer, fileHandler: FileHandler) {
        this.dataManager = dataManager;
        this.renderer = renderer;
        this.fileHandler = fileHandler;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        const barRegisterBtn = document.getElementById('bar_register') as HTMLButtonElement;
        const blockRegisterBtn = document.getElementById('block_register') as HTMLButtonElement;
        const exportBtn = document.getElementById('export_button') as HTMLButtonElement;

        if (!barRegisterBtn || !blockRegisterBtn || !exportBtn) {
            throw new Error('必要なボタン要素が見つかりません');
        }

        barRegisterBtn.addEventListener('click', this.handleBarAdd.bind(this));
        blockRegisterBtn.addEventListener('click', this.handleBlockAdd.bind(this));
        exportBtn.addEventListener('click', () => this.fileHandler.exportData());
    }

    private handleBarAdd(): void {
        const barLabelInput = document.getElementById('bar_label') as HTMLInputElement;
        if (!barLabelInput) {
            Utils.showError('バーラベル入力欄が見つかりません');
            return;
        }

        const label = barLabelInput.value.trim();

        if (!label) {
            Utils.showError('バー名を入力してください');
            return;
        }

        this.dataManager.addBar(label);
        this.updateBarDropdown(label);
        this.updateDisplay();
        barLabelInput.value = '';
    }

    private handleBlockAdd(): void {
        const blockBarSelect = document.getElementById('block_bar') as HTMLSelectElement;
        const blockLabelInput = document.getElementById('block_label') as HTMLInputElement;
        const blockBeginInput = document.getElementById('block_begin') as HTMLInputElement;
        const blockEndInput = document.getElementById('block_end') as HTMLInputElement;

        if (!blockBarSelect || !blockLabelInput || !blockBeginInput || !blockEndInput) {
            Utils.showError('必要な入力要素が見つかりません');
            return;
        }

        const barId = blockBarSelect.value;
        const label = blockLabelInput.value.trim();
        const begin = blockBeginInput.value;
        const end = blockEndInput.value;

        if (!barId) {
            Utils.showError('バーを選択してください');
            return;
        }
        if (!label) {
            Utils.showError('ブロック名を入力してください');
            return;
        }
        if (!begin || !end) {
            Utils.showError('開始日と終了日を入力してください');
            return;
        }

        try {
            const block = this.dataManager.addBlock(begin, end, label);
            this.dataManager.assignBlockToBar(block, barId);
            this.updateDisplay();

            // フォームをクリア
            blockLabelInput.value = '';
            blockBeginInput.value = '';
            blockEndInput.value = '';
        } catch (error) {
            Utils.showError(error instanceof Error ? error.message : String(error));
        }
    }

    private updateBarDropdown(selectedLabel?: string): void {
        const dropdown = document.getElementById('block_bar') as HTMLSelectElement;
        if (!dropdown) {
            Utils.showError('バー選択ドロップダウンが見つかりません');
            return;
        }

        dropdown.innerHTML = '<option value="">バーを選択</option>';

        this.dataManager.allBars.forEach(bar => {
            const option = document.createElement('option');
            option.value = bar.id;
            option.textContent = bar.label;
            dropdown.appendChild(option);
        });

        if (selectedLabel) {
            const targetBar = this.dataManager.allBars.find(bar => bar.label === selectedLabel);
            if (targetBar) {
                dropdown.value = targetBar.id;
            }
        }
    }

    private updateDisplay(): void {
        const data = this.dataManager.exportData();
        this.renderer.render(data);
        
        const codeElement = document.getElementById('code') as HTMLPreElement;
        if (codeElement) {
            codeElement.textContent =  jsyaml.dump(data);
        }
    }

    updateUI(): void {
        this.updateBarDropdown();
        this.updateDisplay();
    }
}

// ===== アプリケーション初期化 =====
class GanttApp {
    private dataManager: DataManager;
    private renderer: GanttSvgRenderer;
    private fileHandler: FileHandler;
    private uiController: UIController;

    constructor() {
        const canvas = document.getElementById('canvas') as HTMLElement;
        if (!canvas) {
            throw new Error('Canvas要素が見つかりません');
        }

        this.dataManager = new DataManager();
        this.renderer = new GanttSvgRenderer(canvas);
        this.fileHandler = new FileHandler(this.dataManager);
        this.uiController = new UIController(this.dataManager, this.renderer, this.fileHandler);

        this.initialize();
    }

    private initialize(): void {
        this.updateUI();
    }

    updateUI(): void {
        this.uiController.updateUI();
    }
}

// アプリケーション開始
let app: GanttApp;
document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new GanttApp();
    } catch (error) {
        console.error('アプリケーションの初期化に失敗しました:', error);
        Utils.showError(`アプリケーションの初期化に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
});