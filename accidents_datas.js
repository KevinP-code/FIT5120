// accident_data.js
//this code just put the csv to the postgresql , then nothing to do with the app
import { fetchAccidentData } from './fetchAccidentData.js';

export async function loadAccidentData() {
    const response = await fetch('/accidents');
    const data = await response.json();
    return data;
}

// fetchAccidentData.js
export async function fetchAccidentData() {
    const response = await fetch('/accidents');
    const data = await response.json();
    return data;
}

// In your app.py
@app.route('/accidents', methods=['GET'])
def get_accidents():
    cur = conn.cursor()
    cur.execute("SELECT description, latitude, longitude FROM accidents")
    rows = cur.fetchall()
    accidents = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row[2], row[1]]
            },
            "properties": {
                "description": row[0]
            }
        } for row in rows
    ]
    return jsonify({"type": "FeatureCollection", "features": accidents})
