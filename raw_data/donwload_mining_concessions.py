import os
import json
import time
import requests


# Output file path
output_path = "Papua_mining_concession.json"
os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

# Base URL
base_url = (
    "https://geoportal.esdm.go.id/monaresia/sharing/servers/"
    "3b305b4113384b41b7490479e0702093/rest/services/Pusat/WIUP_Publish/MapServer/0/query"
)

# Parameters (excluding offset)
base_params = {
    "f": "json",
    "returnGeometry": "true",
    "spatialRel": "esriSpatialRelIntersects",
    "geometry": json.dumps({
        "xmin": 14393650.877029939,
        "ymin":-1020172.9673174089,
        "xmax": 15698279.24360848,
        "ymax": 120287.47607411061,
        "spatialReference": {"wkid": 102100}
    }),
    "geometryType": "esriGeometryEnvelope",
    "inSR": 4326,
    "outSR": 4326,
    "outFields": (
        "objectid,id_kab,id_prov,badan_usaha,jenis_izin,kode_jnskom,kode_golongan,"
        "kode_wil,komoditas,lokasi,luas_sk,nama_kab,nama_usaha,nama_prov,sk_iup,"
        "pejabat,pulau,generasi,kode_wiup,cnc,kegiatan,tgl_akhir,tgl_berlaku"
    ),
}

# Load existing data if file exists
if os.path.exists(output_path):
    with open(output_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            print(f"Loaded {len(data)} existing features from {output_path}")
        except json.JSONDecodeError:
            print("File was corrupted or empty, starting fresh.")
            data = []
else:
    data = []

# Determine starting offset
start_offset = (len(data) // 100) * 100
print(f"  → Starting from offset {start_offset}")

# Fetch loop
offset = start_offset
while True:
    print(f"\nFetching batch with resultOffset={offset}...")
    params = base_params.copy()
    params["resultOffset"] = offset

    try:
        response = requests.get(base_url, params=params, timeout=60)
        response.raise_for_status()
        res_json = response.json()
    except Exception as e:
        print(f"Request failed: {e}, retrying in 30s...")
        time.sleep(30)
        try:
            response = requests.get(base_url, params=params, timeout=60)
            response.raise_for_status()
            res_json = response.json()
        except Exception as e2:
            print(f"Failed again at offset {offset}. Stopping. Error: {e2}")
            print("Query URL:", response.url)
            break

    # Verify valid response
    if "features" not in res_json or not isinstance(res_json["features"], list):
        print("Invalid response (no features key), stopping.")
        print("Query URL:", response.url)
        break

    features = res_json["features"]
    if not features:
        print("No more features found, stopping.")
        break

    data.extend(features)
    print(f"  → Retrieved {len(features)} features (total: {len(data)})")

    # Save progress every batch
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Progress saved ({len(data)} total features).")

    # Stop if end reached
    if not res_json.get("exceededTransferLimit", False):
        print("All data fetched (no transfer limit exceeded).")
        break

    offset += 100
    time.sleep(1)

print(f"\n Done! Saved {len(data)} total features to {output_path}")