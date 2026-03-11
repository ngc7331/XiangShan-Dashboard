"""Describe report.json structure"""

from dataclasses import dataclass, field, asdict
import json
from pathlib import Path
from zipfile import ZipFile

# report.json: { testcase: { "ipc": ipc } }
# {
#   "testcase1": { "ipc": 1.0 },
#   "testcase2": { "ipc": 0.5 },
#   ...
# }


@dataclass
class ReportJsonEntry:
    """Describe a single entry in report.json"""

    ipc: float


@dataclass
class ReportJson:
    """Describe the entire report.json structure"""

    _data: dict[str, ReportJsonEntry] = field(default_factory=dict)

    @staticmethod
    def from_json(path: Path) -> "ReportJson":
        """Load data from a JSON file"""
        with open(path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        version = raw_data["version"]

        match version:
            case 1:
                return ReportJson(
                    _data={
                        k: ReportJsonEntry(**v) for k, v in raw_data["data"].items()
                    },
                )
            case _:
                raise ValueError(f"Unsupported data version: {version}")

    def to_json(self, path: Path) -> None:
        """Save data to a JSON file"""
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                asdict(self)["_data"],
                f,
                indent=2,
                separators=(",", ": "),
            )

    def append(self, testcase: str, ipc: float) -> None:
        """Append a single testcase to report"""
        self._data[testcase] = ReportJsonEntry(ipc=ipc)

    def append_artifact_zip(self, artifact_zip: ZipFile) -> None:
        """Append multiple testcase from a artifact zip file"""
        for name in artifact_zip.namelist():
            if not name.startswith("ipc-"):
                continue
            testcase = name.replace("ipc-", "")
            with artifact_zip.open(name) as f:
                ipc = float(f.read().decode("utf-8").strip())
            self.append(testcase, ipc)
