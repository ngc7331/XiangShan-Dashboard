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
#     branch/
#         abc123.json # commit hash
#         def456.json
#         ...
#         data.json
#     ...

OWNER = "OpenXiangShan"
REPO = "XiangShan"
WORKFLOW = "EMU Performance Test"
DATA_PATH = Path(__file__).parent.parent / "data"


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Update data from OpenXiangShan/XiangShan"
    )
    parser.add_argument("--token", help="GitHub personal access token")
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
    parser.add_argument(
        "--branch",
        help="Branch to check for commits",
        default="kunminghu-v3",
    )
    args = parser.parse_args()

    data_path = DATA_PATH / "test" / args.branch

    logging.basicConfig(level=getattr(logging, args.logging_level))

    gh = GitHub(args.token)

    data = DataJson.from_json(data_path / "data.json")

    # get latest commit hash from OpenXiangShan/XiangShan
    found_existing = False
    for page in count(1):
        commits = gh.commits.list_commits(
            "OpenXiangShan", "XiangShan", sha=args.branch, page=page, per_page=10
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

            # get artifacts for this workflow run
            artifacts = []
            for artifact_page in count(1):
                artifacts_page = gh.actions.list_workflow_run_artifacts(
                    "OpenXiangShan",
                    "XiangShan",
                    run["id"],
                    page=artifact_page,
                )["artifacts"]
                if not artifacts_page:
                    break
                artifacts.extend(artifacts_page)

            artifacts = list(filter(lambda x: x["name"].startswith("ipc-"), artifacts))

            if len(artifacts) == 0:
                logging.info("  -> No artifact, skip")
                continue

            logging.info("  -> Found %d artifacts", len(artifacts))

            report = ReportJson()

            for artifact in artifacts:
                logging.info("  -> Download %s ...", artifact["name"])

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

            report.to_json(data_path / f"{commit["sha"]}.json")

            data.append(
                run["id"],
                commit["sha"],
                commit["commit"]["message"].splitlines()[0],
                int(
                    time.mktime(
                        time.strptime(
                            commit["commit"]["committer"]["date"], "%Y-%m-%dT%H:%M:%SZ"
                        )
                    )
                ),
            )

        if found_existing or page >= args.page_limit:
            break

    data.to_json(data_path / "data.json")


if __name__ == "__main__":
    main()
