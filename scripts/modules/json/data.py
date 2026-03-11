"""Describe data.json structure"""

from dataclasses import dataclass, asdict
import json
from pathlib import Path

@dataclass
class DataJsonEntry:
    """Describe a single entry in data.json"""

    hash: str
    title: str = ""
    date: int = 0

CURRENT_VERSION = 1

@dataclass
class DataJson:
    """Describe the entire data.json structure"""

    data: dict[int, DataJsonEntry]
    version: int = CURRENT_VERSION

    @staticmethod
    def from_json(path: Path) -> "DataJson":
        """Load data from a JSON file"""
        with open(path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        version = raw_data["version"]

        match version:
            case 1:
                return DataJson(
                    version=version,
                    data={
                        int(k): DataJsonEntry(**v)
                        for k, v in raw_data["data"].items()
                    },
                )
            case _:
                raise ValueError(f"Unsupported data version: {version}")

    def to_json(self, path: Path) -> None:
        """Save data to a JSON file"""
        self.sort()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                asdict(self),
                f,
                indent=2,
                separators=(",", ": "),
            )

    def exists(self, commit: str) -> bool:
        """Check if a commit hash exists in the dataset"""
        return commit in map(lambda entry: entry.hash, self.data.values())

    def append(self, run_id: int, commit: str, title: str, date: int) -> None:
        """Append a single workflow run to dataset"""
        self.data[run_id] = DataJsonEntry(hash=commit, title=title, date=date)

    def sort(self) -> None:
        """Sort data by run_id descending"""
        self.data = dict(sorted(self.data.items(), key=lambda item: item[0], reverse=True))
