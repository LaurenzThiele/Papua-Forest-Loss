"""
Concessions Processing Script
==============================
Assumptions & Notes:
- Palm oil and wood fiber concessions from Global Forest Watch
- Mining concessions from Indonesian ESDM (Papua_mining_concessions.json)
- Mining source uses Esri JSON geometry (rings arrays), converted here
- Multiple rings per feature unioned into MultiPolygon where applicable
- Clipped to Indonesian Papua using province boundaries
- Geometries simplified for web performance
- Only retaining columns relevant for analysis and display
- CRS: EPSG:4326 (WGS84)
"""

import json
import geopandas as gpd
import pandas as pd
import os
from shapely.geometry import Polygon
from shapely.ops import transform, unary_union

VECTORS_DIR = "../processed/vectors"
RAW_DIR = "../raw_data"

# ── Load ───────────────────────────────────────────────────────
gdf_palm = gpd.read_file(f"{RAW_DIR}/Indonesia_oil_palm_concessions.geojson")
gdf_fiber = gpd.read_file(f"{RAW_DIR}/Indonesia_wood_fiber_concessions.geojson")

# ── Load province boundaries for clipping ─────────────────────
gdf_province = gpd.read_file(f"{VECTORS_DIR}/papua_provinces.geojson")

# ── Helper: flatten Z to 2D ────────────────────────────────────
def flatten_2d(geom):
    return transform(lambda x, y, z=None: (x, y), geom)

# ── Helper: convert Esri rings array to shapely geometry ───────
def esri_rings_to_geometry(rings):
    polys = []
    for ring in rings:
        if len(ring) < 3:
            continue
        p = Polygon(ring)
        if not p.is_valid:
            p = p.buffer(0)
        polys.append(p)
    if not polys:
        return None
    return unary_union(polys)

# ── Process palm oil ───────────────────────────────────────────
gdf_palm = gdf_palm[["company", "name", "area_ha", "type", "geometry"]].copy()
gdf_palm["geometry"] = gdf_palm["geometry"].apply(flatten_2d)
gdf_palm = gdf_palm.clip(gdf_province.union_all())
gdf_palm["geometry"] = gdf_palm.simplify(tolerance=0.001)
gdf_palm["concession_type"] = "palm_oil"

# ── Process wood fiber ─────────────────────────────────────────
gdf_fiber = gdf_fiber[["name", "area_ha", "type", "geometry"]].copy()
gdf_fiber["geometry"] = gdf_fiber["geometry"].apply(flatten_2d)
gdf_fiber = gdf_fiber.clip(gdf_province.union_all())
gdf_fiber["geometry"] = gdf_fiber.simplify(tolerance=0.001)
gdf_fiber["concession_type"] = "wood_fiber"

# ── Process mining concessions (Esri JSON) ─────────────────────
with open(f"{RAW_DIR}/Papua_mining_concessions.json", encoding="utf-8") as f:
    mining_raw = json.load(f)

mining_records = []
for feature in mining_raw:
    geom = esri_rings_to_geometry(feature["geometry"]["rings"])
    if geom is None:
        continue
    attr = feature["attributes"]
    mining_records.append({
        "name":             attr.get("nama_usaha"),
        "commodity":        attr.get("komoditas"),
        "activity":         attr.get("kegiatan"),
        "permit_type":      attr.get("jenis_izin"),
        "area_ha":          attr.get("luas_sk"),
        "regency":          attr.get("nama_kab"),
        "geometry":         geom,
    })

gdf_mining = gpd.GeoDataFrame(mining_records, crs="EPSG:4326")
gdf_mining = gdf_mining.clip(gdf_province.union_all())
gdf_mining["geometry"] = gdf_mining.simplify(tolerance=0.001)
gdf_mining["concession_type"] = "mining"

# ── Save ───────────────────────────────────────────────────────
gdf_palm.to_file(f"{VECTORS_DIR}/papua_palm_oil.geojson", driver="GeoJSON")
gdf_fiber.to_file(f"{VECTORS_DIR}/papua_wood_fiber.geojson", driver="GeoJSON")
gdf_mining.to_file(f"{VECTORS_DIR}/papua_mining.geojson", driver="GeoJSON")

print(f"Palm oil:   {len(gdf_palm)} features, {os.path.getsize(f'{VECTORS_DIR}/papua_palm_oil.geojson') / 1024:.1f} KB")
print(f"Wood fiber: {len(gdf_fiber)} features, {os.path.getsize(f'{VECTORS_DIR}/papua_wood_fiber.geojson') / 1024:.1f} KB")
print(f"Mining:     {len(gdf_mining)} features, {os.path.getsize(f'{VECTORS_DIR}/papua_mining.geojson') / 1024:.1f} KB")