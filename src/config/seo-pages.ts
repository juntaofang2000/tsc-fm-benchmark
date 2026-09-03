import { siteConfig } from "./site";

export const seoPages = [
  { path: "/", key: "home", label: "Home", title: siteConfig.title, description: siteConfig.description },
  { path: "/leaderboard", key: "leaderboard", label: "Leaderboard", title: "Time Series Classification Leaderboard", description: "Compare foundation model configurations by accuracy, average rank and coverage. Explore Standard and low-shot results with univariate and multivariate views." },
  { path: "/benchmarks", key: "composition", label: "Dataset Profile", title: "Benchmark Composition: 198 Time Series Datasets", description: "Explore the composition of 198 time series classification datasets: 128 univariate and 70 multivariate, with reviewed attributes and equal dataset weighting." },
  { path: "/capability-map", key: "capability", label: "Capability Map", title: "Foundation Model Capability Analysis", description: "Analyze a fixed 198-dataset core of 12 configurations and 7 backbones by dataset attributes, using hierarchical aggregation and two independent taxonomies." },
  { path: "/methods", key: "methods", label: "Methods", title: "Time Series Foundation Models and Evaluated Configurations", description: "Explore pretrained models, evaluated classifier configurations, paper and code references, checkpoints and inference paradigms for time series classification." },
  { path: "/evaluation", key: "evaluation", label: "Evaluation", title: "Time Series Classification Evaluation Protocol", description: "Understand Standard, low-shot, training-free and frozen-probe evaluation, dataset-equal accuracy, ranking eligibility and reproducible submission requirements." },
  { path: "/submit", key: "submit", label: "Submit", title: "Submit a Model for Time Series Classification Evaluation", description: "Submit public GitHub code and Hugging Face model repositories for administrator review. Repository revisions are locked to immutable commits at submission." },
] as const;
