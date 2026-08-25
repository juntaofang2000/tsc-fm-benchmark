# 可复现的榜单结果流水线

本目录用于管理 ChorusTIC 的 UCR、UEA、MVCore66 和 Overall 榜单。设计目标是：以后
增加或移除参与榜单的数据集时，只补跑缺失的“方法 × 数据集”，不重跑已有
实验。

## 核心原则

- `source/results_long.csv` 是唯一可以人工追加或修正的结果事实表。
- `suites/*.json` 决定一个榜单包含哪些方法、数据集和评估协议。
- `suites/datasets/*.txt` 保存数据集清单，每行一个准确名称。
- 根目录的发布宽表和 `generated/` 下所有文件都由脚本生成，不要手工修改。
- 平均准确率、逐数据集 Rank、Avg. Rank 和榜单序号全部是派生结果。

## 长表字段

```text
archive,dataset,method,protocol_id,run_id,seed,status,accuracy,source
UCR,Adiac,ChorusTIC,paper-standard-v1,run-001,0,ok,0.823529,results/run-001.json
```

| 字段 | 说明 |
|---|---|
| `archive` | 数据集命名空间：`UCR`、`UEA` 或 `MVCore66`。 |
| `dataset` | 必须与 suite 数据集清单中的名称完全一致。 |
| `method` | 稳定的方法名称。 |
| `protocol_id` | 评估协议版本；不兼容的协议不得混合。 |
| `run_id` | 实验批次或独立重复实验标识。 |
| `seed` | 随机种子，也可使用 `published` 这类稳定标签。 |
| `status` | 只有 `ok` 参与聚合；其他状态保留但排除。 |
| `accuracy` | `[0, 1]` 区间的小数，不能写成百分数字符串。 |
| `source` | 对应日志、JSON、CSV 或其他来源路径。 |

同一“方法 × 数据集 × 协议”下有多个 `ok` 记录时，脚本先对这些记录取平均，
再进行榜单聚合。每条记录由 archive、dataset、method、protocol、run_id 和
seed 联合唯一确定。如果旧结果无效，将其 `status` 改为 `superseded` 或
`invalid`，再追加正确记录，不要无痕覆盖来源。

## 生成榜单

在本目录执行：

```bash
python scripts/build_results.py
```

只生成某一套榜单：

```bash
python scripts/build_results.py --suite ucr_128
```

如果只想试算或做自动测试，不刷新兼容发布宽表：

```bash
python scripts/build_results.py --output-dir 临时目录 --no-release-wide
```

主要输出：

- `generated/*_per_dataset_accuracy.csv`：按 suite 选择后生成的宽表。
- `generated/*_per_dataset_rank.csv`：在每个数据集上重新计算的 Rank。
- `generated/*_leaderboard.csv`：平均准确率、Avg. Rank、覆盖率和榜单序号。
- `generated/coverage_report.csv`：每种方法的覆盖率和参榜资格。
- `generated/missing_results.csv`：仍需补跑的精确实验清单。
- `generated/BUILD_AUDIT.md`：数据源和配置哈希，便于复现。

为了兼容论文发布结构，下面两个文件仍会在原位置自动生成：

- `ucr_128_per_dataset_accuracy.csv`
- `uea_30_per_dataset_accuracy.csv`

## 导入 MVCore66 正式结果

先导入六份已核对的源结果，再重建全部 suite：

```bash
python scripts/import_mvcore66_results.py \
  --source-root /path/to/results/standard/MVCore66 \
  --overlap-file /path/to/benchmark_overlap_uea_mvcore66.csv
python scripts/build_results.py --no-release-wide
```

导入脚本要求 10 个方法变体具有完全一致的 66 个数据集，校验 accuracy 和
status，并把来源哈希及冻结的去重规则写入
`source/mvcore66_sources_manifest.json`。脚本只替换长表中已有的 MVCore66
记录，不修改 UCR 和 UEA 的来源记录。

26 个 UEA/MVCore66 重叠任务全部保留 UEA 结果。因此总榜单包含
`128 UCR + 30 UEA + 40 MVCore66-only = 198` 个唯一数据集；单独的
MVCore66 榜单仍使用全部 66 个任务。

## 移除数据集

1. 不要直接改变已经发布的 suite；复制出新版本，例如 `ucr_v2.json`。
2. 同时复制数据集清单为 `datasets/ucr_v2.txt`。
3. 从新清单中删除不再参与的数据集。
4. 运行生成脚本。

无需重新运行任何模型。脚本会重新筛选长表，并自动计算新的平均准确率、逐
数据集 Rank、Avg. Rank 和榜单序号。

## 增加数据集

1. 把新数据集名称加入新版本的清单。
2. 先运行一次生成脚本。
3. 打开 `generated/missing_results.csv`，其中列出的就是必须补跑的组合。
4. 只运行这些“方法 × 新数据集”实验，并把结果追加到长表。
5. 再次运行生成脚本。

方法只有覆盖 suite 的全部数据集后才具备正式参榜资格。其余已有结果会直接
复用。

## 增加方法

1. 将方法名称加入 suite JSON 的 `methods` 数组。
2. 把已有逐数据集结果追加到长表。
3. 运行脚本，用 `missing_results.csv` 作为剩余实验任务清单。

加入新方法后，所有方法的 Avg. Rank 都会变化，因为 Rank 要在每个数据集上
按新的方法集合重新计算；但已有模型预测不需要重跑。

## 排名口径

1. 只有完整覆盖当前 suite 的方法参与正式排名。
2. 每个数据集内按 Accuracy 从高到低排名。
3. 精确并列结果取所占名次的平均值，容差为 `1e-12`。
4. Avg. Rank 是所有入选数据集 Rank 的算术平均。
5. Avg. Accuracy 是所有入选数据集准确率的无权平均。
6. 榜单序号按 Avg. Accuracy 从高到低排列。

Overall 按每个数据集等权，而不是三个 archive 各占相同权重。当前正式套件为：

```text
(128 × UCR 平均准确率 + 30 × UEA 平均准确率 + 40 × MVCore66-only 平均准确率) / 198
```

只有完整覆盖 `198 / 198` 的方法才有总榜单资格。

## 协议发生变化时

如果数据划分、预处理、checkpoint、分类器、超参数搜索、指标或评估规则发生
变化，必须建立新的 `protocol_id` 和 suite 版本。不同协议的结果不能为了补齐
覆盖率而混合复用。

`scripts/import_wide_results.py` 只用于首次把历史宽表迁移成长表，日常维护不要
运行；除非显式使用 `--force`，它也不会覆盖现有事实表。
