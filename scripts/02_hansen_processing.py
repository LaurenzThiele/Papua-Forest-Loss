"""
Hansen GFC 2025 v1.13 Processing Script
========================================
Assumptions & Notes:
- Treecover2000 threshold: 30% (standard GFW definition for forest)
- Loss area calculated in hectares (1 pixel = 30m x 30m = 0.09 ha)
- Analysis clipped to Indonesian Papua using administrative boundaries
- Lossyear values: 1-25 = 2001-2025 (0 = no loss)
- Gain is a binary layer (1 = gain between 2000-2012, 0 = no gain)
- CRS: EPSG:4326 (WGS84)
"""

import numpy as np
import geopandas as gpd
import rasterio
from rasterio.merge import merge
from rasterio.mask import mask
import os

# ── Paths ──────────────────────────────────────────────────────
RAW_DIR = "../raw_data"
VECTORS_DIR = "../processed/vectors"
RASTERS_DIR = "../processed/rasters"

TREECOVER_TILES = [
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_treecover2000_00N_120E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_treecover2000_00N_130E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_treecover2000_00N_140E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_treecover2000_10N_130E.tif",
]

LOSSYEAR_TILES = [
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_lossyear_00N_120E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_lossyear_00N_130E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_lossyear_00N_140E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_lossyear_10N_130E.tif",
]

GAIN_TILES = [
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_gain_00N_120E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_gain_00N_130E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_gain_00N_140E.tif",
    f"{RAW_DIR}/Hansen_GFC-2025-v1.13_gain_10N_130E.tif",
]

TREECOVER_THRESHOLD = 30

# ── Helpers ────────────────────────────────────────────────────
def file_exists(path):
    if os.path.exists(path):
        print(f"Skipping (already exists): {path}")
        return True
    return False

# ── Step 1: Merge tiles per band ───────────────────────────────
def merge_tiles(tile_paths, output_path):
    if file_exists(output_path):
        return
    src_files = [rasterio.open(p) for p in tile_paths]
    merged, transform = merge(src_files)
    meta = src_files[0].meta.copy()
    meta.update({
        "driver": "GTiff",
        "height": merged.shape[1],
        "width": merged.shape[2],
        "transform": transform,
        "compress": "lzw"
    })
    with rasterio.open(output_path, "w", **meta) as dst:
        dst.write(merged)
    for src in src_files:
        src.close()
    print(f"Saved: {output_path}")

print("Step 1: Merging tiles...")
merge_tiles(TREECOVER_TILES, f"{RASTERS_DIR}/treecover2000_merged.tif")
merge_tiles(LOSSYEAR_TILES,  f"{RASTERS_DIR}/lossyear_merged.tif")
merge_tiles(GAIN_TILES,      f"{RASTERS_DIR}/gain_merged.tif")

# ── Step 2: Clip to Papua extent ───────────────────────────────
def clip_raster(input_path, output_path, shapes):
    if file_exists(output_path):
        return
    with rasterio.open(input_path) as src:
        clipped, transform = mask(src, shapes, crop=True)
        meta = src.meta.copy()
        meta.update({
            "height": clipped.shape[1],
            "width": clipped.shape[2],
            "transform": transform,
            "compress": "lzw"
        })
        with rasterio.open(output_path, "w", **meta) as dst:
            dst.write(clipped)
    print(f"Saved: {output_path}")

print("Step 2: Clipping to Papua extent...")
gdf_province = gpd.read_file(f"{VECTORS_DIR}/papua_provinces.geojson")
papua_shapes = gdf_province.geometry.values

clip_raster(f"{RASTERS_DIR}/treecover2000_merged.tif", f"{RASTERS_DIR}/treecover2000_clipped.tif", papua_shapes)
clip_raster(f"{RASTERS_DIR}/lossyear_merged.tif",      f"{RASTERS_DIR}/lossyear_clipped.tif",      papua_shapes)
clip_raster(f"{RASTERS_DIR}/gain_merged.tif",          f"{RASTERS_DIR}/gain_clipped.tif",           papua_shapes)

# ── Step 3: Apply treecover2000 mask to lossyear ───────────────
LOSSYEAR_MASKED = f"{RASTERS_DIR}/lossyear_masked.tif"

if not file_exists(LOSSYEAR_MASKED):
    print("Step 3: Applying treecover2000 mask to lossyear...")
    with rasterio.open(f"{RASTERS_DIR}/treecover2000_clipped.tif") as tc_src:
        treecover = tc_src.read(1)

    with rasterio.open(f"{RASTERS_DIR}/lossyear_clipped.tif") as ly_src:
        lossyear = ly_src.read(1)
        meta = ly_src.meta.copy()

    forest_mask = treecover >= TREECOVER_THRESHOLD
    lossyear_masked = np.where(forest_mask, lossyear, 0)

    with rasterio.open(LOSSYEAR_MASKED, "w", **meta) as dst:
        dst.write(lossyear_masked.astype(meta["dtype"]), 1)

    print(f"Saved: {LOSSYEAR_MASKED}")

print("All steps complete.")