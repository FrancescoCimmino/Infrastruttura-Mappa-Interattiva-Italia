document.addEventListener("DOMContentLoaded", function () {

    // ─── Stato globale ────────────────────────────────────────────────
    let projectsData = [];
    const selectedRegions = new Set();

    // Mappa toggle → valore esatto del campo "Linea_di_Finanziamento" nel JSON
    const FILTER_MAP = {
        "toggle-PE":  "Partenariati Estesi",
        "toggle-CN":  "Centri Nazionali",
        "toggle-ECS": "Ecosistemi d'Innovazione",
    };

    // Restituisce l'insieme delle linee di finanziamento attualmente attivate.
    // Se nessun toggle è attivo → nessun filtro applicato (si mostra tutto).
    function getActiveFilters() {
        const active = Object.entries(FILTER_MAP)
            .filter(([id]) => document.getElementById(id)?.checked)
            .map(([, label]) => label);
        return active; // array vuoto = nessun filtro
    }

    // ─── Caricamento dati JSON ────────────────────────────────────────
    function loadProjectsData() {
        fetch("Partenariali.json")
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                projectsData = data;
            })
            .catch(() => {
                document.getElementById("projects-list").innerHTML =
                    "<li>Errore nel caricamento dei dati dei progetti.</li>";
            });
    }

    // ─── Rendering lista progetti ─────────────────────────────────────
    function displayProjectsForSelectedRegions() {
        const projectsList = document.getElementById("projects-list");
        projectsList.innerHTML = "";

        if (selectedRegions.size === 0) {
            projectsList.innerHTML =
                "<li>Seleziona almeno una regione per visualizzare i progetti.</li>";
            return;
        }

        const activeFilters = getActiveFilters();

        // Raggruppa per regione, applicando il filtro sulle linee se attivo
        const projectsByRegion = {};
        selectedRegions.forEach(region => {
            let regionProjects = projectsData.filter(p => p.Regione === region);

            // Applica filtro solo se almeno un toggle è attivo
            if (activeFilters.length > 0) {
                regionProjects = regionProjects.filter(p =>
                    activeFilters.includes(p.Linea_di_Finanziamento)
                );
            }

            if (regionProjects.length > 0) {
                projectsByRegion[region] = regionProjects;
            }
        });

        if (Object.keys(projectsByRegion).length === 0) {
            projectsList.innerHTML =
                "<li>Nessun progetto trovato per i filtri selezionati.</li>";
            return;
        }

        Object.keys(projectsByRegion).sort().forEach(region => {
            // Intestazione regione
            const regionHeader = document.createElement("h3");
            regionHeader.textContent = region;
            projectsList.appendChild(regionHeader);

            // Lista progetti della regione
            const regionList = document.createElement("ul");
            projectsByRegion[region].forEach(project => {
                const li = document.createElement("li");
                // Badge colorato per la linea di finanziamento
                const badge = `<span class="line-badge line-badge--${getBadgeClass(project.Linea_di_Finanziamento)}">${project.Linea_di_Finanziamento}</span>`;
                li.innerHTML =
                    `${badge} <strong>${project.Progetto}</strong>: ${project.Nome_Progetto} — Agevolazione: <strong>${project.Agevolazione}</strong>`;
                regionList.appendChild(li);
            });

            projectsList.appendChild(regionList);
        });
    }

    // Converte la linea di finanziamento in una classe CSS sicura
    function getBadgeClass(linea) {
        if (linea.includes("Partenariati")) return "pe";
        if (linea.includes("Centri"))       return "cn";
        if (linea.includes("Ecosistemi"))   return "ecs";
        return "other";
    }

    // ─── Interazioni con le regioni SVG ──────────────────────────────
    function getRegionName(el) {
        const title = el.querySelector("title");
        return el.getAttribute("data-name") ||
               (title ? title.textContent.trim() : null) ||
               el.id ||
               "Regione";
    }

    function setupRegionInteractions(regions) {
        regions.forEach((region, index) => {
            if (!region.id) region.id = `region-${index + 1}`;

            const regionName = getRegionName(region);
            if (!region.getAttribute("data-name")) {
                region.setAttribute("data-name", regionName);
            }

            region.setAttribute("fill", "#7cb4e3");
            region.setAttribute("stroke", "#ffffff");
            region.setAttribute("stroke-width", "1");
            region.classList.add("region");

            region.addEventListener("mouseover", function () {
                if (!this.classList.contains("selected")) {
                    this.setAttribute("fill", "#1e62d0");
                }
            });

            region.addEventListener("mouseout", function () {
                if (!this.classList.contains("selected")) {
                    this.setAttribute("fill", "#7cb4e3");
                }
            });

            region.addEventListener("click", function () {
                const name = getRegionName(this);

                if (this.classList.contains("selected")) {
                    this.classList.remove("selected");
                    this.setAttribute("fill", "#7cb4e3");
                    selectedRegions.delete(name);
                } else {
                    this.classList.add("selected");
                    this.setAttribute("fill", "#ff3333");
                    selectedRegions.add(name);
                }

                this.classList.add("animating");
                setTimeout(() => this.classList.remove("animating"), 300);

                reorderRegions();
                displayProjectsForSelectedRegions();
            });
        });
    }

    function reorderRegions() {
        const svg = document.querySelector("#italy-map-svg");
        if (!svg) return;

        const regions = Array.from(svg.querySelectorAll(".region"));
        const parent = regions[0]?.parentNode;
        if (!parent) return;

        // Non-selected prima, selected dopo (z-order corretto)
        regions.filter(r => !r.classList.contains("selected"))
               .forEach(r => parent.appendChild(r));
        regions.filter(r =>  r.classList.contains("selected"))
               .forEach(r => parent.appendChild(r));
    }

    // ─── Seleziona / Deseleziona tutto ───────────────────────────────
    function selectAllRegions() {
        document.querySelectorAll(".region").forEach(region => {
            if (!region.classList.contains("selected")) {
                region.classList.add("selected");
                region.setAttribute("fill", "#ff3333");
                selectedRegions.add(getRegionName(region));
            }
        });
        reorderRegions();
        displayProjectsForSelectedRegions();
    }

    function deselectAllRegions() {
        document.querySelectorAll(".region").forEach(region => {
            region.classList.remove("selected");
            region.setAttribute("fill", "#7cb4e3");
        });
        selectedRegions.clear();
        displayProjectsForSelectedRegions();
    }

    // ─── Event listeners ─────────────────────────────────────────────
    document.getElementById("select-all-btn")
            .addEventListener("click", selectAllRegions);
    document.getElementById("deselect-all-btn")
            .addEventListener("click", deselectAllRegions);

    // Toggle misure → aggiorna la lista senza toccare la selezione delle regioni
    Object.keys(FILTER_MAP).forEach(id => {
        document.getElementById(id)
                ?.addEventListener("change", displayProjectsForSelectedRegions);
    });

    // ─── Caricamento SVG ─────────────────────────────────────────────
    loadProjectsData();

    fetch("assets/italia.svg")
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(svgContent => {
            const container = document.getElementById("map-container");
            container.innerHTML = svgContent;

            const svg = container.querySelector("svg");
            if (!svg) throw new Error("SVG non trovato nel container.");

            svg.setAttribute("width", "100%");
            svg.id = "italy-map-svg";

            // Stili iniettati nell'SVG per compatibilità cross-browser
            const styleElement = document.createElement("style");
            styleElement.textContent = `
                .region {
                    transition: fill 0.2s ease-in-out, stroke-width 0.2s ease-in-out;
                    cursor: pointer;
                }
                .region:hover {
                    stroke-width: 2px;
                }
                .region.selected {
                    stroke: #222;
                    stroke-width: 2px;
                }
                .region.animating {
                    animation: gentlePulse 0.3s ease-in-out;
                }
                @keyframes gentlePulse {
                    0%   { transform: scale(1); }
                    50%  { transform: scale(1.03); }
                    100% { transform: scale(1); }
                }
            `;
            svg.appendChild(styleElement);

            const regions = svg.querySelectorAll("path");
            console.log(`Trovate ${regions.length} regioni nell'SVG.`);
            setupRegionInteractions(regions);
        })
        .catch(error => {
            console.error(error);
            document.getElementById("map-container").innerHTML =
                `<div style="color:red;padding:20px;">
                    Errore nel caricamento della mappa: ${error.message}
                 </div>`;
        });

});
