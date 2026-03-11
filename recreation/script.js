document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('content-container');
    const tags = document.querySelectorAll('.tag-btn');
    const progressFill = document.getElementById('progress-fill-ui');
    const progressText = document.getElementById('progress-text-ui');
    const totalText = document.getElementById('total-text-ui');

    // Global store for completed items via LocalStorage to maintain state across page loads
    let completedItemsStore = JSON.parse(localStorage.getItem('vaultCompletedStore')) || [];

    function updateProgressUI(currentTotal) {
        let completedInView = document.querySelectorAll('.status-badge.completed').length;
        const percentage = currentTotal === 0 ? 0 : (completedInView / currentTotal) * 100;

        progressFill.style.width = `${percentage}%`;
        progressText.innerText = completedInView;
        totalText.innerText = currentTotal;

        if (percentage > 0) progressText.classList.add('success');
        else progressText.classList.remove('success');

        if (percentage === 100 && currentTotal > 0) progressFill.classList.add('success');
        else progressFill.classList.remove('success');
    }


    

// Function to initialize banner hover effects
function initializeBannerHovers() {
    const banners = document.querySelectorAll('.item-banner, .yt-banner');
    
    banners.forEach(banner => {
        const thumbImg = banner.dataset.thumb;
        
        if (thumbImg) {
            // Remove any existing listeners by cloning and replacing
            const newBanner = banner.cloneNode(true);
            banner.parentNode.replaceChild(newBanner, banner);
            
            newBanner.addEventListener('mouseenter', function() {
                // Set thumbnail
                this.style.backgroundImage = `url('${thumbImg}')`;
            });
            
            newBanner.addEventListener('mouseleave', function() {
                // Remove inline style to revert to CSS class
                this.style.backgroundImage = '';
            });
        }
    });
}


    

    // Re-bind actions when new HTML is fetched
    function initializeCardInteractions() {
        const actionBtns = document.querySelectorAll('.vault-action');
        let currentTotal = actionBtns.length;

        actionBtns.forEach(btn => {
            const card = btn.closest('.item-card') || btn.closest('.yt-card');
            const itemUrl = btn.href; // We use the href as the unique ID for the item

            if (card) {
                let badge = card.querySelector('.status-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'status-badge';
                    card.appendChild(badge);
                }

                // Check store and apply initial states
                if (completedItemsStore.includes(itemUrl)) {
                    badge.classList.add('completed');
                    badge.title = 'Completed';
                    btn.classList.add('completed-btn');
                    btn.innerHTML = '<i class="fas fa-check"></i> Completed';
                } else {
                    badge.title = 'Uncompleted';
                }

                // Strip old listeners by cloning element
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);

                newBtn.addEventListener('click', () => {
                    if (!badge.classList.contains('completed')) {
                        badge.classList.add('completed');
                        badge.title = 'Completed';
                        newBtn.classList.add('completed-btn');
                        newBtn.innerHTML = '<i class="fas fa-check"></i> Completed';

                        // Save to storage
                        if (!completedItemsStore.includes(itemUrl)) {
                            completedItemsStore.push(itemUrl);
                            localStorage.setItem('vaultCompletedStore', JSON.stringify(completedItemsStore));
                        }
                        updateProgressUI(currentTotal);
                    }
                });
            }
        });
        
        // Initialize banner hovers after card interactions are set up
        initializeBannerHovers();
        updateProgressUI(currentTotal);
    }

    // Dynamic Injection Logic
    async function loadSection(target) {
        try {
            const response = await fetch(`${target}.html`);
            if (!response.ok) throw new Error('File not found');
            const html = await response.text();
            contentContainer.innerHTML = html;
            initializeCardInteractions();
        } catch (error) {
            contentContainer.innerHTML = `
                <div style="padding: 40px; text-align:center; color: var(--danger);">
                    <h2><i class="fas fa-exclamation-triangle"></i> Error loading module</h2>
                    <p>Could not load <strong>${target}.html</strong>.</p>
                    <p style="font-size:12px; margin-top:10px;">Ensure you are using a local server (like Live Server) to prevent CORS policy blocks.</p>
                </div>`;
            updateProgressUI(0);
        }
    }

    // --- Draggable Top Navigation Bar ---
    const tagsHeader = document.getElementById('tagsHeader');
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false; 

    tagsHeader.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false; 
        tagsHeader.classList.add('dragging');
        startX = e.pageX - tagsHeader.offsetLeft;
        scrollLeft = tagsHeader.scrollLeft;
    });

    tagsHeader.addEventListener('mouseleave', () => {
        isDown = false;
        tagsHeader.classList.remove('dragging');
    });

    tagsHeader.addEventListener('mouseup', () => {
        isDown = false;
        tagsHeader.classList.remove('dragging');
    });

    tagsHeader.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); 
        const x = e.pageX - tagsHeader.offsetLeft;
        const walk = (x - startX) * 2; 
        if (Math.abs(walk) > 5) isDragging = true; 
        tagsHeader.scrollLeft = scrollLeft - walk;
    });

    // Tag Click Events
    tags.forEach(tag => {
        tag.addEventListener('click', function(e) {
            if (isDragging) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            
            tags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('data-target');
            loadSection(targetId);

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // Load Default Section based on active class
    const initialTarget = document.querySelector('.tag-btn.active').getAttribute('data-target');
    loadSection(initialTarget);
});

// View Toggle Window Function (Must be global to work with inline onclick tags)
window.setView = function(containerId, viewType, btnElement) {
    const container = document.getElementById(containerId);
    if(container) {
        container.classList.remove('grid-view', 'list-view');
        container.classList.add(viewType + '-view');

        const buttonGroup = btnElement.parentElement.querySelectorAll('.view-btn');
        buttonGroup.forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }
}

// Back to Top Logic
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 500) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
});

window.scrollToTop = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * LIFE OS - IFRAME SYNC SCRIPT
 * Add this script to the bottom of the <body> in all your child pages 
 * (e.g., productivity.html, community.html, vault.html)
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Grab the visible text content of the page
    // We clean it up slightly to remove excessive spacing
    const pageContent = document.body.innerText.replace(/\s+/g, ' ').trim();

    // 2. Identify the page details
    const pageData = {
        type: 'REGISTER_SEARCH_INDEX',
        url: window.location.href, // You can also hardcode relative URLs like 'productivity.html'
        title: document.title || 'Untitled Module',
        content: pageContent,
        pageType: 'System Module' // Feel free to customize this (e.g., 'Tool', 'Guide')
    };

    // 3. Transmit the data up to the Main Command Center
    // Note: If you know the exact domain of your dashboard, replace '*' with your domain for better security.
    if (window.parent !== window) {
        window.parent.postMessage(pageData, '*');
        console.log("[Module] Synced content with Command Center.");
    }
});
