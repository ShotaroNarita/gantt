import { SvgConfig, Gantt, generateGanttSvg, convert } from "./gantt";
import { load } from 'js-yaml'

let config: Partial<SvgConfig> = {}
config.width = 1000;
config.timeAxisFormat = "YYYY/MM";
config.timeAxisSteps = 12;
config.customRange = { begin: '2024/1/15', end: '2024/5' };

document.getElementById("upload_button")?.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const fileContent = e.target?.result;
            if (typeof fileContent === "string") {
                const res = svg_string_from_gantt_string(fileContent);

                const svgContainer = document.getElementById("svg_output");
                if (svgContainer) {
                    svgContainer.innerHTML = res;
                }
            }
        };
        reader.readAsText(file);
    }
});

function svg_string_from_gantt_string(file_str: string): string {
    const data = load(file_str) as Gantt;
    let result = "";
    try {
        result = generateGanttSvg(convert(data), config);
    } catch (e) {
        result = `<p style="color:red;">Error: ${(e as Error).message}</p>`;
    }

    return result;
}