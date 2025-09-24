import { generateGanttSvg, convert } from "./gantt";
import type { SvgConfig, Gantt } from "./gantt";
import { load } from 'js-yaml'

let config: Partial<SvgConfig> = {
    width: 1000,
    timeAxisFormat: "YYYY/MM",
    timeAxisSteps: 12,
    customRange: { begin: '2024/1/15', end: '2024/5' },
}

let svg_container: HTMLElement;
let gantt: Gantt = {
    title: "Sample Gantt Chart",
    slots: [
        {
            title: "Task 1",
            events: []
        }
    ]
};

function init() {
    // 特定のtextareaに対して
    const textarea = document.getElementById('config_input') as HTMLTextAreaElement | null;
    textarea?.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault(); // Tabキーのデフォルト動作を無効化
            // カーソル位置を取得

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            // 現在の値を取得
            const value = textarea.value;

            // タブ文字を挿入
            textarea.value = value.substring(0, start) + '\t' + value.substring(end);

            // カーソル位置を調整（タブ文字の後に移動）
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
    });

    svg_container = document.getElementById("svg_output") as HTMLElement;

    console.log(svg_container);

    render(svg_container, gantt, config);

    document.getElementById("render_button")?.addEventListener("click", () => {
        render(svg_container, gantt, config);
    });

    (document.getElementById("config_input") as HTMLInputElement).value = JSON.stringify(config, null, 2);

    document.getElementById("config_input")?.addEventListener("input", (event) => {
        const input = event.target as HTMLInputElement;
        try {
            config = JSON.parse(input.value);
        } catch (e) {
            console.log("Invalid JSON in config input: ", (e as Error).message);
        }
    })
}

window.onload = () => { init(); }

document.getElementById("file_input_button")?.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target?.result;
            if (typeof text === "string") {
                gantt = load(text) as Gantt;
                render(svg_container, gantt, config);
            }
        };
        reader.readAsText(file);
    }
});

function render(container: HTMLElement, gantt: Gantt, config: Partial<SvgConfig>) {
    try {
        container.innerHTML = generateGanttSvg(convert(gantt), config);
    } catch (e) {
        container.innerHTML = `<p style="color:red;">Error: ${(e as Error).message}</p>`;
    }
}