/**
 * Plant Adaptation Hub - Router Module
 * Handles soft routing with hashchange events for single-page navigation
 */

class Router {
    constructor() {
        this.routes = {
            'home': 'Plant Adaptation Hub - Home',
            'dashboard': 'Plant Adaptation Hub - Data Dashboard',
            'gwas': 'Plant Adaptation Hub - GWAS Analysis',
            'analysis-general': 'Plant Adaptation Hub - General Analysis',
            'observation': 'Plant Adaptation Hub - Genome Observation',
            'browse': 'Plant Adaptation Hub - Genome Browse'
        };
        
        this.init();
    }

    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleHashChange());
        
        // Set initial hash if none exists
        if (!window.location.hash) {
            window.location.hash = '#home';
        }
        
        // Set up navigation listeners
        this.setupNavigationListeners();
        
        // Handle initial page load
        this.handleHashChange();
    }

    setupNavigationListeners() {
        // Add click listeners to all nav-links
        document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Only prevent default for dropdown items, not dropdown toggles
                if (!link.classList.contains('dropdown-toggle')) {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        // Update URL hash
                        window.location.hash = href;
                        
                        // Update navigation state
                        this.updateNavigation(href.substring(1));
                        
                        // Show corresponding tab
                        this.showTab(href.substring(1));
                    }
                }
            });
        });

        // Handle dropdown menu items separately
        document.querySelectorAll('.dropdown-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    // Close the dropdown
                    this.closeDropdown();
                    
                    // Update URL hash
                    window.location.hash = href;
                    
                    // Update navigation state
                    this.updateNavigation(href.substring(1));
                    
                    // Show corresponding tab
                    this.showTab(href.substring(1));
                }
            });
        });
    }

    closeDropdown() {
        const dropdownElement = document.getElementById('genomic-analysis-dropdown');
        const dropdown = bootstrap.Dropdown.getInstance(dropdownElement);
        if (dropdown) {
            dropdown.hide();
        } else {
            // If no instance exists, manually close it
            const dropdownParent = dropdownElement.closest('.dropdown');
            if (dropdownParent) {
                dropdownParent.classList.remove('show');
                const dropdownMenu = dropdownParent.querySelector('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                }
                dropdownElement.setAttribute('aria-expanded', 'false');
            }
        }
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1) || 'home';
        
        // Update navigation state
        this.updateNavigation(hash);
        
        // Show corresponding tab
        this.showTab(hash);
        
        // Log navigation for user action documentation
        console.log(`Navigation: Switched to ${hash} tab via hash change`);
    }

    updateNavigation(activeTab) {
        // Remove active class from all nav-links and dropdown-items
        document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            link.setAttribute('aria-selected', 'false');
        });
        
        document.querySelectorAll('#sidebar-nav .dropdown-item').forEach(item => {
            item.classList.remove('active');
            item.setAttribute('aria-selected', 'false');
        });
        
        // Add active class to current tab
        const activeLink = document.getElementById(`${activeTab}-tab`);
        if (activeLink) {
            activeLink.classList.add('active');
            activeLink.setAttribute('aria-selected', 'true');
            
            // If it's a dropdown item, also highlight the parent dropdown
            if (activeLink.classList.contains('dropdown-item')) {
                const dropdownToggle = document.getElementById('genomic-analysis-dropdown');
                if (dropdownToggle) {
                    dropdownToggle.classList.add('active');
                }
            }
        }
    }

    showTab(tabId) {
        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        
        // Show active tab pane
        const activePane = document.getElementById(tabId);
        if (activePane) {
            activePane.classList.add('show', 'active');
        }
        
        // Update page title based on tab
        this.updatePageTitle(tabId);
    }

    updatePageTitle(tabId) {
        document.title = this.routes[tabId] || 'Plant Adaptation Hub';
    }

    // Programmatic navigation function
    navigateTo(tabId) {
        window.location.hash = `#${tabId}`;
    }
}

// Export for use in other modules
window.Router = Router;