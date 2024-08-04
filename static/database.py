import psycopg2

def get_db_connection():
    conn = psycopg2.connect(
        dbname="accidents_db",
        user="your_username",
        password="your_password",
        host="localhost"
    )
    return conn

def fetch_accidents():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT accident_date, severity, latitude, longitude FROM accidents;')
    accidents = cur.fetchall()
    cur.close()
    conn.close()

    features = []
    for accident in accidents:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [accident[3], accident[2]]
            },
            "properties": {
                "description": f"{accident[0]} - Severity: {accident[1]}"
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }
