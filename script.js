// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

    // --- DOM Element References ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const dashboardView = document.getElementById('dashboard');
    const iframeView = document.getElementById('iframe-container');
    const appFrame = document.getElementById('app-frame');
    const iframeLoader = document.getElementById('iframe-loader');
    const searchInput = document.getElementById('global-search-input');

    // --- Navigation Logic ---
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button state
            navBtns.forEach(b => b.classList.remove('active-btn'));
            btn.classList.add('active-btn');

            const type = btn.getAttribute('data-type');

            if (type === 'native') {
                // Show the native dashboard view
                iframeView.classList.remove('active');
                dashboardView.classList.add('active');
                // Optionally clear the iframe source to stop loading
                // appFrame.src = ''; 
            } 
            else if (type === 'iframe') {
                const targetUrl = btn.getAttribute('data-url');
                // Show the iframe container view
                dashboardView.classList.remove('active');
                iframeView.classList.add('active');
                
                // Show loader and set iframe source
                iframeLoader.style.display = 'block';
                appFrame.style.opacity = '0';
                appFrame.src = targetUrl;
            }
        });
    });

    // Hide iframe loader when the iframe content has finished loading
    appFrame.addEventListener('load', () => {
        iframeLoader.style.display = 'none';
        appFrame.style.opacity = '1';
    });

    // --- AI Popup Logic ---
    // Make function global so it can be called from onclick attributes
    window.toggleAIPopup = function() {
        const popup = document.getElementById('ai-popup-container');
        popup.classList.toggle('active');
    }

    // --- External Link Interceptor ---
    // Forces external links to open in a new tab
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const url = link.getAttribute('href');
        if (!url || url.startsWith('#') || url.startsWith('javascript:')) return;

        try {
            const urlObj = new URL(url, window.location.origin);
            // If hostname is different, force new tab
            if (urlObj.hostname !== window.location.hostname) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        } catch (error) {
            // Ignore invalid URLs
        }
    });

    // --- OS Central Nervous System (Message Listener) ---
    // This acts as the base hub to receive commands from all your other pages
    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        console.log("[Master OS] Signal Received:", data);

        switch(data.type) {
            // 1. Finance Updates
            case 'UPDATE_FINANCE':
                if (data.netWorth) document.getElementById('widget-net-worth').innerText = data.netWorth;
                if (data.income) document.getElementById('widget-income').innerText = data.income;
                if (data.expenses) document.getElementById('widget-expenses').innerText = data.expenses;
                if (data.investments) document.getElementById('widget-investments').innerText = data.investments;
                break;
                
            // 2. Goal Updates (Expects format: { type: 'UPDATE_GOAL', id: '1', progress: '90%' })
            case 'UPDATE_GOAL':
                if (data.id && data.progress) {
                    const txtObj = document.getElementById(`goal-${data.id}-txt`);
                    const barObj = document.getElementById(`goal-${data.id}-bar`);
                    if (txtObj) txtObj.innerText = data.progress;
                    if (barObj) barObj.style.width = data.progress;
                }
                break;

            // 3. Routine Updates (Expects format: { type: 'UPDATE_ROUTINE', id: 'routine-1', done: true })
            case 'UPDATE_ROUTINE':
                if (data.id) {
                    const routineEl = document.getElementById(data.id);
                    if (routineEl) {
                        data.done ? routineEl.classList.add('done') : routineEl.classList.remove('done');
                    }
                }
                break;

            // 4. Global Search Execution (Can be triggered from other pages)
            case 'EXECUTE_SEARCH':
                if (data.query) {
                    const searchInput = document.getElementById('global-search-input');
                   
