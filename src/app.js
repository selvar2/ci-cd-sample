/**
 * Application initialization script
 * This script configures branch-specific content
 */

// Configuration for each branch
const branchConfig = {
    'main': {
        title: 'Hello World',
        environment: 'Production',
        color: '#667eea',
        message: 'You are on the production branch'
    },
    'test': {
        title: 'Hello Test',
        environment: 'Testing',
        color: '#f6a623',
        message: 'You are on the testing branch'
    },
    'dev': {
        title: 'Hello Developer',
        environment: 'Development',
        color: '#7ed321',
        message: 'You are on the development branch'
    },
    'branch-1': {
        title: 'Hello City',
        environment: 'Feature (branch-1)',
        color: '#50e3c2',
        message: 'You are on feature branch-1'
    },
    'branch-2': {
        title: 'Hello User',
        environment: 'Feature (branch-2)',
        color: '#b8e986',
        message: 'You are on feature branch-2'
    }
};

// Default fallback configuration
const defaultConfig = {
    title: 'Hello Branch',
    environment: 'Feature Branch',
    color: '#9013fe',
    message: 'You are on a feature branch'
};

/**
 * Initialize the application with branch-specific configuration
 */
function initializeApp() {
    // Get the current branch from meta tag (populated by CI/CD pipeline)
    const branchMeta = document.querySelector('meta[name="branch"]');
    const currentBranch = branchMeta ? branchMeta.getAttribute('content') : 'main';
    
    // Get configuration for current branch or use default
    const config = branchConfig[currentBranch] || defaultConfig;
    
    // Update page title and header
    const appTitle = document.getElementById('app-title');
    const branchInfo = document.getElementById('branch-info');
    const environment = document.getElementById('environment');
    const timestamp = document.getElementById('timestamp');
    
    if (appTitle) appTitle.textContent = config.title;
    if (branchInfo) branchInfo.textContent = `Branch: ${currentBranch}`;
    if (environment) environment.textContent = config.environment;
    if (timestamp) timestamp.textContent = new Date().toLocaleString();
    
    // Update color scheme (optional)
    updateColorScheme(config.color);
    
    // Log to console for debugging
    console.log(`✓ Application initialized`);
    console.log(`  Branch: ${currentBranch}`);
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Message: ${config.message}`);
}

/**
 * Update the color scheme based on branch
 */
function updateColorScheme(color) {
    const root = document.documentElement;
    // This can be extended to update CSS variables
    // For now, we keep the default color scheme
}

/**
 * Validate application state
 */
function validateApp() {
    const requiredElements = [
        'app-title',
        'branch-info',
        'environment'
    ];
    
    let allValid = true;
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠ Missing element with id: ${id}`);
            allValid = false;
        }
    });
    
    if (allValid) {
        console.log('✓ All required elements present');
    }
    
    return allValid;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        validateApp();
    });
} else {
    initializeApp();
    validateApp();
}
