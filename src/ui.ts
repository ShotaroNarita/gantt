import { SvgConfig, Gantt, generateGanttSvg, convert } from "./gantt";
import { load } from 'js-yaml'

let config: Partial<SvgConfig> = {}
config.width = 1000;
config.timeAxisFormat = "YYYY/MM";
config.timeAxisSteps = 12;
config.customRange = { begin: '2024/1/15', end: '2024/5' };

let svg_container = document.getElementById("svg_output") as HTMLElement;

document.getElementById("file_input_button")?.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target?.result;
            if (typeof text === "string") {
                const gantt = load(text) as Gantt;
                // const res = svg_string_from_gantt_string(text);
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