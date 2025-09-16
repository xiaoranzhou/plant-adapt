# Plant Adaptation Hub

A comprehensive web-based platform for plant genomic analysis and adaptation studies, featuring PLINK2 WebAssembly integration for GWAS analysis.

## 🏗️ Repository Structure

```
plant-adapt/
├── assets/                          # Organized assets directory
│   ├── css/                         # Stylesheets
│   │   ├── main.css                 # Main application styles
│   │   └── gwas.css                 # GWAS-specific styles
│   ├── js/                          # JavaScript modules
│   │   ├── app.js                   # Main application initialization
│   │   ├── router.js                # SPA routing with hashchange events
│   │   ├── gwas.js                  # GWAS/PLINK interface module
│   │   └── plink2.interface.worker.js # PLINK2 WebAssembly worker
│   └── images/                      # Image assets (future use)
│
├── src/                             # Source components
│   ├── components/                  # Reusable HTML components
│   │   ├── header.html              # Navigation header
│   │   ├── sidebar.html             # Sidebar navigation
│   │   └── gwas-interface.html      # GWAS interface component
│   └── modules/                     # Future module extensions
│
├── css/                             # External CSS libraries
│   └── bootstrap.min.css            # Bootstrap framework
│
├── js/                              # External JavaScript libraries
│   └── bootstrap.bundle.min.js     # Bootstrap JavaScript
│
├── public/                          # Public assets
│   └── plotly.min.js               # Plotly visualization library
│
├── *.js                            # PLINK2 WebAssembly files
├── index.html                      # Main application entry point
├── index-old.html                  # Previous version (backup)
└── README.md                       # This documentation
```

## ✨ Features

### 🧬 Core Functionality
- **PLINK2 WebAssembly Integration**: Run genomic analyses directly in the browser
- **GWAS Analysis**: Genome-wide association studies with data cleaning and visualization
- **Manhattan Plot Visualization**: Interactive plots using Plotly.js
- **File Upload & Management**: Support for multiple genomic file formats

### 🎯 Navigation & UX
- **Single Page Application (SPA)**: Smooth navigation without page reloads
- **Hash-based Routing**: Bookmarkable URLs with browser history support
- **Bootstrap Nav-Pills**: Professional sidebar navigation with dropdown menus
- **Responsive Design**: Mobile-friendly interface using Bootstrap 5

### 📊 Analysis Modules
- **Home Dashboard**: Overview and quick access to features
- **Data Dashboard**: Dataset management and visualization
- **Genomic Analysis**: 
  - GWAS analysis with PLINK2 integration
  - General genomic analysis tools
- **Genome Observation**: Genomic structure visualization
- **Genome Browse**: Interactive genome browser

## 🚀 Quick Start

### Prerequisites
- Modern web browser with WebAssembly support
- Local web server (for development)

### Running the Application

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd plant-adapt
   ```

2. **Start a local server**:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8000`

## 🏛️ Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────┐
│                Index.html               │
├─────────────────────────────────────────┤
│  Bootstrap CSS + Custom Styles         │
│  ├── assets/css/main.css               │
│  └── assets/css/gwas.css               │
├─────────────────────────────────────────┤
│  JavaScript Modules                    │
│  ├── assets/js/app.js (Entry point)    │
│  ├── assets/js/router.js (Navigation)  │
│  └── assets/js/gwas.js (GWAS logic)    │
├─────────────────────────────────────────┤
│  External Libraries                    │
│  ├── Bootstrap 5 (UI Framework)        │
│  ├── Plotly.js (Visualization)         │
│  └── PLINK2.js (WebAssembly)           │
└─────────────────────────────────────────┘
```

### Module System
- **Router Module**: Handles URL routing and navigation state
- **GWAS Module**: Manages PLINK2 integration and analysis workflows
- **App Module**: Initializes all components and Bootstrap functionality

## 🎨 Styling Architecture

### CSS Organization
- **main.css**: Core application styles (sidebar, navbar, layout)
- **gwas.css**: GWAS-specific components (file upload, output tabs, plots)
- **Bootstrap**: Base UI framework for responsive design

### Design Principles
- Mobile-first responsive design
- Consistent color scheme and typography
- Accessible navigation with ARIA attributes
- Professional scientific application aesthetic

## 🧭 Routing System

### Hash-based Navigation
The application uses hash-based routing for SPA functionality:

```javascript
// Available routes
#home              → Home dashboard
#dashboard         → Data management
#gwas              → PLINK2 GWAS analysis
#analysis-general  → General genomic analysis
#observation       → Genome visualization
#browse            → Genome browser
```

### Features
- **Browser History**: Back/forward button support
- **Bookmarkable URLs**: Direct navigation to specific sections
- **Action Logging**: All navigation documented in console
- **Dynamic Titles**: Page titles update based on active section

## 📁 File Organization

### CSS Files
- **Modular approach**: Separate files for different concerns
- **Maintainable**: Easy to locate and modify specific styles
- **Scalable**: Simple to add new component stylesheets

### JavaScript Modules
- **Separation of concerns**: Each module handles specific functionality
- **Class-based architecture**: Modern ES6+ patterns
- **Global compatibility**: Maintains backward compatibility for existing code

### Component Structure
- **Reusable components**: HTML templates for common elements
- **Future-ready**: Prepared for component-based frameworks
- **Easy maintenance**: Centralized component definitions

## 🔧 Development

### Adding New Features

1. **New CSS styles**: Add to appropriate file in `assets/css/`
2. **New JavaScript functionality**: Create module in `assets/js/`
3. **New components**: Add HTML templates to `src/components/`
4. **New routes**: Update router configuration in `router.js`

### Code Style
- Use modern ES6+ JavaScript features
- Follow Bootstrap conventions for styling
- Maintain consistent indentation and formatting
- Document complex functionality with comments

## 🧪 Testing

### Manual Testing Checklist
- [ ] Navigation between all sections works correctly
- [ ] Dropdown menus function properly
- [ ] File upload interface responds correctly
- [ ] Browser back/forward buttons work
- [ ] Mobile responsive design displays correctly
- [ ] All external scripts load successfully

## 🚦 Browser Support

### Minimum Requirements
- **Chrome/Edge**: Version 57+ (WebAssembly support)
- **Firefox**: Version 52+ (WebAssembly support)
- **Safari**: Version 11+ (WebAssembly support)

### Recommended
- Latest versions of modern browsers for optimal performance

## 📊 Performance Considerations

### Optimization Features
- **Modular loading**: JavaScript modules loaded as needed
- **Efficient CSS**: Minimal custom styles leveraging Bootstrap
- **WebAssembly**: High-performance genomic computations
- **Responsive images**: Optimized for different screen sizes

## 🔮 Future Enhancements

### Planned Features
- [ ] Additional genomic analysis tools
- [ ] Real-time collaboration features
- [ ] Advanced visualization options
- [ ] Database integration for dataset management
- [ ] User authentication and project management

### Technical Improvements
- [ ] Service Worker for offline functionality
- [ ] Progressive Web App (PWA) features
- [ ] Automated testing suite
- [ ] Continuous integration/deployment

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes following the code style guidelines
4. Test thoroughly across different browsers
5. Submit a pull request with detailed description

### Guidelines
- Follow existing code patterns and structure
- Update documentation for new features
- Ensure responsive design compatibility
- Test WebAssembly functionality thoroughly

## 📄 License

[Add your license information here]

## 🙋 Support

For questions, issues, or feature requests, please [create an issue](https://github.com/your-repo/issues) in the GitHub repository.

---

*Plant Adaptation Hub - Advancing plant genomics through modern web technologies* 🌱