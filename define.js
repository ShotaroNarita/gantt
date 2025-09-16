const PALETTE = [
    '#F5E6D3', // 象牙色 - ゾウゲイロ
    '#E6B422', // 山吹色 - ヤマブキイロ
    '#F8C471', // 柑子色 - コウジイロ
    '#F39C12', // 橙色 - ダイダイイロ
    '#FF6B9D', // 桃色 - モモイロ
    '#FFB6C1', // 桜色 - サクライロ
    '#98FB98', // 若草色 - ワカクサイロ
    '#90EE90', // 萌黄色 - モエギイロ
    '#87CEEB', // 空色 - ソライロ
    '#B0E0E6', // 水色 - ミズイロ
    '#DDA0DD', // 薄紫 - ウスムラサキ
    '#E6E6FA', // 藤色 - フジイロ
    '#F0F8FF', // 白磁色 - ハクジイロ
    '#FFF8DC', // 胡粉色 - ゴフンイロ
    '#FFFACD', // 鳥の子色 - トリノコイロ
    '#F5DEB3'  // 砂色 - スナイロ
];

function stringToHash(str) {
    const FNV_OFFSET_BASIS = 2166136261;
    const FNV_PRIME = 16777619;

    let hash = FNV_OFFSET_BASIS;

    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * FNV_PRIME) >>> 0; // 32bit unsigned integer
    }

    return hash;
}

function createSeededRandom(seed) {
    let current = seed % 2147483647;
    if (current <= 0) current += 2147483646;

    return function () {
        current = current * 16807 % 2147483647;
        return (current - 1) / 2147483646;
    };
}

function selectColorByText(text) {
    // テキストをハッシュ値に変換
    const hash = stringToHash(text);

    const random = createSeededRandom(hash);

    const index = Math.floor(random() * PALETTE.length);

    return PALETTE[index];
}

let blocks = [];
let bars = [];

let blocks_by_bars = {};

function validate_date(date_str) {
    const date = days(date_str);
    if (!date.isValid()) return false;

    return dayjs(date_str).isValid();
}

class Block {
    constructor(begin, end, label) {
        this.id = crypto.randomUUID();


        if (!dayjs(begin).isValid()) {
            throw new Error(`Invalid begin date: ${begin}`);
        }
        if (!dayjs(end).isValid()) {
            throw new Error(`Invalid end date: ${end}`);
        }
        if (dayjs(end).isBefore(dayjs(begin))) {
            throw new Error(`End date must be after begin date: ${begin} - ${end}`);
        }

        this.begin = dayjs(begin).unix();
        this.end = dayjs(end).unix();

        this.label = label;
    }
};

class Bar {
    constructor(label) {
        this.id = crypto.randomUUID();
        this.label = label;
        blocks_by_bars[this.id] = [];
    }
};

const block1 = new Block('2024/06-01', '2024-06-05', 'Block 1');
const block2 = new Block('2024-06-03', '2024-06-10', 'Block 2');
const block3 = new Block('2024-06-15', '2024-06-20', 'Block 3');

const bar1 = new Bar('Bar 1');
const bar2 = new Bar('Bar 2');
const bar3 = new Bar('Bar 3');

blocks.push(block1);
blocks.push(block2);
blocks.push(block3);

bars.push(bar1);
bars.push(bar2);
bars.push(bar3);

blocks_by_bars[bar1.id] = [block1.id, block2.id];
blocks_by_bars[bar2.id] = [block3.id];

function add_block(begin, end, label) {
    const block = new Block(begin, end, label);
    blocks.push(block);
    return block.id;
}

function add_bar(label) {
    const bar = new Bar(label);
    bars.push(bar);
    return bar.id;
}

function assign_block_to_bar(block_id, bar_id) {
    if (!(bar_id in blocks_by_bars)) {
        blocks_by_bars[bar_id] = [];
    }
    blocks_by_bars[bar_id].push(block_id);
}

function join() {
    let metrics = { "max": -Infinity, "min": Infinity };
    for (let block of blocks) {
        metrics["max"] = Math.max(metrics["max"], block.end);
        metrics["min"] = Math.min(metrics["min"], block.begin);
    }

    metrics["range"] = metrics["max"] - metrics["min"];

    let rev = { "bars": [], "metrics": metrics };

    for (let bar of bars) {
        let rb = { ...bar };
        rb["blocks"] = []
        for (let blockid of blocks_by_bars[bar.id]) {
            let block = blocks.filter(b => b.id === blockid)[0];
            block["normalized"] = {
                "begin": (block.begin - metrics["min"]) / metrics["range"],
                "end": (block.end - metrics["min"]) / metrics["range"],
                "range": (block.end - block.begin) / metrics["range"],
            }
            rb["blocks"].push(block);
        }
        rev["bars"].push(rb);
    }

    return rev
}

join();

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const draw = () => {
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'aliceblue';
    ctx.fillRect(0, 0, width, height);
    const bar_height = 50;
    const bar_margin = 15;

    join().bars.forEach((bar, bar_index) => {
        const y = bar_index * (bar_height + bar_margin) + bar_margin;
        ctx.fillStyle = '#000000';
        ctx.fillText(bar.label, 10, y + bar_height / 2);

        bar.blocks.forEach(block => {
            const x = 100 + block.normalized.begin * (width - 150);
            const w = block.normalized.range * (width - 150);

            ctx.stroleStyle = '#000000';
            ctx.strokeRect(x, y, w, bar_height);

            ctx.fillStyle = selectColorByText(block.label);
            ctx.fillRect(x, y, w, bar_height);

            ctx.fillStyle = '#000000';
            ctx.fillText(block.label, x + 5, y + bar_height / 2);
        });
    });
};

draw();

// document.getElementById('code').textContent = JSON.stringify(join(), null, 2);