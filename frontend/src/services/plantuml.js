import { hostname } from "../utils/hostname";

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallbackMessage);
  return data;
}

export async function generatePlantUmlDiagram(prompt) {
  const response = await fetch(`${hostname}/plantuml/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await readJsonResponse(response, "Could not generate a PlantUML diagram.");
  if (!data.diagram?.source) throw new Error("The generation response did not include PlantUML source.");
  return data.diagram;
}

export async function renderPlantUmlSource(source, format = "svg") {
  const response = await fetch(`${hostname}/plantuml/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, format }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || "Could not render PlantUML.");
  }
  return response.blob();
}
