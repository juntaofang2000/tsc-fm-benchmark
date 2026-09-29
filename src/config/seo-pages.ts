import { siteConfig } from "./site";

export const seoPages = [
  { path: "/", key: "home", label: "Home", title: siteConfig.title, description: siteConfig.description },
  { path: "/leaderboard", key: "leaderboard", label: "Leaderboard", title: "Time Series Classification Leaderboard", description: "Compare foundation model configurations by accuracy, average rank and coverage. Explore Standard and low-shot results with univariate and multivariate views." },
  { path: "/benchmarks", key: "composition", label: "Dataset Profile", title: "Benchmark Composition: 198 Time Series Datasets", description: "Explore the composition of 198 time series classification datasets: 128 univariate and 70 multivariate, with reviewed attributes and equal dataset weighting." },
  { path: "/capability-map", key: "capability", label: "Capability Map", title: "Foundation Model Capability Analysis", description: "Analyze a fixed 198-dataset core of 12 configurations and 7 backbones by dataset attributes, using hierarchical aggregation and two independent taxonomies." },
  { path: "/methods", key: "methods", label: "Methods", title: "Foundation Models for Time Series Classification", description: "Compare time series classification foundation models, including ChorusTIC, Mantis, MOMENT and TIC-FM. Explore configurations, papers, code and checkpoints." },
  { path: "/evaluation", key: "evaluation", label: "Evaluation", title: "Time Series Classification Evaluation Protocol", description: "Evaluate foundation models for time series classification: Standard and few-shot (5-shot / 10-shot) protocols, in-context learning, frozen probes and ranking rules." },
  { path: "/submit", key: "submit", label: "Submit", title: "Submit a Model for Time Series Classification Evaluation", description: "Submit public GitHub code and Hugging Face model repositories for administrator review. Repository revisions are locked to immutable commits at submission." },
] as const;
