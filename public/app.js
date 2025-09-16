/**
 * Plant Adaptation Hub - Main Application
 * Initializes all modules and handles application startup
 */

class PlantAdaptationApp {
    constructor() {
        this.router = null;
        this.gwasModule = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeBootstrap();
            this.initializeModules();
        });
    }

    initializeBootstrap() {
        // Ensure Bootstrap dropdown is properly initialized
        const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
        const dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
            return new bootstrap.Dropdown(dropdownToggleEl);
        });
    }

    initializeModules() {
        // Initialize router
        if (typeof Router !== 'undefined') {
            this.router = new Router();
            window.router = this.router;
        }

        // Initialize GWAS module
        if (typeof GWASModule !== 'undefined') {
            this.gwasModule = new GWASModule();
            window.gwasModule = this.gwasModule;
        }

        console.log('Plant Adaptation Hub initialized successfully');
    }
}

// Initialize the application
new PlantAdaptationApp();