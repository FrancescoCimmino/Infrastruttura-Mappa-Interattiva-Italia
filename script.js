document.addEventListener("DOMContentLoaded", function () {
    const map = document.getElementById("italy-map");
    const infoBox = document.getElementById("info-box");

    // Carica l'SVG direttamente nel DOM invece di usare object
    fetch("assets/italia.svg")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Errore nel caricamento dell'SVG: ${response.status}`);
            }
            return response.text();
        })
        .then(svgContent => {
            console.log("SVG caricato con successo");
            
            // Inserisci l'SVG direttamente nel container
            const container = document.getElementById("map-container");
            container.innerHTML = svgContent;
            
            // Ora possiamo manipolare l'SVG direttamente nel DOM
            const svg = container.querySelector("svg");
            if (!svg) {
                throw new Error("Elemento SVG non trovato nel contenuto");
            }
            
            // Assicurati che l'SVG riempia il container
            svg.setAttribute("width", "100%");
            
            // Inserisci gli stili direttamente nell'SVG
            const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
            styleElement.textContent = `
                .region:hover {
                    fill: #6ce65a !important;
                    stroke-width: 1.5px;
                    transform: translateY(-10px);
                    transition: transform 0.3s ease-in-out;
                }
                
                .region.selected {
                    fill: #41974e !important;
                    stroke: #222;
                    stroke-width: 3px;
                }
                
                .region.animating {
                    animation: gentlePulse 0.3s ease-in-out;
                }                
                
                @keyframes gentlePulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                    100% { transform: scale(1); }
                }
            `;
            svg.appendChild(styleElement);
            
            // Seleziona le regioni (paths o altri elementi nell'SVG)
            const regions = svg.querySelectorAll("path");
            console.log(`Trovate ${regions.length} regioni nell'SVG`);
            
            if (regions.length === 0) {
                // Prova con un selettore più ampio se non trova path
                const alternativeRegions = svg.querySelectorAll("path, polygon, rect, g > *");
                console.log(`Trovate ${alternativeRegions.length} regioni con selettore alternativo`);
                
                // Se ci sono elementi con il selettore alternativo, usali
                if (alternativeRegions.length > 0) {
                    setupRegionInteractions(alternativeRegions);
                } else {
                    console.error("ERRORE: Nessuna regione trovata nell'SVG!");
                }
            } else {
                setupRegionInteractions(regions);
            }
        })
        .catch(error => {
            console.error(`ERRORE: ${error.message}`);
        });
    
    // Configura le interazioni per le regioni
    function setupRegionInteractions(regions) {
        regions.forEach((region, index) => {
            // Assicurati che ogni regione abbia un ID
            if (!region.id) {
                region.id = `region-${index + 1}`;
            }
            
            // Imposta il colore di base prima di aggiungere la classe
            region.setAttribute("fill", "#41974e");
            region.setAttribute("stroke", "#ffffff");
            region.setAttribute("stroke-width", "1");
            
            // Aggiungi la classe per lo stile di base
            region.classList.add("region");
            
            // Gestisci hover
            region.addEventListener("mouseover", function() {
                const regionName = this.getAttribute("name") || this.querySelector("title")?.textContent || this.getAttribute("id") || "Regione";
                infoBox.textContent = regionName;
                this.setAttribute("fill", "#6ce65a");
            });
            
            region.addEventListener("mouseout", function() {
                infoBox.textContent = "Seleziona una regione";
                if (!this.classList.contains("selected")) {
                    this.setAttribute("fill", "#41974e");
                }
            });
            
            // Gestisci click
            region.addEventListener("click", function(e) {
                const regionName = this.getAttribute("name") || this.querySelector("title")?.textContent || this.getAttribute("id") || "Regione";
                console.log(`Click su: ${regionName}`);
                
                // Toggle della classe selected
                if (this.classList.contains("selected")) {
                    this.classList.remove("selected");
                    this.setAttribute("fill", "#41974e");
                } else {
                    this.classList.add("selected");
                    this.setAttribute("fill", "#41974e");
                }
                
                // Aggiungi temporaneamente la classe per l'animazione
                this.classList.add("animating");
                
                // Rimuovi la classe di animazione dopo che è completa
                setTimeout(() => {
                    this.classList.remove("animating");
                }, 300);
                
                // Riordina le regioni per avere quelle selezionate sopra
                reorderRegions();
            });
        });
    }
    
    // Funzione per riordinare le regioni
    function reorderRegions() {
        console.log("Riordino le regioni selezionate...");
        
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
        
        // Prima le regioni non selezionate
        Array.from(regions)
            .filter(r => !r.classList.contains("selected"))
            .forEach(region => parent.appendChild(region));
        
        // Poi le regioni selezionate in modo che appaiano sopra
        Array.from(regions)
            .filter(r => r.classList.contains("selected"))
            .forEach(region => parent.appendChild(region));
        
        console.log("Regioni riordinate completate");
    }
});