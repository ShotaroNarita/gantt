// import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <pre><code id="result"></code></pre>
    <div id="svg_result"></div>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)


import { convert } from './gantt'
import type { Gantt } from './gantt'

const g: Gantt = {
  "title": "プロジェクト開発スケジュール",
  "slots": [
    {
      "title": "企画・設計",
      "events": [
        {
          "title": "要件定義",
          "range": {
            "begin": "2024-01-15",
            "end": "2024-01-30",
          },
          "color": "#3498db"
        },
        {
          "title": "システム設計", "range": {
            "begin": "2024-01-25",
            "end": "2024-02-15"
          },
          "color": "#2980b9"
        },
        {
          "title": "UI/UXデザイン", "range": {
            "begin": "2024-02-01",
            "end": "2024-02-20"
          },
          "color": "#9b59b6"
        }
      ]
    },
    {
      "title": "開発",
      "events": [
        {
          "title": "フロントエンド開発", "range": {
            "begin": "2024-02-15",
            "end": "2024-04-15"
          },
          "color": "#e74c3c"
        },
        {
          "title": "バックエンド開発", "range": {
            "begin": "2024-02-20",
            "end": "2024-04-10"
          },
          "color": "#c0392b"
        },
        {
          "title": "データベース構築", "range": {
            "begin": "2024-02-10",
            "end": "2024-03-15"
          },
          "color": "#f39c12"
        }
      ]
    },
    {
      "title": "テスト・検証",
      "events": [
        {
          "title": "単体テスト", "range": {
            "begin": "2024-03-01",
            "end": "2024-04-20"
          },
          "color": "#27ae60"
        },
        {
          "title": "結合テスト", "range": {
            "begin": "2024-04-10",
            "end": "2024-05-05"
          },
          "color": "#2ecc71"
        },
        {
          "title": "システムテスト", "range": {
            "begin": "2024-04-25",
            "end": "2024-05-15"
          },
          "color": "#16a085"
        }
      ]
    },
    {
      "title": "リリース・運用",
      "events": [
        {
          "title": "本番環境構築", "range": {
            "begin": "2024-05-01",
            "end": "2024-05-10"
          },
          "color": "#8e44ad"
        },
        {
          "title": "リリース準備", "range": {
            "begin": "2024-05-10",
            "end": "2024-05-20"
          },
          "color": "#9b59b6"
        },
        {
          "title": "本番リリース", "range": {
            "begin": "2024-05-20",
            "end": "2024-05-25"
          },
          "color": "#e67e22"
        }
      ]
    }
  ]
};

const gr = convert(g);
console.log(gr);

document.querySelector<HTMLPreElement>('#result')!.textContent = JSON.stringify(gr, null, 2);
import { generateGanttSVG } from './gantt'
const svgString = generateGanttSVG(gr);
console.log(svgString);
document.querySelector<HTMLPreElement>('#svg_result')!.innerHTML = svgString;