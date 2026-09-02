import type { Method } from "@/types";

// One catalog entry represents one pretrained model. Classifier heads remain
// separate on the leaderboard because they are distinct evaluated settings.
export const officialMethods: Method[] = [
  {
    id: "chorustic", name: "ChorusTIC", slug: "chorustic",
    organization: "GDUT · Huawei Noah’s Ark Lab · Université Paris Cité · MBZUAI · Shantou University",
    category: "In-Context Learning",
    description: "A support-conditioned foundation model for training-free univariate and multivariate time series classification.",
    paperUrl: "https://arxiv.org/abs/2608.24033",
    codeUrl: "https://github.com/fangjuntao/ChorusTIC",
    checkpointUrl: "https://huggingface.co/JTF2000/ChorusTIC/blob/main/ChorusTIC.ckpt",
    checkpointName: "ChorusTIC.ckpt (step 6000)", parameterCount: "Not reported by authors",
    evaluatedConfigurations: ["Native in-context inference"],
    inputType: "Univariate + multivariate time series", inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
  {
    id: "mantis", name: "Mantis", slug: "mantis",
    organization: "Huawei Noah’s Ark Lab · Université Paris Cité",
    category: "Representation Learning",
    description: "A lightweight time series classification foundation model used as a frozen representation backbone.",
    paperUrl: "https://arxiv.org/abs/2502.15637", codeUrl: "https://github.com/vfeofanov/mantis",
    checkpointUrl: "https://huggingface.co/paris-noah/Mantis-8M", checkpointName: "Mantis-8M",
    parameterCount: "8.11M backbone", evaluatedConfigurations: ["kNN", "LR", "MLP", "NC", "RF", "ScaledLR", "SVM"],
    inputType: "Univariate + multivariate time series", inferenceParadigm: "Frozen representation + fitted classifier", evaluationStatus: "Complete",
  },
  {
    id: "mantisv2", name: "MantisV2", slug: "mantisv2",
    organization: "Huawei Noah’s Ark Lab · Université Paris Cité",
    category: "Representation Learning",
    description: "A more lightweight Mantis encoder trained for stronger zero-shot time series representations.",
    paperUrl: "https://arxiv.org/abs/2602.17868", codeUrl: "https://github.com/vfeofanov/mantis",
    checkpointUrl: "https://huggingface.co/paris-noah/MantisV2", checkpointName: "MantisV2",
    parameterCount: "4.19M backbone", evaluatedConfigurations: ["LR", "RF", "ScaledLR"],
    inputType: "Univariate + multivariate time series", inferenceParadigm: "Frozen representation + fitted classifier", evaluationStatus: "Complete",
  },
  {
    id: "moment", name: "MOMENT", slug: "moment",
    organization: "Auton Lab, Carnegie Mellon University", category: "Representation Learning",
    description: "A general-purpose time series foundation model used here as a frozen representation backbone.",
    paperUrl: "https://arxiv.org/abs/2402.03885", codeUrl: "https://github.com/moment-timeseries-foundation-model/moment",
    checkpointUrl: "https://huggingface.co/AutonLab/MOMENT-1-base", checkpointName: "MOMENT-1-base",
    parameterCount: "125M backbone", evaluatedConfigurations: ["kNN", "LR", "MLP", "NC", "RF", "SVM"],
    inputType: "Univariate + multivariate time series", inferenceParadigm: "Frozen representation + fitted classifier", evaluationStatus: "Complete",
  },
  {
    id: "nutime", name: "NuTime", slug: "nutime",
    organization: "Microsoft Research · Peking University", category: "Representation Learning",
    description: "A numerically multi-scaled time series encoder used as a frozen representation backbone.",
    paperUrl: "https://arxiv.org/abs/2310.07402", codeUrl: "https://github.com/microsoft/NuTime",
    checkpointUrl: "https://github.com/microsoft/NuTime/blob/main/ckpt/checkpoint_bias9.pth", checkpointName: "checkpoint_bias9.pth",
    parameterCount: "2.4M backbone", evaluatedConfigurations: ["RF"],
    inputType: "Univariate + multivariate time series", inferenceParadigm: "Frozen CLS representation + fitted classifier", evaluationStatus: "Complete",
  },
  {
    id: "tabicl", name: "TabICL", slug: "tabicl",
    organization: "Inria · École Normale Supérieure–PSL", category: "In-Context Learning",
    description: "A tabular foundation model applied to vectorized time series through in-context classification.",
    paperUrl: "https://arxiv.org/abs/2502.05564", codeUrl: "https://github.com/soda-inria/tabicl",
    checkpointUrl: "https://huggingface.co/jingang/TabICL/blob/main/tabicl-classifier-v1.1-20250506.ckpt",
    checkpointName: "tabicl-classifier-v1.1-20250506.ckpt", parameterCount: "Not reported for v1.1 checkpoint",
    evaluatedConfigurations: ["Native in-context inference"], inputType: "Vectorized time series",
    inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
  {
    id: "tabiclv2", name: "TabICLv2", slug: "tabiclv2",
    organization: "Inria · École Normale Supérieure–PSL", category: "In-Context Learning",
    description: "The second-generation TabICL foundation model applied to vectorized time series.",
    paperUrl: "https://arxiv.org/abs/2602.11139", codeUrl: "https://github.com/soda-inria/tabicl",
    checkpointUrl: "https://huggingface.co/jingang/TabICL/blob/main/tabicl-classifier-v2-20260212.ckpt",
    checkpointName: "tabicl-classifier-v2-20260212.ckpt", parameterCount: "Not reported for v2 checkpoint",
    evaluatedConfigurations: ["Native in-context inference"], inputType: "Vectorized time series",
    inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
  {
    id: "tic-fm", name: "TIC-FM", slug: "tic-fm",
    organization: "GDUT · Huawei Noah’s Ark Lab · Université Paris Cité · MBZUAI", category: "In-Context Learning",
    description: "A split-masked latent-memory framework for training-free time series in-context classification.",
    paperUrl: "https://arxiv.org/abs/2602.00620", codeUrl: "https://github.com/fangjuntao/TIC-FM",
    checkpointUrl: "https://huggingface.co/Jwpqkh/TIC-FM/blob/main/TSEncoder_orion_icl_fullv1.0.pt",
    checkpointName: "TSEncoder_orion_icl_fullv1.0.pt", parameterCount: "Not reported by authors",
    evaluatedConfigurations: ["Native in-context inference"], inputType: "Univariate time series",
    inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
  {
    id: "tict", name: "TiCT", slug: "tict", organization: "Visa Research", category: "In-Context Learning",
    description: "A synthetically pretrained time series in-context classifier with scalable label encoding.",
    paperUrl: "https://arxiv.org/abs/2511.19694", codeUrl: "https://sites.google.com/view/tsicl",
    checkpointUrl: null, checkpointName: "No standalone checkpoint link found", parameterCount: "47M (TiCT-Large, ResNet)",
    evaluatedConfigurations: ["Native in-context inference"], inputType: "Univariate time series",
    inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
  {
    id: "unishape", name: "UniShape", slug: "unishape",
    organization: "SCUT · A*STAR · Khalifa University", category: "Representation Learning",
    description: "A shape-aware foundation model used as a frozen representation backbone for classification.",
    paperUrl: "https://arxiv.org/abs/2601.06429", codeUrl: "https://github.com/qianlima-lab/UniShape",
    checkpointUrl: "https://github.com/qianlima-lab/UniShape/blob/main/pretrained_model_ckpt/unishape_checkpoint_zeroshot.pth",
    checkpointName: "unishape_checkpoint_zeroshot.pth", parameterCount: "3.1M backbone", evaluatedConfigurations: ["RF"],
    inputType: "Univariate + multivariate time series", inferenceParadigm: "Frozen representation + fitted classifier", evaluationStatus: "Complete",
  },
];

export const methodAliases: Record<string, string> = {
  "mantis-knn": "mantis", "mantis-lr": "mantis", "mantis-mlp": "mantis", "mantis-nc": "mantis",
  "mantis-rf": "mantis", "mantis-scaledlr": "mantis", "mantis-svm": "mantis",
  "mantisv2-lr": "mantisv2", "mantisv2-rf": "mantisv2", "mantisv2-scaledlr": "mantisv2",
  "moment-knn": "moment", "moment-lr": "moment", "moment-mlp": "moment", "moment-nc": "moment",
  "moment-rf": "moment", "moment-svm": "moment", "nutime-rf": "nutime", "unishape-rf": "unishape",
};

export function canonicalMethodSlug(slug: string) { return methodAliases[slug] ?? slug; }

export function methodForModelName(name: string) {
  const slug = name.toLowerCase().replace(/\+/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const canonical = canonicalMethodSlug(slug);
  return officialMethods.find((method) => method.slug === canonical) ?? null;
}
