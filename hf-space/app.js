(() => {
  "use strict";

  const SUMMARY_URL = "https://tsc-fm.dmirlab.com/api/public/space-summary";
  const EXPECTED_SCHEMA_VERSION = 1;

  const byId = (id) => document.getElementById(id);
  const status = byId("load-status");
  const content = byId("live-content");
  const error = byId("error-state");

  function requireNumber(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is invalid`);
    return value;
  }

  function requireString(value, label) {
    if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is invalid`);
    return value;
  }

  function validate(payload) {
    if (!payload || typeof payload !== "object") throw new Error("The response is invalid");
    if (payload.schemaVersion !== EXPECTED_SCHEMA_VERSION) throw new Error("Unsupported summary schema");
    requireString(payload.contentRevision, "contentRevision");
    ["totalDatasets", "univariateDatasets", "multivariateDatasets", "tracks"].forEach((key) => requireNumber(payload.benchmark?.[key], `benchmark.${key}`));
    if (!Array.isArray(payload.leaderboard?.topModels) || payload.leaderboard.topModels.length === 0 || payload.leaderboard.topModels.length > 5) throw new Error("Top models are invalid");
    payload.leaderboard.topModels.forEach((model, index) => {
      requireNumber(model.rank, `topModels[${index}].rank`);
      requireString(model.model, `topModels[${index}].model`);
      requireString(model.organization, `topModels[${index}].organization`);
      requireNumber(model.avgAccuracy, `topModels[${index}].avgAccuracy`);
      requireNumber(model.avgRank, `topModels[${index}].avgRank`);
      requireString(model.coverage, `topModels[${index}].coverage`);
    });
    if (!Array.isArray(payload.evaluationTracks) || payload.evaluationTracks.length !== payload.benchmark.tracks) throw new Error("Evaluation tracks are invalid");
    payload.evaluationTracks.forEach((track, index) => {
      requireString(track.name, `evaluationTracks[${index}].name`);
      requireString(track.description, `evaluationTracks[${index}].description`);
    });
    requireNumber(payload.capability?.configurationCount, "capability.configurationCount");
    requireNumber(payload.capability?.backboneCount, "capability.backboneCount");
    if (!Array.isArray(payload.capability?.taxonomies)) throw new Error("Capability taxonomies are invalid");
    return payload;
  }

  function render(payload) {
    byId("datasets-total").textContent = payload.benchmark.totalDatasets;
    byId("datasets-univariate").textContent = payload.benchmark.univariateDatasets;
    byId("datasets-multivariate").textContent = payload.benchmark.multivariateDatasets;
    byId("track-count").textContent = payload.benchmark.tracks;
    byId("configuration-count").textContent = payload.capability.configurationCount;
    byId("backbone-count").textContent = payload.capability.backboneCount;

    const rows = byId("leaderboard-body");
    payload.leaderboard.topModels.forEach((model) => {
      const row = document.createElement("tr");
      const values = [model.rank];
      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      const modelCell = document.createElement("td");
      modelCell.className = "model-cell";
      const name = document.createElement("strong");
      name.textContent = model.model;
      const organization = document.createElement("span");
      organization.textContent = model.organization;
      modelCell.append(name, organization);
      row.appendChild(modelCell);
      [model.avgAccuracy.toFixed(2), model.avgRank.toFixed(2), model.coverage].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      rows.appendChild(row);
    });

    const tracks = byId("track-list");
    payload.evaluationTracks.forEach((track, index) => {
      const item = document.createElement("div");
      item.className = "item";
      const number = document.createElement("span");
      number.className = "item-index";
      number.textContent = index + 1;
      const copy = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = track.name;
      const description = document.createElement("p");
      description.textContent = track.description;
      copy.append(name, description);
      item.append(number, copy);
      tracks.appendChild(item);
    });

    byId("taxonomy-summary").textContent = payload.capability.taxonomies
      .map((taxonomy) => `${taxonomy.label}: ${taxonomy.groups.join(", ")}`)
      .join(" · ");
    const shortRevision = payload.contentRevision.slice(0, 12);
    byId("revision").textContent = `Official data revision ${shortRevision}`;
    status.textContent = `Verified live from the official site · revision ${shortRevision}`;
    content.classList.remove("is-hidden");
  }

  async function load() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(SUMMARY_URL, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`Official summary returned HTTP ${response.status}`);
      render(validate(await response.json()));
    } catch (loadError) {
      console.error("Could not verify the official TSC-FM summary", loadError);
      status.classList.add("is-hidden");
      content.classList.add("is-hidden");
      error.classList.remove("is-hidden");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  load();
})();
