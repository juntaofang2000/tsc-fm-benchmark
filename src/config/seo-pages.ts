import { siteConfig } from "./site";

export const seoPages = [
  { path: "/", key: "home", label: "Home", title: siteConfig.title, description: siteConfig.description },
  { path: "/leaderboard", key: "leaderboard", label: "Leaderboard", title: "Time Series Classification Foundation Model Leaderboard", description: "Compare time series classification foundation models by accuracy, average rank and coverage. View Standard, 5-shot and 10-shot rankings for univariate and multivariate tasks." },
  { path: "/benchmarks", key: "composition", label: "Dataset Profile", title: "Benchmark Composition: 198 Time Series Datasets", description: "Explore the composition of 198 time series classification datasets: 128 univariate and 70 multivariate, with reviewed attributes and equal dataset weighting." },
  { path: "/capability-map", key: "capability", label: "Capability Map", title: "Time Series Classification Foundation Model Capabilities", description: "Analyze time series classification model capabilities by task attributes on a fixed 198-dataset core, comparing 12 configurations and 7 backbones." },
  { path: "/methods", key: "methods", label: "Methods", title: "Foundation Models for Time Series Classification", description: "Compare time series classification foundation models, including ChorusTIC, Mantis, MOMENT and TIC-FM. Explore configurations, papers, code and checkpoints." },
  { path: "/evaluation", key: "evaluation", label: "Evaluation", title: "How to Evaluate Time Series Foundation Models for Classification", description: "A practical time series foundation model evaluation protocol for classification: choose a label budget and dataset scope, compare in-context learning with frozen probes, and interpret accuracy, rank and coverage." },
  { path: "/submit", key: "submit", label: "Submit", title: "Submit a Model for Time Series Classification Evaluation", description: "Submit public GitHub code and Hugging Face model repositories for administrator review. Repository revisions are locked to immutable commits at submission." },
] as const;
