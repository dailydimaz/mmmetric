// --- REPRODUCTION SCRIPT: UA Parsing & Locale Logic ---

function parseUserAgent(ua: string): { browser: string; os: string; device_type: string } {
    let browser = 'Unknown';
    let os = 'Unknown';
    let device_type = 'desktop';

    // Detect browser (Simplified for this test)
    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

    // Detect OS (Simplified)
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // --- BUGGY LOGIC FROM FILE ---
    // if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
    // Explanation: && binds tighter than || in JS.
    // It is evaluated as: (ua.includes('Mobile')) || (ua.includes('Android') && !ua.includes('Tablet'))
    if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
        device_type = 'mobile';
    } else if (ua.includes('Tablet') || ua.includes('iPad')) {
        device_type = 'tablet';
    }

    return { browser, os, device_type };
}

function extractLanguage(header: string): string | null {
    if (!header) return null;
    const primaryLang = header.split(',')[0]?.split(';')[0]?.trim();
    // --- BUGGY LOGIC FROM FILE ---
    return primaryLang?.split('-')[0]?.toLowerCase() || null;
}

// --- TEST CASES ---

const testUAs = [
    {
        name: "iPad (Mobile UA string)",
        ua: "Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1",
        expected: "tablet"
    },
    {
        name: "Android Tablet (Mobile UA string)",
        ua: "Mozilla/5.0 (Linux; Android 4.4.2; Nexus 7 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.99 Mobile Safari/537.36",
        expected: "tablet" // Should be tablet because Nexus 7 is a tablet, but often detected as mobile if Logic is flawed
    },
    {
        name: "iPhone",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
        expected: "mobile"
    }
];

const testLangs = [
    {
        header: "en-US,en;q=0.9",
        expected: "en-us"
    },
    {
        header: "fr-CA,fr;q=0.9",
        expected: "fr-ca"
    }
];

console.log("--- Verifying UA Parsing Logic ---");
let failCount = 0;
testUAs.forEach(t => {
    const result = parseUserAgent(t.ua);
    console.log(`[${t.name}] Expected: ${t.expected}, Got: ${result.device_type}`);
    if (result.device_type !== t.expected) {
        console.error(`  FAIL: ${t.name} misclassified!`);
        failCount++;
    } else {
        console.log(`  PASS`);
    }
});

console.log("\n--- Verifying Locale Logic ---");
testLangs.forEach(t => {
    const result = extractLanguage(t.header);
    console.log(`[${t.header}] Expected: ${t.expected}, Got: ${result}`);
    if (result !== t.expected) { // Note: original logic lowercases, but strips region
        if (result === t.expected.split('-')[0]) {
            console.error(`  FAIL: Region stripped!`);
            failCount++;
        } else {
            console.error(`  FAIL: Wrong language entirely`);
            failCount++;
        }
    } else {
        console.log(`  PASS`);
    }
});

if (failCount > 0) {
    console.log(`\nFound ${failCount} potential bugs.`);
    Deno.exit(1);
} else {
    console.log("\nAll checks passed (Logic might not be buggy?)");
}
