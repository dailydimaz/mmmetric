import fs from 'fs';
import readline from 'readline';
import path from 'path';

const ipInt = (ip) => ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
const intIp = (int) => [(int >>> 24), (int >> 16 & 255), (int >> 8 & 255), (int & 255)].join('.');

function rangeToCIDRs(startIp, endIp) {
    let start = ipInt(startIp);
    const end = ipInt(endIp);
    const result = [];
    while (start <= end) {
        let maxSize = 32;
        while (maxSize > 0) {
            const mask = Math.pow(2, 32 - (maxSize - 1)) - 1;
            const maskBase = (start & ~mask) >>> 0;
            if (maskBase !== start || start + mask > end) {
                break;
            }
            maxSize--;
        }
        const x = Math.pow(2, 32 - maxSize);
        result.push(`${intIp(start)}/${maxSize}`);
        start += x;
    }
    return result;
}

async function convertDbIp(inputFile) {
    const locations = new Map();
    let geonameId = 1;

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    console.log(`Processing ${inputFile}... (This could take a minute)`);

    const outLocs = fs.createWriteStream('geoip_locations.csv');
    const outBlocks = fs.createWriteStream('geoip_blocks.csv');
    const outCoords = fs.createWriteStream('city_coordinates.csv');

    outLocs.write('geoname_id,country_code,country_name,city_name\n');
    outBlocks.write('network,geoname_id\n');
    outCoords.write('country_code,city_name,latitude,longitude\n');

    let processedLines = 0;

    for await (const line of rl) {
        if (line.startsWith('ip_start')) continue; // Header loop

        // DB-IP fields: ip_start,ip_end,continent,country,stateprov,city,latitude,longitude
        const parts = line.split(',').map(p => p.replace(/"/g, ''));
        if (parts.length < 8) continue;

        const [ipStart, ipEnd, continent, countryCode, stateprov, city, lat, lng] = parts;

        if (ipStart.includes(':') || !ipStart || !ipEnd) continue; // Skip IPv6 / empties

        const locationKey = `${countryCode}|${city}`;

        if (!locations.has(locationKey)) {
            locations.set(locationKey, {
                geoname_id: geonameId++,
                country_code: countryCode,
                country_name: countryCode,
                city_name: city || '',
                lat: lat,
                lng: lng
            });

            const loc = locations.get(locationKey);

            outLocs.write(`${loc.geoname_id},${loc.country_code},${loc.country_name},"${loc.city_name}"\n`);

            if (loc.lat && loc.lng && loc.city_name) {
                outCoords.write(`${loc.country_code},"${loc.city_name}",${loc.lat},${loc.lng}\n`);
            }
        }

        const loc = locations.get(locationKey);
        const cidrs = rangeToCIDRs(ipStart, ipEnd);
        for (const cidr of cidrs) {
            outBlocks.write(`${cidr},${loc.geoname_id}\n`);
        }

        processedLines++;
        if (processedLines % 500000 === 0) {
            console.log(`Processed ${processedLines} ranges...`);
        }
    }

    outLocs.end();
    outBlocks.end();
    outCoords.end();

    console.log(`Finished converting ${processedLines} ranges into cleanly structured CSVs!`);
}

convertDbIp(process.argv[2] ?? 'dbip-city-lite-2026-02.csv');
