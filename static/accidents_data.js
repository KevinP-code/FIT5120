import psycopg2
import json

def fetch_accident_data():
    conn = psycopg2.connect(
        dbname="victoria",
        user="postgres",
        password="a7316713",
        host="localhost"
    )
    cur = conn.cursor()

    cur.execute("SELECT accident_date, severity, latitude, longitude FROM accidents")
    rows = cur.fetchall()

    features = []
    for row in rows:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row[3], row[2]]
            },
            "properties": {
                "description": f"Date: {row[0]}, Severity: {row[1]}"
            }
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    cur.close()
    conn.close()

    return geojson

def write_to_js_file(data):
    js_content = f"export const accidents_data = {json.dumps(data, indent=4)};"
    with open('static/accidents_data.js', 'w') as f:
        f.write(js_content)

if __name__ == "__main__":
    accident_data = fetch_accident_data()
    write_to_js_file(accident_data)
