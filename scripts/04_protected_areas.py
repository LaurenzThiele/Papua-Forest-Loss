"""
Protected Areas Processing Script
===================================
Assumptions & Notes:
- Source: WDPA May 2026, Indonesia
- Data split across three folders due to size, merged here
- Points layer excluded, only polygon boundaries used
- Marine protected areas excluded, terrestrial only for forest loss analysis
- Clipped to Indonesian Papua using province boundaries
- Geometries simplified at tolerance=0.005 for web performance
- CRS: EPSG:4326 (WGS84)
"""

import os
import pandas as pd
import geopandas as gpd

RAW_DIR = "../raw_data"
VECTORS_DIR = "../processed/vectors"

# ── Load all three polygon shapefiles ─────────────────────────
gdf0 = gpd.read_file(f"{RAW_DIR}/WDPA_WDOECM_May2026_Public_IDN_shp_0/WDPA_WDOECM_May2026_Public_IDN_shp-polygons.shp")
gdf1 = gpd.read_file(f"{RAW_DIR}/WDPA_WDOECM_May2026_Public_IDN_shp_1/WDPA_WDOECM_May2026_Public_IDN_shp-polygons.shp")
gdf2 = gpd.read_file(f"{RAW_DIR}/WDPA_WDOECM_May2026_Public_IDN_shp_2/WDPA_WDOECM_May2026_Public_IDN_shp-polygons.shp")

# ── Merge all three ────────────────────────────────────────────
gdf_wdpa = pd.concat([gdf0, gdf1, gdf2], ignore_index=True)
print(f"Total features before clip: {len(gdf_wdpa)}")

# ── Keep relevant columns ──────────────────────────────────────
gdf_wdpa = gdf_wdpa[["NAME", "DESIG_ENG", "IUCN_CAT", "STATUS", "STATUS_YR", "GIS_AREA", "geometry"]].copy()

# ── Exclude marine protected areas ────────────────────────────
marine_terms = ["Marine", "Locally Managed Marine Area"]
gdf_wdpa = gdf_wdpa[~gdf_wdpa["DESIG_ENG"].str.contains("|".join(marine_terms), case=False, na=False)]

# ── Clip to Papua ──────────────────────────────────────────────
gdf_province = gpd.read_file(f"{VECTORS_DIR}/papua_provinces.geojson")
gdf_wdpa = gdf_wdpa.clip(gdf_province.union_all())
print(f"Total features after clip: {len(gdf_wdpa)}")

# ── Simplify ───────────────────────────────────────────────────
gdf_wdpa["geometry"] = gdf_wdpa.simplify(tolerance=0.005)

# ── Save ───────────────────────────────────────────────────────
gdf_wdpa.to_file(f"{VECTORS_DIR}/papua_protected_areas.geojson", driver="GeoJSON")
print(f"Protected areas: {len(gdf_wdpa)} features, {os.path.getsize(f'{VECTORS_DIR}/papua_protected_areas.geojson') / 1024:.1f} KB")