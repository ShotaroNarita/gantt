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
declare class Config {
    static readonly PALETTE: string[];
    static readonly CANVAS: CanvasConfig;
}
declare class Utils {
    static stringToHash(str: string): number;
    static createSeededRandom(seed: number): () => number;
    static selectColorByText(text: string): string;
    static validateDate(dateStr: string): boolean;
    static showError(message: string): void;
}
declare class Block {
    readonly id: string;
    readonly begin: number;
    readonly end: number;
    readonly label: string;
    constructor(begin: string, end: string, label: string);
    getDuration(): number;
    toJSON(): BlockData;
}
declare class Bar {
    readonly id: string;
    readonly label: string;
    readonly blocks: Array<Block>;
    constructor(label: string);
    addBlock(block: Block): void;
    removeBlock(blockId: string): void;
    toJSON(): BarData;
}
declare class DataManager {
    private bars;
    constructor();
    reset(): void;
    private initializeDefaultData;
    addBar(label: string): Bar;
    findBar(barId: string): Bar | undefined;
    addBlock(begin: string, end: string, label: string): Block;
    assignBlockToBar(block: Block, barId: string): string;
    getMetrics(): Metrics;
    exportData(): ExportData;
    importData(strData: string | ExportData): void;
    get allBars(): readonly Bar[];
}
declare class GanttCanvasRenderer {
    private canvas;
    private ctx;
    constructor(canvas: HTMLCanvasElement);
    render(data: ExportData): void;
    private clearCanvas;
    private drawBackground;
    private drawGrid;
    private drawBars;
    private drawBlock;
}
declare class GanttSvgRenderer {
    private container;
    private svg;
    private defs;
    private mainGroup;
    constructor(container: HTMLElement | string);
    private initializeSvg;
    private createSvgElement;
    render(data: ExportData): void;
    private clearContent;
    private createGradientDefs;
    private calculateDimensions;
    private drawBackground;
    private drawGrid;
    private drawBars;
    private drawBlock;
    private addInteractivity;
    private showTooltip;
    private hideTooltip;
    private handleBlockClick;
    highlightBlock(blockId: string): void;
    clearHighlights(): void;
    exportSvg(filename?: string): void;
    exportPng(filename?: string): void;
}
declare class FileHandler {
    private dataManager;
    constructor(dataManager: DataManager);
    private setupEventListeners;
    private handleDragOver;
    private handleDragLeave;
    private handleDrop;
    private handleFileSelect;
    private handleFiles;
    exportData(): void;
}
declare class UIController {
    private dataManager;
    private renderer;
    private fileHandler;
    constructor(dataManager: DataManager, renderer: GanttSvgRenderer, fileHandler: FileHandler);
    private setupEventListeners;
    private handleBarAdd;
    private handleBlockAdd;
    private updateBarDropdown;
    private updateDisplay;
    updateUI(): void;
}
declare class GanttApp {
    private dataManager;
    private renderer;
    private fileHandler;
    private uiController;
    constructor();
    private initialize;
    updateUI(): void;
}
declare let app: GanttApp;
//# sourceMappingURL=main.d.ts.map