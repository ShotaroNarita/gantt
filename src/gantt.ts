import * as dayjs from "dayjs";

interface RangeInput {
    begin: string
    end: string
}

interface RangeUnixtime {
    begin: number
    end: number
}

interface Gantt {
    title: string
    slots: Slot[];
}

interface Slot {
    title: string
    events: Event[];
    color?: string
}

interface Event {
    title: string
    range: RangeInput
    color?: string
}

interface GanttRender {
    title: string
    slots: SlotRender[];
    range: RangeUnixtime
}

interface SlotRender {
    title: string
    events: EventRender[];
    range: RangeUnixtime
    color?: string
}

interface EventRender {
    title: string
    range: RangeUnixtime
    color?: string
}

// convert Event -> EventRender

function convert(gantt: Gantt): GanttRender {
    let gr = {} as GanttRender;
    gr.title = gantt.title;
    gr.slots = [];

    let global_begin = Number.MAX_SAFE_INTEGER;
    let global_end = Number.MIN_SAFE_INTEGER;

    for (let slot of gantt.slots) {
        let sr = {} as SlotRender;
        sr.title = slot.title;
        sr.events = [];

        let local_begin = Number.MAX_SAFE_INTEGER;
        let local_end = Number.MIN_SAFE_INTEGER;

        for (let event of slot.events) {
            const b = dayjs(event.range.begin).unix()
            const e = dayjs(event.range.end).unix()
            if (b < local_begin) local_begin = b;
            if (e > local_end) local_end = e;

            let er = {} as EventRender;
            er.title = event.title;
            er.range = { begin: b, end: e };
            sr.events.push({...event, ...er} as EventRender);
        }

        sr.range = { begin: local_begin, end: local_end };
        gr.slots.push(sr);

        if (local_begin < global_begin) global_begin = local_begin;
        if (local_end > global_end) global_end = local_end;
    }

    gr.range = { begin: global_begin, end: global_end };

    return gr;
}

export { Gantt, Slot, Event, RangeInput, convert };


// SVG生成の設定
interface SvgConfig {
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    slotHeight: number;
    titleHeight: number;
    colors: string[];
}

const defaultConfig: SvgConfig = {
    width: 800,
    height: 600,
    margin: { top: 60, right: 40, bottom: 40, left: 150 },
    slotHeight: 40,
    titleHeight: 30,
    colors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22']
};

/**
 * 時間範囲をピクセル座標に変換する関数
 */
function timeToX(timestamp: number, range: RangeUnixtime, chartWidth: number): number {
    const totalDuration = range.end - range.begin;
    const relativeTime = timestamp - range.begin;
    return (relativeTime / totalDuration) * chartWidth;
}

/**
 * 時間軸（X軸）を描画する関数
 */
function generateTimeAxis(range: RangeUnixtime, config: SvgConfig): string {
    const chartWidth = config.width - config.margin.left - config.margin.right;
    const axisY = config.margin.top + config.titleHeight;

    // 時間軸の線
    let axis = `<line x1="${config.margin.left}" y1="${axisY}" x2="${config.margin.left + chartWidth}" y2="${axisY}" stroke="#333" stroke-width="1"/>`;

    // 時間ラベルを生成（開始、中間、終了）
    const timestamps = [
        range.begin,
        range.begin + (range.end - range.begin) / 2,
        range.end
    ];

    timestamps.forEach(timestamp => {
        const x = config.margin.left + timeToX(timestamp, range, chartWidth);
        const date = dayjs(timestamp * 1000);
        const label = date.format('YYYY/MM/DD');

        axis += `<line x1="${x}" y1="${axisY - 5}" x2="${x}" y2="${axisY + 5}" stroke="#333" stroke-width="1"/>`;
        axis += `<text x="${x}" y="${axisY - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666">${label}</text>`;
    });

    return axis;
}

/**
 * イベントバーを描画する関数
 */
function generateEventBar(event: EventRender, y: number, range: RangeUnixtime, config: SvgConfig, colorIndex: number): string {
    const chartWidth = config.width - config.margin.left - config.margin.right;
    const x = config.margin.left + timeToX(event.range.begin, range, chartWidth);
    const width = timeToX(event.range.end, range, chartWidth) - timeToX(event.range.begin, range, chartWidth);
    const barHeight = config.slotHeight - 10;

    const color = event.color ? event.color : config.colors[colorIndex % config.colors.length];

    let eventSvg = '';

    // イベントバー
    eventSvg += `<rect x="${x}" y="${y + 5}" width="${width}" height="${barHeight}" fill="${color}" opacity="0.8" rx="3"/>`;

    // イベントタイトル（バーの中に表示、長い場合は省略）
    const textX = x + width / 2;
    const textY = y + config.slotHeight / 2 + 4;
    let title = event.title;

    // テキストの長さに応じて省略
    if (width < title.length * 8) {
        const maxChars = Math.floor(width / 8);
        if (maxChars > 3) {
            title = title.substring(0, maxChars - 3) + '...';
        } else {
            title = '';
        }
    }

    if (title) {
        eventSvg += `<text x="${textX}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white" font-weight="bold">${title}</text>`;
    }

    return eventSvg;
}

/**
 * スロットを描画する関数
 */
function generateSlot(slot: SlotRender, slotIndex: number, range: RangeUnixtime, config: SvgConfig): string {
    const y = config.margin.top + config.titleHeight + 20 + slotIndex * (config.slotHeight + 10);
    let slotSvg = '';

    // スロットのタイトル
    slotSvg += `<text x="${config.margin.left - 10}" y="${y + config.slotHeight / 2 + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">${slot.title}</text>`;

    // 背景
    const slotColor = slot.color ? slot.color : '#a0a0a0';
    slotSvg += `<rect x="${config.margin.left}" y="${y}" width="${config.width - config.margin.left - config.margin.right}" height="${config.slotHeight}" fill="${slotColor}" opacity="0.3" rx="3"/>`;

    // スロットの背景線
    const chartWidth = config.width - config.margin.left - config.margin.right;
    slotSvg += `<line x1="${config.margin.left}" y1="${y + config.slotHeight / 2}" x2="${config.margin.left + chartWidth}" y2="${y + config.slotHeight / 2}" stroke="#eee" stroke-width="1"/>`;

    // イベントを描画
    slot.events.forEach((event, eventIndex) => {
        slotSvg += generateEventBar(event, y, range, config, eventIndex);
    });

    return slotSvg;
}

/**
 * SVGヘッダーを生成する関数
 */
function generateSvgHeader(config: SvgConfig): string {
    return `<svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">`;
}

/**
 * タイトルを生成する関数
 */
function generateTitle(title: string, config: SvgConfig): string {
    const x = config.width / 2;
    const y = config.margin.top / 2;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#333">${title}</text>`;
}

/**
 * メイン関数：GanttRenderオブジェクトからSVG文字列を生成
 */
export function generateGanttSvg(gantt: GanttRender, customConfig?: Partial<SvgConfig>): string {
    const config = { ...defaultConfig, ...customConfig };

    // 必要な高さを計算
    const requiredHeight = config.margin.top + config.titleHeight + 20 +
        gantt.slots.length * (config.slotHeight + 10) +
        config.margin.bottom;
    config.height = Math.max(config.height, requiredHeight);

    let svg = generateSvgHeader(config);

    // 背景
    svg += `<rect width="${config.width}" height="${config.height}" fill="white"/>`;

    // タイトル
    svg += generateTitle(gantt.title, config);

    // 時間軸
    svg += generateTimeAxis(gantt.range, config);

    // スロットとイベント
    gantt.slots.forEach((slot, index) => {
        svg += generateSlot(slot, index, gantt.range, config);
    });

    svg += '</svg>';

    return svg;
}