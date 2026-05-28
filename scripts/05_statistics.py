"""
Statistics Processing Script
==============================
Assumptions & Notes:
- Forest cover baseline from treecover2000 masked at 30% threshold
- Loss area calculated in hectares (1 pixel = 30m x 30m = 0.09 ha)
- Lossyear values: 1-25 = 2001-2025 (0 = no loss)
- Gain is a binary layer (1 = gain between 2000-2012, 0 = no gain)
- All stats aggregated using lossyear_masked.tif (treecover2000 >= 30%)
- Driver analysis uses palm oil and wood fiber concession polygons
- Protected area analysis uses terrestrial WDPA polygons only
- CRS: EPSG:4326 (WGS84)
"""

import os
import json
import numpy as np
import geopandas as gpd
import rasterio
from rasterio.mask import mask as raster_mask

VECTORS_DIR = "../processed/vectors"
RASTERS_DIR = "../processed/rasters"
STATS_DIR   = "../processed/stats"

PIXEL_AREA_HA = 0.09  # 30m x 30m in hectares
YEARS = list(range(2001, 2026))  # lossyear 1-25

# ── Load vectors ───────────────────────────────────────────────
print("Loading vectors...")
gdf_province  = gpd.read_file(f"{VECTORS_DIR}/papua_provinces.geojson")
gdf_regency   = gpd.read_file(f"{VECTORS_DIR}/papua_regencies.geojson")
gdf_palm      = gpd.read_file(f"{VECTORS_DIR}/papua_palm_oil.geojson")
gdf_fiber     = gpd.read_file(f"{VECTORS_DIR}/papua_wood_fiber.geojson")
gdf_protected = gpd.read_file(f"{VECTORS_DIR}/papua_protected_areas.geojson")
gdf_mining    = gpd.read_file(f"{VECTORS_DIR}/papua_mining.geojson")

# ── Load rasters ───────────────────────────────────────────────
print("Loading rasters...")
with rasterio.open(f"{RASTERS_DIR}/lossyear_masked.tif") as src:
    lossyear = src.read(1)
    transform = src.transform
    crs = src.crs
    meta = src.meta.copy()

with rasterio.open(f"{RASTERS_DIR}/treecover2000_clipped.tif") as src:
    treecover = src.read(1)

with rasterio.open(f"{RASTERS_DIR}/gain_clipped.tif") as src:
    gain = src.read(1)

# ── Helper: mask raster to polygon and return lossyear array ──
def get_masked_lossyear(gdf, src_path):
    with rasterio.open(src_path) as src:
        shapes = gdf.geometry.values
        try:
            masked, _ = raster_mask(src, shapes, crop=False)
            return masked[0]
        except Exception:
            return np.zeros(src.read(1).shape, dtype=src.meta["dtype"])

# ── Helper: compute annual loss from lossyear array ───────────
def annual_loss_ha(lossyear_arr):
    result = {}
    for year_idx, year in enumerate(YEARS, start=1):
        count = np.sum(lossyear_arr == year_idx)
        result[year] = round(float(count * PIXEL_AREA_HA), 2)
    return result

# ══ STAT 1: Total Summary ══════════════════════════════════════
print("Computing total summary...")

forest_cover_2000_ha = round(float(np.sum(treecover >= 30) * PIXEL_AREA_HA), 2)
total_gain_ha        = round(float(np.sum(gain == 1) * PIXEL_AREA_HA), 2)
annual_loss          = annual_loss_ha(lossyear)
total_loss_ha        = round(sum(annual_loss.values()), 2)
loss_pct_baseline    = round((total_loss_ha / forest_cover_2000_ha) * 100, 2)

total_summary = {
    "forest_cover_2000_ha": forest_cover_2000_ha,
    "total_loss_ha":        total_loss_ha,
    "total_gain_ha":        total_gain_ha,
    "loss_pct_baseline":    loss_pct_baseline,
    "annual_loss":          annual_loss
}

with open(f"{STATS_DIR}/total_summary.json", "w") as f:
    json.dump(total_summary, f, indent=2)
print(f"  Forest cover 2000: {forest_cover_2000_ha:,.0f} ha")
print(f"  Total loss:        {total_loss_ha:,.0f} ha")
print(f"  Total gain:        {total_gain_ha:,.0f} ha")
print(f"  Loss % baseline:   {loss_pct_baseline}%")

# ══ STAT 2: Annual Loss by Province ═══════════════════════════
print("\nComputing annual loss by province...")

province_stats = []
for _, row in gdf_province.iterrows():
    masked = get_masked_lossyear(
        gpd.GeoDataFrame([row], crs=gdf_province.crs),
        f"{RASTERS_DIR}/lossyear_masked.tif"
    )
    yearly = annual_loss_ha(masked)
    cumulative = round(sum(yearly.values()), 2)
    province_stats.append({
        "id":           row["id"],
        "name":         row["name"],
        "annual_loss":  yearly,
        "total_loss_ha": cumulative
    })
    print(f"  {row['name']}: {cumulative:,.0f} ha total loss")

with open(f"{STATS_DIR}/annual_loss_province.json", "w") as f:
    json.dump(province_stats, f, indent=2)

# ══ STAT 3: Annual Loss by Regency ════════════════════════════
print("\nComputing annual loss by regency...")

regency_stats = []
for i, row in gdf_regency.iterrows():
    masked = get_masked_lossyear(
        gpd.GeoDataFrame([row], crs=gdf_regency.crs),
        f"{RASTERS_DIR}/lossyear_masked.tif"
    )
    yearly = annual_loss_ha(masked)
    cumulative = round(sum(yearly.values()), 2)
    regency_stats.append({
        "id":            row["id"],
        "name":          row["name"],
        "province_id":   row["province_id"],
        "annual_loss":   yearly,
        "total_loss_ha": cumulative
    })

    if i % 10 == 0:
        print(f"  Processed {i}/{len(gdf_regency)} regencies...")

with open(f"{STATS_DIR}/annual_loss_regency.json", "w") as f:
    json.dump(regency_stats, f, indent=2)
print(f"  Done — {len(regency_stats)} regencies")

# ══ STAT 4: Loss by Driver (Concessions) ══════════════════════
print("\nComputing loss by driver...")

palm_masked   = get_masked_lossyear(gdf_palm,   f"{RASTERS_DIR}/lossyear_masked.tif")
fiber_masked  = get_masked_lossyear(gdf_fiber,  f"{RASTERS_DIR}/lossyear_masked.tif")
mining_masked = get_masked_lossyear(gdf_mining, f"{RASTERS_DIR}/lossyear_masked.tif")

palm_annual   = annual_loss_ha(palm_masked)
fiber_annual  = annual_loss_ha(fiber_masked)
mining_annual = annual_loss_ha(mining_masked)

outside_annual = {}
for year in YEARS:
    outside_annual[year] = round(
        annual_loss[year] - palm_annual[year] - fiber_annual[year] - mining_annual[year], 2
    )

loss_by_driver = {
    "palm_oil":   {"annual_loss": palm_annual,    "total_loss_ha": round(sum(palm_annual.values()), 2)},
    "wood_fiber": {"annual_loss": fiber_annual,   "total_loss_ha": round(sum(fiber_annual.values()), 2)},
    "mining":     {"annual_loss": mining_annual,  "total_loss_ha": round(sum(mining_annual.values()), 2)},
    "outside":    {"annual_loss": outside_annual, "total_loss_ha": round(sum(outside_annual.values()), 2)}
}

with open(f"{STATS_DIR}/loss_by_driver.json", "w") as f:
    json.dump(loss_by_driver, f, indent=2)
print(f"  Palm oil:   {loss_by_driver['palm_oil']['total_loss_ha']:,.0f} ha")
print(f"  Wood fiber: {loss_by_driver['wood_fiber']['total_loss_ha']:,.0f} ha")
print(f"  Mining:     {loss_by_driver['mining']['total_loss_ha']:,.0f} ha")
print(f"  Outside:    {loss_by_driver['outside']['total_loss_ha']:,.0f} ha")

# ══ STAT 5: Loss Inside vs Outside Protected Areas ════════════
print("\nComputing protected area stats...")

protected_masked = get_masked_lossyear(gdf_protected, f"{RASTERS_DIR}/lossyear_masked.tif")
protected_annual = annual_loss_ha(protected_masked)

outside_pa_annual = {}
for year in YEARS:
    outside_pa_annual[year] = round(annual_loss[year] - protected_annual[year], 2)

loss_protected = {
    "inside_protected":  {"annual_loss": protected_annual,   "total_loss_ha": round(sum(protected_annual.values()), 2)},
    "outside_protected": {"annual_loss": outside_pa_annual,  "total_loss_ha": round(sum(outside_pa_annual.values()), 2)}
}

with open(f"{STATS_DIR}/loss_protected_areas.json", "w") as f:
    json.dump(loss_protected, f, indent=2)
print(f"  Inside protected areas:  {loss_protected['inside_protected']['total_loss_ha']:,.0f} ha")
print(f"  Outside protected areas: {loss_protected['outside_protected']['total_loss_ha']:,.0f} ha")

print("\nAll statistics complete.")