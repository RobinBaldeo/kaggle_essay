document.querySelectorAll('input[name="filter"]').forEach(ele => {
    ele.addEventListener('change', () => {
        applyFilters();
    });
});

document.getElementById('cars').addEventListener('change', () => {
    applyFilters();
});

function applyFilters() {
    const radio = document.querySelector('input[name="filter"]:checked').value;
    const pick = document.getElementById('cars').value;
    filter_data(radio, pick);
}

function filter_data(radio, pick) {
    fetch('sk1.json')
        .then(response => response.json())
        .then(data => {
            // Filter nodes based on the selected filter
            let filter_nodes = data.nodes.filter(node => {
                return node.category[1].includes(parseInt(radio));
            });

            // Generate unique categories for the dropdown
            const uniqueCat = [...new Set(filter_nodes.map(node => node.category[0]))];
            const carsDropdown = document.getElementById('cars');
            // carsDropdown.innerHTML = '';
            const previousPick = carsDropdown.value;


            carsDropdown.innerHTML = ''; // Clear existing options
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.text = "Select a category";
            carsDropdown.add(defaultOption); // Add default option

            uniqueCat.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.text = category;
                carsDropdown.add(option);
            });


            if (previousPick && uniqueCat.includes(previousPick)) {
                carsDropdown.value = previousPick;
            } else {
                carsDropdown.value = uniqueCat.length > 0 ? uniqueCat[0] : '';
            }

            // Further filter nodes based on the selected car category from the dropdown
            if (carsDropdown.value && carsDropdown.value !== "") {
                filter_nodes = filter_nodes.filter(node => node.category[0] === carsDropdown.value && node.category[1].includes(parseInt(radio)));
            }



            // Filter nodes again based on the selected car category from the dropdown
            if (pick && pick !== "") {
                filter_nodes = filter_nodes.filter(node => node.category[0] === pick && node.category[1].includes(parseInt(radio)));
            }

            // Get IDs of the filtered nodes
            let nodeIds = new Set(filter_nodes.map(node => node.id));

            // Filter links that connect the filtered nodes
            let filter_links = data.links.filter(link => {
                // todo
                return nodeIds.has(link.target) && parseInt(radio) === link.value[1];
            });
            console.log(filter_links)

            let linkedNodeIds = new Set();
            filter_links.forEach(link => {
                linkedNodeIds.add(link.source);
                linkedNodeIds.add(link.target);
            });

            // Update filtered nodes to include only those that are in the filtered links
            filter_nodes = data.nodes.filter(node => linkedNodeIds.has(node.id));
            updateChart(filter_nodes, filter_links);
        })
        .catch(error => console.error('Error fetching the JSON data:', error));
}



function transformLinks(links) {
    return links.map(link => {
        return {
            source: link.source,
            target: link.target,
            value: link.value[0] // Set value to the first value of the array
        };
    });
}

function updateChart(nodes, links_) {
    const width = 1000;
    const height = 800;

    let links = transformLinks(links_)


    const svg = d3.select('#sankey')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;')
        .html('');

    const sankey = d3.sankey()
        .nodeId(d => d.id)
        .nodeAlign(d3.sankeyRight)
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 5]]);

    const { nodes: graphNodes, links: graphLinks } = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    console.log('Graph Nodes:', graphNodes);
    console.log('Graph Links:', graphLinks);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const node = svg.append('g')
        .selectAll('rect')
        .data(graphNodes)
        .join('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('fill', d => color(d.category[0]));

    node.append('title')
        .text(d => `${d.id}\n${d.value}`);

    const link = svg.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-opacity', 0.2)
        .selectAll('path')
        .data(graphLinks)
        .join('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke-width', d => Math.max(1, d.width));

    link.append('title')
        .text(d => `${d.source.id} → ${d.target.id}\n${d.value}`);
}

// Initial load
applyFilters();
