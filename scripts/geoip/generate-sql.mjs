import fs from 'fs';
import readline from 'readline';

function formatRow(tableName, line) {
    if (tableName === 'geoip_locations') {
        const parts = line.split(',');
        const id = parts[0];
        const cc = parts[1];
        const cn = parts[2];
        const cityParts = parts.slice(3).join(',');
        const city = cityParts.replace(/^"/, '').replace(/"$/, '').replace(/'/g, "''");
        return `(${id}, '${cc}', '${cn}', '${city}')`;
    } else if (tableName === 'city_coordinates') {
        const parts = line.split(',');
        const cc = parts[0];
        const lng = parts.pop();
        const lat = parts.pop();
        const cityParts = parts.slice(1).join(',');
        const city = cityParts.replace(/^"/, '').replace(/"$/, '').replace(/'/g, "''");
        return `('${cc}', '${city}', ${lat}, ${lng})`;
    } else {
        const [cidr, id] = line.split(',');
        return `('${cidr}', ${id})`;
    }
}

async function convertCsvToSql(csvFile, tableName, columns, maxLinesPerFile) {
    const fileStream = fs.createReadStream(csvFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isHeader = true;
    let batch = [];
    const BATCH_SIZE = 1000;

    let fileCount = 1;
    let currentLines = 0;

    let out = fs.createWriteStream(`sql/${tableName}_${fileCount}.sql`);
    if (fileCount === 1) {
        out.write(`-- Auto-generated SQL for ${tableName}\nTRUNCATE TABLE public.${tableName} CASCADE;\n\n`);
    }

    const writeBatch = () => {
        if (batch.length > 0) {
            if (tableName === 'city_coordinates') {
                out.write(`INSERT INTO public.${tableName} (${columns}) VALUES\n${batch.join(',\n')}\nON CONFLICT (country_code, city_name) DO UPDATE SET latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude;\n`);
            } else {
                out.write(`INSERT INTO public.${tableName} (${columns}) VALUES\n${batch.join(',\n')};\n`);
            }
            batch = [];
        }
    };

    for await (const line of rl) {
        if (isHeader) { isHeader = false; continue; }
        if (!line.trim()) continue;

        batch.push(formatRow(tableName, line));
        currentLines++;

        if (batch.length === BATCH_SIZE) {
            writeBatch();
        }

        if (currentLines >= maxLinesPerFile) {
            writeBatch();
            out.end();
            fileCount++;
            out = fs.createWriteStream(`sql/${tableName}_${fileCount}.sql`);
            currentLines = 0;
            console.log(`Created sql/${tableName}_${fileCount}.sql...`);
        }
    }

    writeBatch();
    out.end();
    console.log(`Finished generating SQL for ${tableName} (${fileCount} files limit)`);
}

async function run() {
    if (!fs.existsSync('sql')) {
        fs.mkdirSync('sql');
    }

    console.log("Generating SQL for locations...");
    await convertCsvToSql('geoip_locations.csv', 'geoip_locations', 'geoname_id, country_code, country_name, city_name', 25000);

    console.log("Generating SQL for city coordinates...");
    await convertCsvToSql('city_coordinates.csv', 'city_coordinates', 'country_code, city_name, latitude, longitude', 25000);

    console.log("Generating SQL for blocks (Chunked every 25,000 blocks to prevent editor crashes)...");
    await convertCsvToSql('geoip_blocks.csv', 'geoip_blocks', 'network, geoname_id', 25000);
}

run();
