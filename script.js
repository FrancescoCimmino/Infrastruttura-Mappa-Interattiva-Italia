document.addEventListener("DOMContentLoaded", function () {
    let projectsData = [];
    const selectedRegions = new Set();

    function loadProjectsData() {
        fetch("test1.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error loading projects data: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                projectsData = data;
                console.log("Projects data loaded successfully", projectsData);
            })
            .catch(error => {
                console.error("Failed to load projects data:", error);
                document.getElementById("projects-list").innerHTML = 
                    "<li>Errore nel caricamento dei dati dei progetti</li>";
            });
    }

    function displayProjectsForSelectedRegions() {
        const projectsList = document.getElementById("projects-list");
        projectsList.innerHTML = ""; // Clear the list first

        if (selectedRegions.size === 0) {
            projectsList.innerHTML = "<li>Seleziona almeno una regione per visualizzare i progetti</li>";
            return;
        }

        const projectsByRegion = {};

        selectedRegions.forEach(region => {
            const regionProjects = projectsData.filter(project => project.Regione === region);
            if (regionProjects.length > 0) {
                projectsByRegion[region] = regionProjects;
            }
        });

        if (Object.keys(projectsByRegion).length === 0) {
            projectsList.innerHTML = "<li>Nessun progetto trovato per le regioni selezionate</li>";
            return;
        }

        Object.keys(projectsByRegion).sort().forEach(region => {
            const regionHeader = document.createElement("h3");
            regionHeader.textContent = region;
            projectsList.appendChild(regionHeader);

            const regionList = document.createElement("ul");
            projectsByRegion[region].forEach(project => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${project.Progetto}</strong>: €${project.Importo}`;
                regionList.appendChild(li);
            });

            projectsList.appendChild(regionList);
        });
    }

    function setupRegionInteractions(regions) {
        regions.forEach((region, index) => {
            if (!region.id) {
                region.id = `region-${index + 1}`;
            }

            // Try to get the region name from title element, data-name attribute, or id
            const title = region.querySelector("title");
            const regionName = region.getAttribute("data-name") || 
                              (title ? title.textContent : null) || 
                              region.id || "Regione";
            
            // Set data-name attribute if not present
            if (!region.getAttribute("data-name")) {
                region.setAttribute("data-name", regionName);
            }

            region.setAttribute("fill", "#7cb4e3");
            region.setAttribute("stroke", "#ffffff");
            region.setAttribute("stroke-width", "1");
            region.classList.add("region");

            region.addEventListener("mouseover", function() {
                this.setAttribute("fill", "#1e62d0");
            });

            region.addEventListener("mouseout", function() {
                if (!this.classList.contains("selected")) {
                    this.setAttribute("fill", "#7cb4e3");
                }
            });

            region.addEventListener("click", function(e) {
                const regionName = this.getAttribute("data-name") || 
                                 (this.querySelector("title") ? this.querySelector("title").textContent : null) || 
                                 this.id || "Regione";
                console.log(`Click su: ${regionName}`);

                if (this.classList.contains("selected")) {
                    this.classList.remove("selected");
                    this.setAttribute("fill", "#7cb4e3");
                    selectedRegions.delete(regionName);
                } else {
                    this.classList.add("selected");
                    this.setAttribute("fill", "#ff3333");
                    selectedRegions.add(regionName);
                }

                this.classList.add("animating");
                setTimeout(() => {
                    this.classList.remove("animating");
                }, 300);

                reorderRegions();
                displayProjectsForSelectedRegions();
            });
        });
    }

    function reorderRegions() {
        const svg = document.querySelector("#italy-map-svg");
        if (!svg) {
            console.error("ERRORE: SVG non trovato per il riordinamento");
            return;
        }

        const regions = svg.querySelectorAll(".region");
        const parent = regions[0]?.parentNode;

        if (!parent) {
            console.error("ERRORE: Parent node non trovato");
            return;
        }

        Array.from(regions)
            .filter(r => !r.classList.contains("selected"))
            .forEach(region => parent.appendChild(region));

        Array.from(regions)
            .filter(r => r.classList.contains("selected"))
            .forEach(region => parent.appendChild(region));
    }

    loadProjectsData();

    // Load the SVG map
    fetch("assets/italia.svg")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error during SVG File fetching: ${response.status}`);
            }
            return response.text();
        })
        .then(svgContent => {
            const container = document.getElementById("map-container");
            container.innerHTML = svgContent;
            const svg = container.querySelector("svg");
            if (!svg) {
                throw new Error(`SVG not found in the container with ID: ${container.id}`);
            }

            svg.setAttribute("width", "100%");
            svg.id = "italy-map-svg";

            const styleElement = document.createElement("style");
            styleElement.textContent = `
                .region {
                    transition: fill 0.2s ease-in-out, stroke-width 0.2s ease-in-out;
                }
                
                .region:hover {
                    fill:rgba(0, 123, 255, 0.5) !important;
                    stroke-width: 1.5px;
                    cursor: pointer;
                }

                .region.selected {
                    fill:rgb(0, 123, 255) !important;
                    stroke: #222;
                    stroke-width: 2px;
                }

                .region.animating {
                    animation: gentlePulse 0.3s ease-in-out;
                }

                @keyframes gentlePulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                    100% { transform: scale(1); }
                }
            `;
            svg.appendChild(styleElement);

            const regions = svg.querySelectorAll("path");
            console.log(`Trovate ${regions.length} regioni nell'SVG`);
            setupRegionInteractions(regions);
        })
        .catch(error => {
            console.error(`ERRORE: ${error.message}`);
            document.getElementById("map-container").innerHTML = 
                `<div style="color: red; padding: 20px;">
                    Errore nel caricamento della mappa: ${error.message}
                </div>`;
        });
});
