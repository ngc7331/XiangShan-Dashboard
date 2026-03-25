"""Update data from OpenXiangShan/XiangShan"""

import argparse
from itertools import count
import logging
from pathlib import Path
import time
from typing import Callable
from zipfile import ZipFile

from modules.json import DataJson, ReportTestJson, ReportNightlyJson
from modules.github import GitHub

OWNER = "OpenXiangShan"
REPO = "XiangShan"
DATA_PATH = Path(__file__).parent.parent / "data"


def get_artifacts(
    gh: GitHub, run_id: int, filter_func: Callable[[dict], bool] | None = None
) -> list[dict]:
    """A wrapper to get all artifacts for a workflow run, handling pagination"""
    artifacts = []
    for artifact_page in count(1):
        artifacts_page = gh.actions.list_workflow_run_artifacts(
            OWNER,
            REPO,
            run_id,
            page=artifact_page,
        )["artifacts"]
        if not artifacts_page:
            break
        artifacts.extend(artifacts_page)
    if filter_func:
        artifacts = list(filter(filter_func, artifacts))
    return artifacts


def update_test(gh: GitHub, args: argparse.Namespace) -> None:
    """Update data for the Performance Test workflow"""
    workflow = "EMU Performance Test"
    data_path = DATA_PATH / "test" / args.branch

    data = DataJson.from_json(data_path / "data.json")

    # get latest commit hash from OpenXiangShan/XiangShan
    found_existing = False
    for page in count(1):
        commits = gh.commits.list_commits(
            OWNER, REPO, sha=args.branch, page=page, per_page=10
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
                OWNER,
                REPO,
                event="push",
                status="completed",
                head_sha=commit["sha"],
            )["workflow_runs"]

            runs = list(filter(lambda x: x["name"] == workflow, runs))

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
            artifacts = get_artifacts(
                gh, run["id"], lambda x: x["name"].startswith("ipc-")
            )

            if len(artifacts) == 0:
                logging.info("  -> No artifact, skip")
                continue

            logging.info("  -> Found %d artifacts", len(artifacts))

            report = ReportTestJson()

            for artifact in artifacts:
                logging.info("  -> Download %s ...", artifact["name"])

                artifact_body = gh.actions.download_artifact(
                    OWNER,
                    REPO,
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


def update_nightly(gh: GitHub, args: argparse.Namespace) -> None:
    """Update data for the Nightly Regression workflow"""
    workflow = "Nightly Regression"
    data_path = DATA_PATH / "nightly" / args.branch

    data = DataJson.from_json(data_path / "data.json")

    # get latest action runs for this workflow
    found_existing = False
    for page in count(1):
        runs = gh.actions.list_workflow_runs(
            OWNER,
            REPO,
            branch=args.branch,
            event="schedule",
            status="completed",
            page=page,
            per_page=10,
        )["workflow_runs"]
        if not runs:
            break

        for run in runs:
            logging.info("Checking workflow run %s", run["id"])

            if data.exists(run["head_sha"]):
                logging.info("  -> Already exists in dataset, finish")
                found_existing = True
                break

            if run["name"] != workflow:
                logging.info("  -> Workflow name mismatch, skip")
                continue

            if run["conclusion"] != "success":
                logging.warning("  -> Workflow run failed, skip")
                continue

            commit = gh.commits.get_commit(OWNER, REPO, run["head_sha"])

            artifacts = get_artifacts(
                gh, run["id"], lambda x: x["name"].startswith("score")
            )

            if len(artifacts) == 0:
                logging.info("  -> No artifact, skip")
                continue

            logging.info("  -> Found %d artifacts", len(artifacts))

            report = ReportNightlyJson()

            for artifact in artifacts:
                logging.info("  -> Download %s ...", artifact["name"])

                artifact_body = gh.actions.download_artifact(
                    OWNER,
                    REPO,
                    artifact["id"],
                )

                if isinstance(artifact_body, bytes):
                    logging.debug("    -> is a raw file")
                    txt = artifact_body.decode("utf-8").strip()
                    report.append_score_txt(txt)
                elif isinstance(artifact_body, ZipFile):
                    logging.debug("    -> is a zipfile")
                    extra = list(
                        filter(lambda x: not x == "score.txt", artifact_body.namelist())
                    )
                    if extra:
                        logging.warning(
                            "  -> Artifact %s contains score files: %s, ignore",
                            artifact["name"],
                            str(extra),
                        )
                    report.append_artifact_zip(artifact_body)
                else:
                    logging.warning("    -> unknown file type, ignore")
                    continue

            report.to_json(data_path / f"{run["head_sha"]}.json")

            data.append(
                run["id"],
                run["head_sha"],
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
        "--page-limit",
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

    logging.basicConfig(level=getattr(logging, args.logging_level))

    gh = GitHub(args.token)

    update_test(gh, args)
    update_nightly(gh, args)


if __name__ == "__main__":
    main()
