document.addEventListener("DOMContentLoaded", function () {
    const map = document.getElementById("italy-map");
    const infoBox = document.getElementById("info-box");

    // The fetch() method starts the process of fetching a resource from a server
    // upload the SVG file
    fetch("assets/italia.svg")
        .then(response => {
            if (!response.ok) {
    // The throw statement allows you to create a custom error
                throw new Error(`Error during SVG File fetching: ${response.status}`);
            }
            return response.text();
        })
        .then(svgContent => {
    //        console.log("SVG uploaded correctly");
            
            // insert SVG in the container (containers are elements that contain other elements)
            const container = document.getElementById("map-container");
            // in the SVG file there is a ID tag and a Name (of the Region) tag, better use the second one to be visualised
            
            container.innerHTML = svgContent;
            const svg = container.querySelector("svg");
            // the querySelector() method returns the first element that matches a specified CSS selector(s) in the document
            if (!svg) {
                throw new Error(`SVG not found in the container with ID: ${container.id}`);
            }
            
            svg.setAttribute("width", "100%");
            
            // Styles importing
            const styleElement = document.createElement("style");
            styleElement.textContent = 
            `
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
            // test scale HERE    

                @keyframes gentlePulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                    100% { transform: scale(1); }
                }
            `;
            svg.appendChild(styleElement);
            
            // Select the regions
            // Path is a SVG element that is used to draw lines, shapes or outlines (the region borders)
            const regions = svg.querySelectorAll("path");
            console.log(`Trovate ${regions.length} regioni nell'SVG`);
            // setup the interactions for the regions (regions are from a reliable source, no need to check for null)
            setupRegionInteractions(regions);
            }
        )
    
    // configuration of the interactions for the regions
    function setupRegionInteractions(regions) {
        regions.forEach((region, index) => {
            // Assicurati che ogni regione abbia un ID
            if (!region.id) {
                region.id = `region-${index + 1}`;
            }
            // color settings
            region.setAttribute("fill", "#41974e");
            region.setAttribute("stroke", "#ffffff");
            region.setAttribute("stroke-width", "1");
            // adding class to the region in order to style it
            region.classList.add("region");
            
            // Hover effect setup, "mouseover" and "mouseout" are events that are triggered when the mouse is over or out of an element
            region.addEventListener("mouseover", function() {
            // || means "or", if the first condition is false, the second one is checked
                const regionName = this.getAttribute("name") 
            // || this.querySelector("title")?.textContent || this.getAttribute("id") || "Regione";     (not sure is necessary due to reliable mapping)
                infoBox.textContent = regionName;
            // fill "hovered" with a color
                this.setAttribute("fill", "#6ce65a");
            });
            
            region.addEventListener("mouseout", function() {
                infoBox.textContent = "Seleziona una regione";
                if (!this.classList.contains("selected")) {
                    this.setAttribute("fill", "#41974e");
                }
            });
            
            // Selection effect setup, "click" is an event that is triggered when the mouse is clicked on an element
            region.addEventListener("click", function(e) {
                const regionName = this.getAttribute("name")
            // || this.querySelector("title")?.textContent || this.getAttribute("id") || "Regione";

                // Toggle selected class
                if (this.classList.contains("selected")) {
                    this.classList.remove("selected");
                    this.setAttribute("fill", "#41974e");
                } else {
                    this.classList.add("selected");
                    this.setAttribute("fill", "#41974e");
                }
                
                // temporarily add a class to animate the selection
                this.classList.add("animating");
                
                // remove animating class after a short delay (in millisecnods)
                setTimeout(() => {
                    this.classList.remove("animating");
                }, 300);
            });
        });
        }
    });
