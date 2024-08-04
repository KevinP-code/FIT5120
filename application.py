from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from mapbox import Directions

application = Flask(__name__)
CORS(application)

# Mapbox API Key
mapbox_token = 'pk.eyJ1Ijoic3V1cGVyaGVybyIsImEiOiJjbHo3NGIxbzMwMzM2MmpwdmVzeDc2c2xqIn0.-ONpUlmLcuOhIVi_gSpsEQ'

service = Directions()


@application.route('/')
def index():
    return send_from_directory('static', 'homepage.html')


@application.route('/index')
def route_planner():
    return send_from_directory('static', 'index.html')


@application.route('/datapage')
def accident_statistics():
    return send_from_directory('static', 'datapage.html')


@application.route('/route', methods=['POST'])
def get_route():
    data = request.json
    print(f"Received request: {data}")

    origin = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [data['origin']['lng'], data['origin']['lat']]
        }
    }
    destination = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [data['destination']['lng'], data['destination']['lat']]
        }
    }

    response = service.directions([origin, destination], profile='mapbox/cycling')

    if response.status_code == 200:
        directions = response.json()
        print(f"Directions: {directions}")
        return jsonify(directions)
    else:
        print(f"Error: {response.status_code}")
        return jsonify({'error': 'Unable to fetch route'}), response.status_code


@application.route('/accidents', methods=['GET'])
def get_accidents():
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="a7316713",
        host="database-2.c9e42ai486qt.ap-southeast-2.rds.amazonaws.com"
    )
    cur = conn.cursor()
    cur.execute("SELECT latitude, longitude, accident_date, severity FROM accidents")
    rows = cur.fetchall()
    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row[1], row[0]]
            },
            "properties": {
                "description": f"Accident on {row[2]} with severity {row[3]}",
                "severity": row[3]  # Add severity to properties
            }
        })
    cur.close()
    conn.close()
    return jsonify({"type": "FeatureCollection", "features": features})


if __name__ == '__main__':
    application.run(host="0.0.0.0" , debug=True)
