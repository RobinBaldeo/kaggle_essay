import json

import datasets
from datasets import Dataset, DatasetDict, Features, ClassLabel, Value


_URLS = {
    f'seed_{j}_fold_{i}': {
        "train": f"data/essay_{j}_{i}_train.jsonl.gz",
        "validation": f"data/essay_{j}_{i}_vali.jsonl.gz",
        "test": f"data/essay_{j}_{i}_test.jsonl.gz",
    }
    for j in [0, 50, 100, 150] for i in range(0,5)

}


class Essay(datasets.GeneratorBasedBuilder):

    BUILDER_CONFIGS = [
        datasets.BuilderConfig(name=f"seed_{j}_fold_{i}") for j in [0, 50, 100, 150] for i in range(0,5)
        
    ]
    DEFAULT_CONFIG_NAME = "seed_0_fold_0"

    def _info(self):

        return datasets.DatasetInfo(
            features=datasets.Features({
                                        'essay_id': Value('string'),
                                        'full_text': Value('string'),
                                        'score': ClassLabel(names = [1, 2, 3, 4, 5, 6],
                                                                id = [0, 1, 2, 3, 4, 5]
                                                            )
                                        }))

    def _split_generators(self, dl_manager):
        """Returns seed_0_fold_0Generators."""
        paths = dl_manager.download_and_extract(_URLS[self.config.name])
        
        return [
            datasets.SplitGenerator(name=datasets.Split.TRAIN, gen_kwargs={"filepath": paths["train"]}),
            datasets.SplitGenerator(name=datasets.Split.VALIDATION, gen_kwargs={"filepath": paths["validation"]}),
            datasets.SplitGenerator(name=datasets.Split.TEST, gen_kwargs={"filepath": paths["test"]}),
        ]

            

    def _generate_examples(self, filepath):
        """Generate examples."""
        with open(filepath, encoding="utf-8") as f:
            for idx, line in enumerate(f):
                example = json.loads(line)
                yield idx, example