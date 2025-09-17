
// ===== 設定とユーティリティ =====
class Config {
    static PALETTE = [
        '#F5E6D3', '#E6B422', '#F8C471', '#F39C12', '#FF6B9D', '#FFB6C1',
        '#98FB98', '#90EE90', '#87CEEB', '#B0E0E6', '#DDA0DD', '#E6E6FA',
        '#F0F8FF', '#FFF8DC', '#FFFACD', '#F5DEB3'
    ];

    static CANVAS = {
        MARGIN_LEFT: 100,
        MARGIN_RIGHT: 50,
        BAR_HEIGHT: 50,
        BAR_MARGIN: 15,
        GRID_LINES: 10
    };
}

class Utils {
    static stringToHash(str) {
        const FNV_OFFSET_BASIS = 2166136261;
        const FNV_PRIME = 16777619;
        let hash = FNV_OFFSET_BASIS;

        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * FNV_PRIME) >>> 0;
        }
        return hash;
    }

    static createSeededRandom(seed) {
        let current = seed % 2147483647;
        if (current <= 0) current += 2147483646;

        return function () {
            current = current * 16807 % 2147483647;
            return (current - 1) / 2147483646;
        };
    }

    static selectColorByText(text) {
        const hash = this.stringToHash(text);
        const random = this.createSeededRandom(hash);
        const index = Math.floor(random() * Config.PALETTE.length);
        return Config.PALETTE[index];
    }

    static validateDate(dateStr) {
        return dayjs(dateStr).isValid();
    }

    static showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.querySelector('.container'));
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// ===== データモデル =====
class Block {
    constructor(begin, end, label) {
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

    getDuration() {
        return this.end - this.begin;
    }

    toJSON() {
        return {
            id: this.id,
            begin: this.begin,
            end: this.end,
            label: this.label
        };
    }
}

class Bar {
    constructor(label) {
        this.id = crypto.randomUUID();
        this.label = label;
        this.blocks = [];
    }

    addBlock(block) {
        this.blocks.push(block);
    }

    removeBlock(blockId) {
        this.blocks = this.blocks.filter(block => block.id !== blockId);
    }

    toJSON() {
        return {
            id: this.id,
            label: this.label,
            blocks: this.blocks.map(block => block.toJSON())
        };
    }
}

// ===== データ管理 =====
class DataManager {
    constructor() {
        this.bars = [];
        this.reset();
    }

    reset() {
        this.bars = [];
        this.initializeDefaultData();
    }

    initializeDefaultData() {
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
            Utils.showError(`初期データ作成エラー: ${error.message}`);
        }
    }

    addBar(label) {
        const bar = new Bar(label);
        this.bars.push(bar);
        return bar;
    }

    findBar(barId) {
        return this.bars.find(bar => bar.id === barId);
    }

    addBlock(begin, end, label) {
        return new Block(begin, end, label);
    }

    assignBlockToBar(block, barId) {
        const bar = this.findBar(barId);
        if (!bar) {
            throw new Error(`バーが見つかりません: ${barId}`);
        }
        bar.addBlock(block);
        return block.id;
    }

    getMetrics() {
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

    exportData() {
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

    importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

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
            throw new Error(`データインポートエラー: ${error.message}`);
        }
    }
}

// ===== レンダラー =====
class GanttRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    render(data) {
        this.clearCanvas();
        this.drawBackground();
        this.drawGrid(data.metrics);
        this.drawBars(data.bars, data.metrics);
    }

    clearCanvas() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
    }

    drawBackground() {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = 'aliceblue';
        this.ctx.fillRect(0, 0, width, height);
    }

    drawGrid(metrics) {
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
            const date = dayjs.unix(timestamp).format('MM/DD');
            this.ctx.fillText(date, x - 15, height - 10 - (i % 3) * 15);
        }
    }

    drawBars(bars, metrics) {
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

    drawBlock(block, y, availableWidth) {
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

// ===== ファイル操作 =====
class FileHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver);
        uploadArea.addEventListener('dragleave', this.handleDragLeave);
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        this.handleFiles(e.dataTransfer.files);
    }

    handleFileSelect(e) {
        this.handleFiles(e.target.files);
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        this.dataManager.importData(e.target.result);
                        app.updateUI();
                        Utils.showError = (msg) => alert('データを正常に読み込みました');
                        Utils.showError('データを正常に読み込みました');
                    } catch (error) {
                        Utils.showError(`ファイル読み込みエラー: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            } else {
                Utils.showError('JSONファイルを選択してください');
            }
        });
    }

    exportData() {
        const data = this.dataManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gantt_data_${dayjs().format('YYYY-MM-DD')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ===== UIコントローラー =====
class UIController {
    constructor(dataManager, renderer, fileHandler) {
        this.dataManager = dataManager;
        this.renderer = renderer;
        this.fileHandler = fileHandler;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('bar_register').addEventListener('click', this.handleBarAdd.bind(this));
        document.getElementById('block_register').addEventListener('click', this.handleBlockAdd.bind(this));
        document.getElementById('export_button').addEventListener('click', () => this.fileHandler.exportData());
    }

    handleBarAdd() {
        const label = document.getElementById('bar_label').value.trim();

        if (!label) {
            Utils.showError('バー名を入力してください');
            return;
        }

        this.dataManager.addBar(label);
        this.updateBarDropdown(label);
        this.updateDisplay();
        document.getElementById('bar_label').value = '';
    }

    handleBlockAdd() {
        const barId = document.getElementById('block_bar').value;
        const label = document.getElementById('block_label').value.trim();
        const begin = document.getElementById('block_begin').value;
        const end = document.getElementById('block_end').value;

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
            document.getElementById('block_label').value = '';
            document.getElementById('block_begin').value = '';
            document.getElementById('block_end').value = '';
        } catch (error) {
            Utils.showError(error.message);
        }
    }

    updateBarDropdown(selectedLabel = null) {
        const dropdown = document.getElementById('block_bar');
        dropdown.innerHTML = '<option value="">バーを選択</option>';

        this.dataManager.bars.forEach(bar => {
            const option = document.createElement('option');
            option.value = bar.id;
            option.textContent = bar.label;
            dropdown.appendChild(option);
        });

        if (selectedLabel) {
            const targetBar = this.dataManager.bars.find(bar => bar.label === selectedLabel);
            if (targetBar) {
                dropdown.value = targetBar.id;
            }
        }
    }

    updateDisplay() {
        const data = this.dataManager.exportData();
        this.renderer.render(data);
        document.getElementById('code').textContent = JSON.stringify(data, null, 2);
    }

    updateUI() {
        this.updateBarDropdown();
        this.updateDisplay();
    }
}

// ===== アプリケーション初期化 =====
class GanttApp {
    constructor() {
        this.dataManager = new DataManager();
        this.renderer = new GanttRenderer(document.getElementById('canvas'));
        this.fileHandler = new FileHandler(this.dataManager);
        this.uiController = new UIController(this.dataManager, this.renderer, this.fileHandler);

        this.initialize();
    }

    initialize() {
        this.updateUI();
    }

    updateUI() {
        this.uiController.updateUI();
    }
}

// アプリケーション開始
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GanttApp();
});