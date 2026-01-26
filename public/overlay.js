(function () {
    if (window._mm_overlay) return;
    window._mm_overlay = true;

    // Create overlay container
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;width:300px;height:400px;background:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:999999;border-radius:8px;display:flex;flex-direction:column;font-family:system-ui,sans-serif;overflow:hidden;border:1px solid #e2e8f0;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'background:#f8fafc;padding:12px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;';
    header.innerHTML = '<span style="font-weight:600;font-size:14px;color:#0f172a;">mmmetric</span><button id="mm-close" style="border:none;background:none;cursor:pointer;font-size:18px;color:#64748b;">×</button>';
    container.appendChild(header);

    // Content (Iframe)
    var iframe = document.createElement('iframe');
    iframe.src = 'https://your-instance.com/dashboard?embed=true'; // Point to dashboard
    iframe.style.cssText = 'flex:1;border:none;width:100%;height:100%;';
    container.appendChild(iframe);

    document.body.appendChild(container);

    // Close handler
    document.getElementById('mm-close').onclick = function () {
        document.body.removeChild(container);
        window._mm_overlay = false;
    };
})();
