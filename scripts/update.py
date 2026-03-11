"""Update data from OpenXiangShan/XiangShan"""

import argparse
from itertools import count
import logging
from pathlib import Path
import time
from zipfile import ZipFile

from modules.json import DataJson, ReportJson
from modules.github import GitHub

# Data directory structure:
# data/
#     abc123.json
#     def456.json
#     ...
#     data.json

OWNER = "OpenXiangShan"
REPO = "XiangShan"
WORKFLOW = "EMU Performance Test"


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Update data from OpenXiangShan/XiangShan"
    )
    parser.add_argument("--token", help="GitHub personal access token")
    parser.add_argument(
        "--path",
        help="Path to data directory",
        type=Path,
        default=Path(__file__).parent.parent / "data",
    )
    parser.add_argument(
        "--logging-level",
        help="Logging level",
        default="INFO",
    )
    parser.add_argument(
        "--page_limit",
        help="Search commit page limit",
        type=int,
        default=3,
    )
    args = parser.parse_args()

    logging.basicConfig(level=getattr(logging, args.logging_level))

    gh = GitHub(args.token)

    data = DataJson.from_json(args.path / "data.json")

    # get latest commit hash from OpenXiangShan/XiangShan
    found_existing = False
    for page in count(1):
        commits = gh.commits.list_commits(
            "OpenXiangShan", "XiangShan", page=page, per_page=10
        )
        if not commits:
            break

        for commit in commits:
            logging.info("Checking commit %s", commit["sha"])
            if data.exists(commit["sha"]):
                logging.info("  -> Already exists in dataset, finish")
                found_existing = True
                break

            # get workflow run for this commit
            runs = gh.actions.list_workflow_runs(
                "OpenXiangShan",
                "XiangShan",
                event="push",
                status="completed",
                head_sha=commit["sha"],
            )["workflow_runs"]

            runs = list(filter(lambda x: x["name"] == WORKFLOW, runs))

            if not runs:
                logging.info("  -> No workflow related, skip")
                continue

            if len(runs) > 1:
                logging.warning(
                    "  -> Multiple workflow runs found (%s), using the first one",
                    str(map(lambda x: x["id"], runs)),
                )

            run = runs[0]

            if run["conclusion"] != "success":
                logging.warning("  -> Workflow run failed, skip")
                continue

            data.append(
                run["id"],
                commit["sha"],
                commit["commit"]["message"].splitlines()[0],
                # commit["commit"]["author"]["date"],
                int(
                    time.mktime(
                        time.strptime(
                            commit["commit"]["author"]["date"], "%Y-%m-%dT%H:%M:%SZ"
                        )
                    )
                ),
            )

            # get artifacts for this workflow run
            artifacts = gh.actions.list_workflow_run_artifacts(
                "OpenXiangShan",
                "XiangShan",
                run["id"],
            )["artifacts"]

            artifacts = list(filter(lambda x: x["name"].startswith("ipc-"), artifacts))

            report = ReportJson()

            for artifact in artifacts:
                logging.info("  -> Found artifact %s, downloading...", artifact["name"])

                artifact_body = gh.actions.download_artifact(
                    "OpenXiangShan",
                    "XiangShan",
                    artifact["id"],
                )

                if isinstance(artifact_body, bytes):
                    logging.debug("    -> is a raw file")
                    testcase = artifact["name"][len("ipc-") :]
                    ipc = float(artifact_body.decode("utf-8").strip())
                    report.append(testcase, ipc)
                elif isinstance(artifact_body, ZipFile):
                    logging.debug("    -> is a zipfile")
                    extra = list(
                        filter(
                            lambda x: not x.startswith("ipc-"), artifact_body.namelist()
                        )
                    )
                    if extra:
                        logging.warning(
                            "  -> Artifact %s contains non-ipc files: %s, ignore",
                            artifact["name"],
                            str(extra),
                        )
                    report.append_artifact_zip(artifact_body)
                else:
                    logging.warning("    -> unknown file type, ignore")
                    continue

            report.to_json(args.path / f"{commit["sha"]}.json")

        if found_existing or page >= args.page_limit:
            break

    data.to_json(args.path / "data.json")


if __name__ == "__main__":
    main()
