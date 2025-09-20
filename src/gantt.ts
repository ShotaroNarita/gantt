import dayjs from "dayjs";

interface Range_Free {
    begin: string;
    end: string;
}

interface Range_Unixtime {
    begin: number;
    end: number;
    duration: number;
}

interface Gantt {
    title: string;
    slots: Slot[];
}

interface Slot {
    title: string;
    events: Event[];
}

interface Event {
    title: string;
    range: Range_Free;
    color: string;
}

interface EventRender extends Event {
    normalized: Range_Unixtime
}

interface SlotRender extends Slot {
    events: EventRender[];
    normalized: Range_Unixtime
}

interface GanttRender extends Gantt {
    slots: SlotRender[];
    range: Range_Unixtime;
    normalized: Range_Unixtime
}


function convert(gantt: Gantt): GanttRender {
    // find global begin and end
    let global_begin = Number.POSITIVE_INFINITY;
    let global_end = Number.NEGATIVE_INFINITY;

    for (const slot of gantt.slots) {
        for (const event of slot.events) {
            const begin = dayjs(event.range.begin).unix();
            const end = dayjs(event.range.end).unix();
            if (begin < global_begin) {
                global_begin = begin;
            }
            if (end > global_end) {
                global_end = end;
            }
        }
    }
    const global_duration = global_end - global_begin;

    // convert events
    const slots_render: SlotRender[] = [];
    for (const slot of gantt.slots) {
        const events_render: EventRender[] = [];
        let slot_begin = Number.POSITIVE_INFINITY;
        let slot_end = Number.NEGATIVE_INFINITY;
        for (const event of slot.events) {
            const begin = dayjs(event.range.begin).unix();
            const end = dayjs(event.range.end).unix();
            if (begin < slot_begin) {
                slot_begin = begin;
            }
            if (end > slot_end) {
                slot_end = end;
            }
            const normalized: Range_Unixtime = {
                begin: (begin - global_begin) / global_duration,
                end: (end - global_begin) / global_duration,
                duration: (end - begin) / global_duration,
            };
            events_render.push({
                ...event,
                normalized,
            });
        }
        const slot_duration = slot_end - slot_begin;
        const normalized: Range_Unixtime = {
            begin: (slot_begin - global_begin) / global_duration,
            end: (slot_end - global_begin) / global_duration,
            duration: slot_duration / global_duration,
        };
        slots_render.push({
            ...slot,
            events: events_render,
            normalized,
        });
    }

    const gantt_render: GanttRender = {
        ...gantt,
        slots: slots_render,
        range: {
            begin: global_begin,
            end: global_end,
            duration: global_duration,
        },
        normalized: {
            begin: 0,
            end: 1,
            duration: 1,
        },
    };

    return gantt_render;
}

export type { Gantt }
export { convert }

interface SVGConfig {
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    slotHeight: number;
    fontSize: number;
    titleFontSize: number;
}

class GanttSVGGenerator {
    private config: SVGConfig;

    constructor(config?: Partial<SVGConfig>) {
        this.config = {
            width: 1200,
            height: 600,
            margin: {
                top: 60,
                right: 50,
                bottom: 80,
                left: 200
            },
            slotHeight: 40,
            fontSize: 12,
            titleFontSize: 16,
            ...config
        };
    }

    public generateSVG(gantt: GanttRender): string {
        const chartWidth = this.config.width - this.config.margin.left - this.config.margin.right;
        const chartHeight = Math.max(
            gantt.slots.length * (this.config.slotHeight + 10),
            this.config.height - this.config.margin.top - this.config.margin.bottom
        );

        const totalHeight = chartHeight + this.config.margin.top + this.config.margin.bottom;

        let svg = `<svg width="${this.config.width}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;

        // 背景
        svg += `<rect width="${this.config.width}" height="${totalHeight}" fill="#f8f9fa"/>`;

        // タイトル
        svg += this.generateTitle(gantt.title);

        // グリッドとタイムライン
        svg += this.generateGrid(gantt, chartWidth, chartHeight);

        // スロットとイベント
        svg += this.generateSlots(gantt, chartWidth);

        svg += '</svg>';

        return svg;
    }

    private generateTitle(title: string): string {
        const x = this.config.width / 2;
        const y = 30;

        return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${this.config.titleFontSize}" font-weight="bold" fill="#333">${this.escapeXml(title)}</text>`;
    }

    private generateGrid(gantt: GanttRender, chartWidth: number, chartHeight: number): string {
        let grid = '';
        const startX = this.config.margin.left;
        const startY = this.config.margin.top;

        // 縦のグリッドライン（時間軸）
        const timeRange = gantt.range.duration;
        const timeStep = this.calculateTimeStep(timeRange);
        const numSteps = Math.floor(timeRange / timeStep);

        for (let i = 0; i <= numSteps; i++) {
            const x = startX + (i * chartWidth / numSteps);
            grid += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + chartHeight}" stroke="#e0e0e0" stroke-width="1"/>`;

            // 時間ラベル
            const time = gantt.range.begin + (i * timeStep);
            const timeLabel = this.formatTime(time);
            grid += `<text x="${x}" y="${startY + chartHeight + 20}" text-anchor="middle" font-size="${this.config.fontSize}" fill="#666">${timeLabel}</text>`;
        }

        // 横のグリッドライン（スロット区切り）
        for (let i = 0; i <= gantt.slots.length; i++) {
            const y = startY + i * (this.config.slotHeight + 10);
            grid += `<line x1="${startX}" y1="${y}" x2="${startX + chartWidth}" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>`;
        }

        // 外枠
        grid += `<rect x="${startX}" y="${startY}" width="${chartWidth}" height="${chartHeight}" fill="none" stroke="#333" stroke-width="2"/>`;

        return grid;
    }

    private generateSlots(gantt: GanttRender, chartWidth: number): string {
        let slots = '';
        const startX = this.config.margin.left;
        const startY = this.config.margin.top;

        gantt.slots.forEach((slot, index) => {
            const slotY = startY + index * (this.config.slotHeight + 10);

            // スロットタイトル
            slots += `<text x="${startX - 10}" y="${slotY + this.config.slotHeight / 2}" text-anchor="end" dominant-baseline="middle" font-size="${this.config.fontSize}" fill="#333">${this.escapeXml(slot.title)}</text>`;

            // イベント
            slot.events.forEach(event => {
                slots += this.generateEvent(event, gantt.normalized, slotY, chartWidth);
            });
        });

        return slots;
    }

    private generateEvent(event: EventRender, ganttRange: Range_Unixtime, slotY: number, chartWidth: number): string {
        const startX = this.config.margin.left;
        const eventStartRatio = (event.normalized.begin - ganttRange.begin) / ganttRange.duration;
        const eventDurationRatio = event.normalized.duration / ganttRange.duration;

        const x = startX + eventStartRatio * chartWidth;
        const width = Math.max(eventDurationRatio * chartWidth, 2); // 最小幅を確保
        const y = slotY + 5;
        const height = this.config.slotHeight - 10;

        let eventSvg = '';

        // イベントバー
        eventSvg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${event.color}" stroke="#fff" stroke-width="1" rx="3"/>`;

        // イベントタイトル（バーが十分な幅がある場合のみ表示）
        if (width > 60) {
            const textX = x + width / 2;
            const textY = y + height / 2;
            eventSvg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" font-size="${this.config.fontSize - 2}" fill="#fff" font-weight="bold">${this.escapeXml(event.title)}</text>`;
        }

        return eventSvg;
    }

    private calculateTimeStep(duration: number): number {
        // 適切な時間間隔を計算（秒単位）
        const steps = [
            1,          // 1秒
            5,          // 5秒
            10,         // 10秒
            30,         // 30秒
            60,         // 1分
            300,        // 5分
            600,        // 10分
            1800,       // 30分
            3600,       // 1時間
            7200,       // 2時間
            21600,      // 6時間
            43200,      // 12時間
            86400,      // 1日
            604800,     // 1週間
            2629746,    // 1ヶ月（平均）
            31556952    // 1年（平均）
        ];

        const targetSteps = 8;
        const targetStep = duration / targetSteps;

        return steps.find(step => step >= targetStep) || steps[steps.length - 1];
    }

    private formatTime(unixtime: number): string {
        const date = new Date(unixtime * 1000);

        // 時間の範囲に応じてフォーマットを変更
        const now = new Date();
        const diffDays = Math.abs(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays < 1) {
            // 1日以内：時:分
            return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays < 365) {
            // 1年以内：月/日
            return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
        } else {
            // 1年以上：年/月
            return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric' });
        }
    }

    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// 使用例
export function generateGanttSVG(gantt: GanttRender, config?: Partial<SVGConfig>): string {
    const generator = new GanttSVGGenerator(config);
    return generator.generateSVG(gantt);
}

// // サンプルデータでの使用例
// const sampleGantt: GanttRender = {
//     title: "プロジェクト管理ガントチャート",
//     slots: [
//         {
//             title: "開発チーム",
//             events: [
//                 {
//                     title: "要件定義",
//                     range: { begin: "2024-01-01", end: "2024-01-15" },
//                     color: "#3498db",
//                     normalized: { begin: 1704067200, end: 1705276800, duration: 1209600 }
//                 },
//                 {
//                     title: "実装",
//                     range: { begin: "2024-01-16", end: "2024-02-29" },
//                     color: "#e74c3c",
//                     normalized: { begin: 1705363200, end: 1709164800, duration: 3801600 }
//                 }
//             ],
//             normalized: { begin: 1704067200, end: 1709164800, duration: 5097600 }
//         },
//         {
//             title: "テストチーム",
//             events: [
//                 {
//                     title: "テスト計画",
//                     range: { begin: "2024-01-20", end: "2024-01-31" },
//                     color: "#f39c12",
//                     normalized: { begin: 1705708800, end: 1706659200, duration: 950400 }
//                 },
//                 {
//                     title: "テスト実行",
//                     range: { begin: "2024-02-01", end: "2024-02-28" },
//                     color: "#27ae60",
//                     normalized: { begin: 1706745600, end: 1709078400, duration: 2332800 }
//                 }
//             ],
//             normalized: { begin: 1705708800, end: 1709078400, duration: 3369600 }
//         }
//     ],
//     normalized: { begin: 1704067200, end: 1709164800, duration: 5097600 }
// };

// SVG生成
// const svgString = generateGanttSVG(sampleGantt);