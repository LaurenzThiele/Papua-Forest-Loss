"""
Administrative Boundaries Processing Script
============================================
Assumptions & Notes:
- Source data exported from MySQL database via ST_AsText() as WKT
- Raw geometry is stored as (lat, lon) — flipped to (lon, lat) for EPSG:4326
- Geometries standardized to MultiPolygon for consistency
- Simplified at tolerance=0.005 degrees for web performance
- Subdistrict level excluded — regency is the finest analysis unit
- CRS: EPSG:4326 (WGS84)
"""

from shapely.ops import transform
from shapely.geometry import MultiPolygon
import pandas as pd
import geopandas as gpd
from shapely import wkt
import os

# Read CSVs
df_province = pd.read_csv("../raw_data/Province.csv")
df_regency = pd.read_csv("../raw_data/Regency_City.csv")

# Convert WKT to shapely geometries
df_province["geometry"] = df_province["geometry"].apply(wkt.loads)
df_regency["geometry"] = df_regency["geometry"].apply(wkt.loads)

# Fix flipped coordinates (lat/lon -> lon/lat)
def flip_coords(geom):
    return transform(lambda x, y: (y, x), geom)

df_province["geometry"] = df_province["geometry"].apply(flip_coords)
df_regency["geometry"] = df_regency["geometry"].apply(flip_coords)

# Standardize to MultiPolygon
def to_multipolygon(geom):
    if geom.geom_type == "Polygon":
        return MultiPolygon([geom])
    return geom

df_province["geometry"] = df_province["geometry"].apply(to_multipolygon)
df_regency["geometry"] = df_regency["geometry"].apply(to_multipolygon)

# Convert to GeoDataFrame
gdf_province = gpd.GeoDataFrame(df_province, geometry="geometry", crs="EPSG:4326")
gdf_regency = gpd.GeoDataFrame(df_regency, geometry="geometry", crs="EPSG:4326")

# Simplify geometries
gdf_province["geometry"] = gdf_province.simplify(tolerance=0.005)
gdf_regency["geometry"] = gdf_regency.simplify(tolerance=0.005)

# Save
gdf_province.to_file("../processed/vectors/papua_provinces.geojson", driver="GeoJSON")
gdf_regency.to_file("../processed/vectors/papua_regencies.geojson", driver="GeoJSON")

print(f"Provinces: {os.path.getsize('../processed/vectors/papua_provinces.geojson') / 1024:.1f} KB")
print(f"Regencies: {os.path.getsize('../processed/vectors/papua_regencies.geojson') / 1024:.1f} KB")