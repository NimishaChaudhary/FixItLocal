const geoServerUrl = "https://0b88-2401-4900-57e6-8623-1c77-e66d-a78f-d0b2.ngrok-free.app/geoserver/ne/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:repair_services&outputFormat=application/json";

let map;
let userLocation;
let repairerMarkers = [];
let repairerData = [];
let selectedTravelMode = "DRIVING"; // Default to driving mode
let repairerTypes = [];
let marker;
let highlightermarker;
let directionsService;
let directionsRenderer;

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 18.457357019318437, lng: 73.85271538035958 },
        zoom: 12,
        styles: []  // Default map style (roads should be visible)
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "Your Location",
                    icon: {
                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Icon for user's location
                        scaledSize: new google.maps.Size(40, 40),
                    },
                });
                fetchWardsAndTypes();
            },
            () => alert("Geolocation not enabled. Showing default location.")
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        fetchWardsAndTypes();
    }

    // Initialize Materialize dropdowns and other components
    M.AutoInit();  // Make sure all Materialize components are initialized
}
const proxyUrl = 'https://nimishachaudhary.github.io';
const apiUrl = 'https://0b88-2401-4900-57e6-8623-1c77-e66d-a78f-d0b2.ngrok-free.app/geoserver/ne/wfs';

function fetchWardsAndTypes() {
    fetch('${proxyUrl}${apiUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:repair_services&outputFormat=application/json',{
        headers: {
            "ngrok-skip-browser-warning": "true"
          },
        method: 'GET',
        mode: 'no-cors',
      })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("GeoServer Data:", data); // Debugging: Log the fetched data
            const wards = new Set();
            const types = new Set();

            data.features.forEach((feature) => {
                const properties = feature.properties;
                wards.add(properties.ward_name);
                types.add(properties.type_of_repairer);
            });

            updateWardDropdown([...wards]);
            repairerTypes = types;
            repairerData = data.features.map((feature) => ({
                ...feature.properties,
                Latitude: feature.geometry.coordinates[1],
                Longitude: feature.geometry.coordinates[0],
            }));
        })
        .catch((error) => console.error("Error fetching GeoServer data:", error));
}

function updateWardDropdown(wards) {
    const wardSelect = document.getElementById("ward");
    wardSelect.innerHTML = '<option value="">--Select Ward--</option>';
    
    wards.forEach((ward) => {
        const option = document.createElement("option");
        option.value = ward;
        option.textContent = ward;
        wardSelect.appendChild(option);
    });

    // Reinitialize Materialize dropdown
    M.FormSelect.init(wardSelect);
}

// Function to update the "Repairer Type" dropdown options
function updateRepairerTypeDropdown() {
    const repairerTypeSelect = document.getElementById("repairer-type");
    repairerTypeSelect.innerHTML = '<option value="">--Select Repairer Type--</option>';

    repairerTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        repairerTypeSelect.appendChild(option);
    });

    // Initialize Materialize dropdown
    M.FormSelect.init(repairerTypeSelect);
}

function updateTravelMode() {
    const modeSelect = document.getElementById("travel-mode");
    selectedTravelMode = modeSelect.value; // Update travel mode dynamically
}

function fetchRepairers() {
    const ward = document.getElementById("ward").value;
    const repairerType = document.getElementById("repairer-type").value;

    if (!ward || !repairerType) return;

    const filteredData = repairerData.filter(
        (item) => item.ward_name === ward && item.type_of_repairer === repairerType
    );

    displayRepairers(filteredData, userLocation);
}

function displayRepairers(repairers, userLocation) {
    repairerMarkers.forEach((marker) => marker.setMap(null));
    repairerMarkers = [];

    const service = new google.maps.DistanceMatrixService();

    repairers.forEach((repairer) => {
        const repairerLocation = {
            lat: parseFloat(repairer.Latitude),
            lng: parseFloat(repairer.Longitude),
        };

        marker = new google.maps.Marker({
            position: repairerLocation,
            map,
            title: repairer.name_of_shop,
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // Icon for repairer location
                scaledSize: new google.maps.Size(40, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(20, 40),
            },
        });

        const infinfoContentoContent = `
            <div><span id="popupclose" style="float: right;cursor: pointer;font-size: 16px; top: 10px; position: absolute;right: 18px;">×</span>
                <strong>${repairer.name_of_shop}</strong><br>
                Type: ${repairer.type_of_repairer}<br>
                Contact: ${repairer.contact_number || "N/A"}<br>
                Services: ${repairer.services_provided || "N/A"}<br>
                Avg Price: ${repairer.average_price || "N/A"}
            </div>
        `;
        
        marker.addListener("click", () => {
            if (highlightermarker) {
                highlightermarker.setMap(null);
            };
                let apiKey = 'AIzaSyCPNe0RKk3YlqvBDpsZ_beIS5mG1Z6Joio';
                let origin = userLocation; // Example: New York (latitude, longitude)
                let destination = repairerLocation; // Example: Brooklyn (latitude, longitude)
                let mode = selectedTravelMode; // Options: driving, walking, transit

                // Initialize the DirectionsService and DirectionsRenderer
                if (directionsRenderer) {
                    directionsRenderer.setMap(null);
                };    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Request the route
    directionsService.route(
        {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode[mode.toUpperCase()] // Options: DRIVING, WALKING, TRANSIT
        },
        (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result); // Render the route on the map
            } else {
                console.error('Directions request failed due to ' + status);
            }
        }
    );
            highlightermarker = new google.maps.Marker({
                position: repairerLocation,
                map,
                animation: google.maps.Animation.DROP,
            });
            service.getDistanceMatrix(
                {
                    origins: [userLocation],
                    destinations: [repairerLocation],
                    travelMode: selectedTravelMode,
                },                
                (response, status) => {
                    if (status === "OK" && response.rows[0].elements[0]) {
                        const element = response.rows[0].elements[0];
                        const distance = element.distance ? element.distance.text : "N/A";
                        const duration = element.duration ? element.duration.text : "N/A";
                        document.getElementById("repairer-info").style.display = 'block';
                        document.getElementById("details").innerHTML = `
                            ${infinfoContentoContent}
                            <br><strong>Distance:</strong> ${distance}
                            <br><strong>Travel Time:</strong> ${duration}
                        `;
                        let repairerclose = document.getElementById("popupclose");       
        repairerclose.onclick = function () {
            document.getElementById("repairer-info").style.display = "none";
        };
                    } else {
                        console.error("Error calculating distance:", status);
                        document.getElementById("repairer-info").style.display = 'block';
                        document.getElementById("details").innerHTML = `
                            ${infinfoContentoContent}
                            <br><strong>Error calculating distance</strong>
                        `;
                    }
                }
            );
        });

        repairerMarkers.push(marker);
    });
}

window.updateRepairerTypes = function () {
    const ward = document.getElementById("ward").value;
    const repairerTypeSelect = document.getElementById("repairer-type");

    if (ward) {
        repairerTypeSelect.disabled = false;
        updateRepairerTypeDropdown();
    } else {
        repairerTypeSelect.disabled = true;
    }
};

// Get the file input and preview container
const fileInput = document.getElementById('repairer-photo');
const thumbnail = document.getElementById('thumbnail');

// Listen for file selection
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0]; // Get the selected file

    if (file) {
        const reader = new FileReader(); // Create a FileReader object

        // When the file is loaded, display the preview
        reader.onload = function (e) {
            thumbnail.src = e.target.result; // Set the image source to the file's data
            thumbnail.style.display = 'block'; // Make the image visible
        };

        reader.readAsDataURL(file); // Read the file as a Data URL
    } else {
        // Hide the image if no file is selected
        thumbnail.style.display = 'none';
    }
});




// Handle the form submission for adding a new repairer
document.getElementById("repairerForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const repairerName = document.getElementById("repairer-name").value;
    const contactNumber = document.getElementById("contact-number").value;
    const contactAddress = document.getElementById("address").value;
    const repairerType = document.getElementById("repairerType").value;
    const servicesProvided = document.getElementById("services-provided").value;
    const averagePrice = document.getElementById("average-price").value;
    const averageTime = document.getElementById("average-time").value;
    const repairerPhoto = document.getElementById("repairer-photo").files[0]; // Get the uploaded photo

    const newRepairerinfo = {
        name_of_shop: repairerName,
        contact_number: contactNumber,
        contact_address: contactAddress,
        type_of_repairer: repairerType,
        services_provided: servicesProvided,
        average_price: averagePrice,
        average_time: averageTime,
        photo: URL.createObjectURL(repairerPhoto), // Convert photo file to a URL
    };

    console.log(newRepairerinfo); // Log the new repairer data for testing


    const infoFormRepairer = `
        Name Of Shop: ${newRepairerinfo.name_of_shop}<br>
        Contact Number: ${newRepairerinfo.contact_number || "N/A"}<br>
          Contact Address: ${newRepairerinfo.contact_address || "N/A"}<br>
        Type Of Repairer: ${newRepairerinfo.type_of_repairer}<br>
        Services Provided: ${newRepairerinfo.services_provided || "N/A"}<br>
        Average Price: ${newRepairerinfo.average_price || "N/A"}<br>
        Average Time: ${newRepairerinfo.average_time || "N/A"}<br>
    `;
    submitToGoogleForm(newRepairerinfo);
    document.getElementById("repairers-details").innerHTML = `
        ${infoFormRepairer}
    `;

    // Add the new repairer marker to the map
    const repairerLocation = {
        lat: userLocation.lat, // Use user's current location for the new repairer
        lng: userLocation.lng,
    };

    // const marker = new google.maps.Marker({
    //     position: repairerLocation,
    //     map,
    //     title: newRepairerinfo.name_of_shop,
    //     icon: {
    //         url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // Icon for repairer location
    //         scaledSize: new google.maps.Size(40, 40),
    //         origin: new google.maps.Point(0, 0),
    //         anchor: new google.maps.Point(20, 40),
    //     },
    // });

    // const infoContent = `
    //     <strong>${newRepairer.name_of_shop}</strong><br>
    //     Type: ${newRepairer.type_of_repairer}<br>
    //     Contact: ${newRepairer.contact_number || "N/A"}<br>
    //     Services: ${newRepairer.services_provided || "N/A"}<br>
    //     Avg Price: ${newRepairer.average_price || "N/A"}<br>
    //     <img src="${newRepairer.photo}" alt="Repairer Photo" style="width:100px;height:auto;">
    // `;

    // const infoWindow = new google.maps.InfoWindow({
    //     content: infoContent,
    // });

    // marker.addListener("click", () => {
    //     infoWindow.open(map, marker);
    // });

    // repairerMarkers.push(marker);
});

function toggleTravelMode() {
    const travelModeSelect = document.getElementById("travel-mode");
    const travelModeLabel = document.querySelector('label[for="travel-mode"]');
    if (travelModeSelect.style.display === "none") {
        travelModeSelect.style.display = "block";
        travelModeLabel.style.display = "block";
    } else {
        travelModeSelect.style.display = "none";
        travelModeLabel.style.display = "none";
    }
}

function repairerFormreset() {
        let wardSelectdata = document.getElementById("ward");
        wardSelectdata.selectedIndex = 0;
        const wardevent = new Event("change");
        wardSelectdata.dispatchEvent(wardevent);
        let repairerTypeSelectdata = document.getElementById("repairer-type");       
        repairerTypeSelectdata.selectedIndex = 0;  
        const repairerTypeevent = new Event("change");
        repairerTypeSelectdata.dispatchEvent(repairerTypeevent);      
        repairerTypeSelectdata.disabled = true; 
        let modeSelectdata = document.getElementById("travel-mode");
        modeSelectdata.selectedIndex = 0;
        const modeevent = new Event("change");
        modeSelectdata.dispatchEvent(modeevent);
    if (highlightermarker) {
        highlightermarker.setMap(null);
    };
    if (directionsRenderer) {
        directionsRenderer.setMap(null);
    };
    if (marker) {
        marker.setMap(null);
    };
    document.getElementById("repairer-info").style.display = "none";
}


function submitToGoogleForm(data) {
    const googleFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSebGWxhB4m1flPLjGztoIcGKwKeYRaCe9pIAqzoltaUq2SxAQ/viewform"; // Replace with the form's POST URL
    //1FAIpQLSebGWxhB4m1flPLjGztoIcGKwKeYRaCe9pIAqzoltaUq2SxAQ ---without photo
    //const googleFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSebGWxhB4m1flPLjGztoIcGKwKeYRaCe9pIAqzoltaUq2SxAQ/formResponse"
    //https://docs.google.com/forms/d/e/1FAIpQLSebGWxhB4m1flPLjGztoIcGKwKeYRaCe9pIAqzoltaUq2SxAQ/viewform?usp=header

    const formData = new URLSearchParams();
    formData.append("entry.1068536531", data.name_of_shop);
    formData.append("entry.645176841", data.contact_number);
    formData.append("entry.602412089", data.contact_address);
    formData.append("entry.428399466", data.type_of_repairer);
    formData.append("entry.96680041", data.services_provided);
    formData.append("entry.1299201773", data.average_price);
    formData.append("entry.1336326086", data.average_time);
    //formData.append("entry.Add Image of Repair Shop", data.photo); 

    
    fetch(googleFormURL, {
        method: "POST",
        mode: "no-cors", // Required for Google Forms POST requests
        body: formData,
    })
        .then((res) => {
            if(res.status == 200){
                resetnewrepairerform();
                alert("Data submitted successfully.");
            }
            console.log("Data submitted successfully.");
        })
        .catch((error) => {
            console.error("Error submitting data:", error);
        });
};


function resetnewrepairerform() {
    document.getElementById("repairer-name").value ="";
    document.getElementById("contact-number").value ="";
    document.getElementById("address").value ="";
    document.getElementById("repairerType").value ="";
    document.getElementById("services-provided").value ="";
    document.getElementById("average-price").value ="";
    document.getElementById("average-time").value ="";
}

function fetchGoogleSheetData(sheetId, apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`; // Replace 'Sheet1' with your actual sheet name

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log("Sheet Data:", data.values);
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
        });
}

// Example usage:
const sheetId = "1UnFbYnS7hUjCO9ptQA8nYfIHb4zpt_UMIoMdmNF1pF0"; // Replace with your Google Sheet ID
const apiKey = "AIzaSyCPNe0RKk3YlqvBDpsZ_beIS5mG1Z6Joio"; // Replace with your Google API key
fetchGoogleSheetData(sheetId, apiKey);


//https://docs.google.com/spreadsheets/d/1UnFbYnS7hUjCO9ptQA8nYfIHb4zpt_UMIoMdmNF1pF0/edit?usp=sharing