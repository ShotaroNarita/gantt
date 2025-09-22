// 例1: ソフトウェア開発プロジェクト
import { Gantt, convert, generateGanttSvg } from "./gantt";

const softwareDevelopmentGantt: Gantt = {
    title: "Webアプリケーション開発プロジェクト",
    slots: [
        {
            title: "企画・設計",
            events: [
                {
                    title: "要件定義",
                    range: { begin: "2024/01/15", end: "2024/01/31" }
                },
                {
                    title: "UI/UX設計",
                    range: { begin: "2024/02/01", end: "2024/02/14" }
                }
            ]
        },
        {
            title: "開発",
            events: [
                {
                    title: "フロントエンド開発",
                    range: { begin: "2024/02/15", end: "2024/03/31" }
                },
                {
                    title: "バックエンド開発",
                    range: { begin: "2024/02/20", end: "2024/04/05" }
                }
            ]
        },
        {
            title: "テスト・デプロイ",
            events: [
                {
                    title: "統合テスト",
                    range: { begin: "2024/04/01", end: "2024/04/15" }
                },
                {
                    title: "本番環境デプロイ",
                    range: { begin: "2024/04/16", end: "2024/04/18" }
                }
            ]
        }
    ]
};

// 例2: イベント運営スケジュール
const eventPlanningGantt: Gantt = {
    title: "年次カンファレンス2024",
    slots: [
        {
            title: "コンテンツ",
            events: [
                {
                    title: "講演者依頼",
                    range: { begin: "2024/03/10", end: "2024/04/30" },
                    color: "purple"
                },
                {
                    title: "プログラム作成",
                    range: { begin: "2024/05/01", end: "2024/05/31" }
                }
            ]
        },
        {
            title: "会場・設備",
            color: "#rgba(255, 200, 200)",
            events: [
                {
                    title: "会場予約",
                    range: { begin: "2024", end: "2025" },
                },
                {
                    title: "機材レンタル手配",
                    range: { begin: "2024/03/15", end: "2024/10/20" }
                }
            ]
        },
        {
            title: "運営準備",
            events: [
                {
                    title: "参加者募集",
                    range: { begin: "2024/06/01", end: "2024/07/15" }
                },
                {
                    title: "当日運営準備",
                    range: { begin: "2024/07/20", end: "2024/08/01" }
                }
            ]
        }
    ]
};

// 例3: 製品製造スケジュール
const manufacturingGantt: Gantt = {
    title: "新製品量産立ち上げ",
    slots: [
        {
            title: "原材料調達",
            events: [
                {
                    title: "素材発注",
                    range: { begin: "2024/02/01", end: "2024/02/03" }
                },
                {
                    title: "原材料入荷",
                    range: { begin: "2024/02/15", end: "2024/02/20" }
                }
            ]
        },
        {
            title: "製造工程",
            events: [
                {
                    title: "部品加工",
                    range: { begin: "2024/02/21", end: "2024/03/15" }
                },
                {
                    title: "組み立て作業",
                    range: { begin: "2024/03/16", end: "2024/03/31" }
                }
            ]
        },
        {
            title: "品質管理・出荷",
            events: [
                {
                    title: "品質検査",
                    range: { begin: "2024/03/25", end: "2024/04/05" }
                },
                {
                    title: "梱包・出荷",
                    range: { begin: "2024/04/06", end: "2024/04/10" }
                }
            ]
        }
    ]
};

const resultElement = document.getElementById("result") as HTMLInputElement | null;
if (resultElement) {
    resultElement.value = generateGanttSvg(convert(softwareDevelopmentGantt));
}

import { SvgConfig } from "./gantt";


let config: Partial<SvgConfig> = {}
config.width = 1000;
config.timeAxisFormat = "YYYY/MM";
config.customRange = {begin: 1705000000, end: 1715000000};


// const svg_str = generateGanttSvg(convert(eventPlanningGantt));
// const svg_str = generateGanttSvg(convert(softwareDevelopmentGantt));

const svg_str = generateGanttSvg(convert(manufacturingGantt), config);
const svgContainer = document.getElementById("svg_result");
if (svgContainer) {
    svgContainer.innerHTML = svg_str;
}