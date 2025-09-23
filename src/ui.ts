import { SvgConfig, Gantt, generateGanttSvg, convert } from "./gantt";
import { load } from 'js-yaml'

document.getElementById("upload_button")?.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileContent = e.target?.result;
            if (typeof fileContent === "string") {
                const obj = accept_input(fileContent);
            }
        };
        reader.readAsText(file);
    }
});

function accept_input(file_str: string){
    const data = load(file_str) as Gantt;
    console.log(data);
    const svg_str = generateGanttSvg(convert(data), config);
    const svgContainer = document.getElementById("svg_output");
    if (svgContainer) {
        svgContainer.innerHTML = svg_str;
    }
}


let config: Partial<SvgConfig> = {}
config.width = 1000;
config.timeAxisFormat = "YYYY/MM";
config.timeAxisSteps = 12;
config.customRange = { begin: '2024/1/15', end: '2024/5' };


// const svg_str = generateGanttSvg(convert(eventPlanningGantt));
// const svg_str = generateGanttSvg(convert(softwareDevelopmentGantt));

// const svg_str = generateGanttSvg(convert(manufacturingGantt), config);
// const svgContainer = document.getElementById("svg_result");
// if (svgContainer) {
//     svgContainer.innerHTML = svg_str;
// }