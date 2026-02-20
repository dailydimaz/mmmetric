#!/bin/bash
# import.sh - Imports comprehensive DB-IP Lite data into Supabase
# Requires 'psql' installed locally

echo "🌍 MMmetric Comprehensive GeoIP Importer"
echo "----------------------------------------"
echo "This script will push 3.7 million IP location blocks directly into your database."
echo "Because of the massive dataset size, we must use direct Postgres bulk-loading (\copy)."
echo ""
echo "Please grab your raw Postgres Connection String from your Supabase Dashboard:"
echo "Dashboard -> Settings -> Database -> Connection string -> URI"
echo "It should look like: postgresql://postgres.lckjlefupqlblfcwhbom:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
echo ""

read -p "Paste Connection String: " DB_URI

if [ -z "$DB_URI" ]; then
    echo "Error: DB string cannot be empty."
    exit 1
fi

echo ""
echo "1/3: Truncating old location data & Inserting GeoIP Locations..."
psql "$DB_URI" -c "TRUNCATE public.geoip_locations CASCADE;"
psql "$DB_URI" -c "\copy public.geoip_locations(geoname_id,country_code,country_name,city_name) FROM 'geoip_locations.csv' WITH (FORMAT csv, HEADER true, ESCAPE '\"');"

echo ""
echo "2/3: Truncating old blocks & Inserting 3.7 million GeoIP Blocks (This may take ~1 minute)..."
psql "$DB_URI" -c "TRUNCATE public.geoip_blocks;"
psql "$DB_URI" -c "\copy public.geoip_blocks(network,geoname_id) FROM 'geoip_blocks.csv' WITH (FORMAT csv, HEADER true);"

echo ""
echo "3/3: Upserting exact City Coordinates for Map Plotting..."
psql "$DB_URI" -c "CREATE TEMP TABLE temp_coordinates (country_code TEXT, city_name TEXT, latitude NUMERIC, longitude NUMERIC);"
psql "$DB_URI" -c "\copy temp_coordinates(country_code,city_name,latitude,longitude) FROM 'city_coordinates.csv' WITH (FORMAT csv, HEADER true, ESCAPE '\"');"
psql "$DB_URI" -c "INSERT INTO public.city_coordinates (country_code, city_name, latitude, longitude) SELECT country_code, city_name, latitude, longitude FROM temp_coordinates ON CONFLICT (country_code, city_name) DO UPDATE SET latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude;"

echo ""
echo "✅ Comprehensive DB-IP Data completely imported!"
