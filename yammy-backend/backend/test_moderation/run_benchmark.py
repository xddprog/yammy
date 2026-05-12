from __future__ import annotations

import argparse
import importlib.util
import sys
import types
from datetime import datetime, timezone
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

# Avoid importing app.core.services.__init__ (pulls auth/jwt); load ml_service only.
_pkg = "app.core.services"
if _pkg not in sys.modules:
    _m = types.ModuleType(_pkg)
    _m.__path__ = [str(_ROOT / "app" / "core" / "services")]
    sys.modules[_pkg] = _m
_spec = importlib.util.spec_from_file_location(
    "app.core.services.ml_service",
    _ROOT / "app" / "core" / "services" / "ml_service.py",
)
_ml_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
sys.modules["app.core.services.ml_service"] = _ml_mod
_spec.loader.exec_module(_ml_mod)
MLService = _ml_mod.MLService
from app.utils.constants.moderation_constants import (
    IMAGE_MODERATION_CLIP_THRESHOLD,
    IMAGE_MODERATION_CLIP_THRESHOLD_NSFW,
)


def _print_row_table(rows: list[dict[str, object]], *, limit: int = 8) -> None:
    def key(r: dict[str, object]) -> float:
        return float(r["prob_unsafe_raw"])

    sorted_rows = sorted(rows, key=key, reverse=True)
    for r in sorted_rows[:limit]:
        idx = int(r["index"])
        cat = str(r["category"])
        diff = float(r["logit_diff"])
        margin = float(r["margin"])
        pr = float(r["prob_unsafe_raw"])
        pa = float(r["prob_after_margin"])
        pm = "Y" if r["passes_margin"] else "N"
        prompt = str(r["prompt"])
        if len(prompt) > 90:
            prompt = prompt[:87] + "..."
        line = (
            f"      #{idx:2d} [{cat:7s}] diff={diff:+.2f} m={margin:.2f} {pm} "
            f"p_raw={pr:.3f} p_gate={pa:.3f}  {prompt}"
        )
        print(line)


def _format_row_table_full(rows: list[dict[str, object]], *, limit: int = 12) -> list[str]:
    def key(r: dict[str, object]) -> float:
        return float(r["prob_unsafe_raw"])

    sorted_rows = sorted(rows, key=key, reverse=True)
    out: list[str] = []
    for r in sorted_rows[:limit]:
        idx = int(r["index"])
        cat = str(r["category"])
        diff = float(r["logit_diff"])
        margin = float(r["margin"])
        pr = float(r["prob_unsafe_raw"])
        pa = float(r["prob_after_margin"])
        pm = "Y" if r["passes_margin"] else "N"
        prompt = str(r["prompt"])
        out.append(
            f"      #{idx:2d} [{cat:7s}] diff={diff:+.2f} m={margin:.2f} {pm} "
            f"p_raw={pr:.3f} p_gate={pa:.3f}  {prompt}"
        )
    return out

_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _is_blocked(probabilities: dict[str, float]) -> bool:
    t = IMAGE_MODERATION_CLIP_THRESHOLD
    t_nsfw = IMAGE_MODERATION_CLIP_THRESHOLD_NSFW
    cats = ["nsfw", "weapons", "drugs", "violence", "hate"]
    is_safe = probabilities["nsfw"] < t_nsfw and all(
        probabilities[c] < t for c in cats if c != "nsfw"
    )
    return not is_safe


def _collect_images(folder: Path) -> list[Path]:
    if not folder.is_dir():
        return []
    out: list[Path] = []
    for p in sorted(folder.iterdir()):
        if p.is_file() and p.suffix.lower() in _EXTENSIONS:
            out.append(p)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="CLIP moderation benchmark over test_moderation/normal and nsfw.")
    parser.add_argument(
        "--log-misses",
        action="store_true",
        help="Write benchmark_misses.log with full row tables for FP/FN (full prompts, no truncation).",
    )
    args = parser.parse_args()

    base = Path(__file__).resolve().parent
    normal_dir = base / "normal"
    nsfw_dir = base / "nsfw"
    normal_files = _collect_images(normal_dir)
    nsfw_files = _collect_images(nsfw_dir)

    if not normal_files and not nsfw_files:
        print("Нет изображений в normal/ и nsfw/.")
        return 1

    ml = MLService()

    fp: list[tuple[str, dict[str, float]]] = []
    fn: list[tuple[str, dict[str, float]]] = []

    for path in normal_files:
        probs = ml._moderate_content_sync(path.read_bytes())
        if _is_blocked(probs):
            fp.append((str(path.relative_to(base)), probs))

    for path in nsfw_files:
        probs = ml._moderate_content_sync(path.read_bytes())
        if not _is_blocked(probs):
            fn.append((str(path.relative_to(base)), probs))

    n_n = len(normal_files)
    n_x = len(nsfw_files)
    n_total = n_n + n_x

    fp_n = len(fp)
    fn_n = len(fn)
    err = fp_n + fn_n

    def pct(part: int, whole: int) -> float:
        return 100.0 * part / whole if whole else 0.0

    print("test_moderation benchmark")
    print(f"  normal: {n_n} файлов")
    print(f"  nsfw:   {n_x} файлов")
    print()
    print("Ложные срабатывания (normal, но заблокировано):", fp_n)
    if fp:
        for rel, p in fp:
            print(f"    {rel}  nsfw={p['nsfw']:.3f} w={p['weapons']:.3f} d={p['drugs']:.3f} v={p['violence']:.3f} h={p['hate']:.3f}")
            rows = ml.clip_moderation_rows_detail((base / rel).read_bytes())
            print("      top rows by p_raw:")
            _print_row_table(rows)
    print()
    print("Пропуски NSFW (nsfw, но пропущено):", fn_n)
    if fn:
        for rel, p in fn:
            print(f"    {rel}  nsfw={p['nsfw']:.3f} w={p['weapons']:.3f} d={p['drugs']:.3f} v={p['violence']:.3f} h={p['hate']:.3f}")
            rows = ml.clip_moderation_rows_detail((base / rel).read_bytes())
            print("      top rows by p_raw:")
            _print_row_table(rows)
    print()
    print("Доли ошибок:")
    print(f"  промах по normal (FPR): {pct(fp_n, n_n):.1f}%  ({fp_n}/{n_n})")
    print(f"  промах по nsfw (FNR):   {pct(fn_n, n_x):.1f}%  ({fn_n}/{n_x})")
    print(f"  общий промах:           {pct(err, n_total):.1f}%  ({err}/{n_total})")

    if args.log_misses and (fp or fn):
        log_path = base / "benchmark_misses.log"
        lines: list[str] = [
            f"# benchmark_misses {datetime.now(timezone.utc).isoformat()}",
            f"# normal_files={n_n} nsfw_files={n_x} fp={fp_n} fn={fn_n}",
            "",
        ]
        if fp:
            lines.append("## false_positives (normal/ blocked)")
            lines.append("")
            for rel, p in fp:
                lines.append(
                    f"{rel}  nsfw={p['nsfw']:.3f} w={p['weapons']:.3f} d={p['drugs']:.3f} "
                    f"v={p['violence']:.3f} h={p['hate']:.3f}"
                )
                rows = ml.clip_moderation_rows_detail((base / rel).read_bytes())
                lines.extend(_format_row_table_full(rows))
                lines.append("")
        if fn:
            lines.append("## false_negatives (nsfw/ passed)")
            lines.append("")
            for rel, p in fn:
                lines.append(
                    f"{rel}  nsfw={p['nsfw']:.3f} w={p['weapons']:.3f} d={p['drugs']:.3f} "
                    f"v={p['violence']:.3f} h={p['hate']:.3f}"
                )
                rows = ml.clip_moderation_rows_detail((base / rel).read_bytes())
                lines.extend(_format_row_table_full(rows))
                lines.append("")
        log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print()
        print(f"Детальный лог промахов записан: {log_path.relative_to(base.parent)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
