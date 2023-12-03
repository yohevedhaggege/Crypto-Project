/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {

    $("a.nav-link").click(function () {
        //Pill UI: 
        $("a.nav-link").removeClass("active");
        $(this).addClass("active");

        //Display correct section:
        const sectionId = $(this).attr("data-section");
        $("section").hide();
        $("#" + sectionId).show();
    });


    //Function ajax to retrieve all coins
    async function getAllCoins() {
        return $.ajax({
            method: "GET",
            url: "https://api.coingecko.com/api/v3/coins/",
        });
    };

    //Function to retrieve coin prices
    function getCoinsValuesInUsd() {
        const start = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=";
        let coinsSymbols = selectedCoins[0].symbol;
        // Concatenate part symbols to construct the URL
        for (let i = 1; i < selectedCoins.length; i++) {
            coinsSymbols = coinsSymbols + "," + selectedCoins[i].symbol;
        }
        const end = "&tsyms=USD";
        const fullURL = start + coinsSymbols + end;
        //Send the request to get the prices
        return $.ajax({
            method: "GET",
            url: fullURL,
        });
    };

    //Function to retrieve a specific coin using the id
    function getCoin(id) {
        return $.ajax({
            method: "GET",
            url: `https://api.coingecko.com/api/v3/coins/${id}`,
        });
    };

    $("#homeLink").click(async () => await handleHome());
    $("#reportsLink").click(async () => await liveReports());
    $("#aboutLink").click(() => aboutMe());
    $("#search").click(() => searchSymbol());

    async function searchSymbol() {
        showLoader();
        //Retrieve the value of the searchInput
        const searchInputSymbol = $("#searchInput").val().trim();

        //Validation check for empty search input
        if (searchInputSymbol === "") {
            resetActiveClasses();
            swal("Error!", "Please enter a symbol", "error");

        } else {
            //Get all available coins from the API
            const coins = await getAllCoins();
            //Filter the coins to find a match based on the symbol entered by the user
            const matchedCoins = coins.filter((coin) => {
                return coin.symbol.toLowerCase() === searchInputSymbol.toLowerCase();
            });

            //If the symbol is not found in the API data
            if (matchedCoins.length === 0) {
                resetActiveClasses();
                swal("Error!", "The entered symbol doesn't exist.", "error");
            } else {
                //If a matching coin is found, proceed to display its information
                displayCoins(matchedCoins);
            }
        }
    }

    //Display all coins in card 
    async function handleHome() {
        const coins = await getAllCoins();
        displayCoins(coins);
    };

    //Function to display information about cryptocurrencies
    function displayCoins(coins) {

        try {
            resetActiveClasses();
            //Clear session storage if the page is reloaded
            if (window.location.reload) {
                sessionStorage.clear();
            }
            //Loop to create the list of coins and append the HTML for each coin card to the main
            for (let i = 0; i < coins.length; i++) {
                $(".main").append(
                    `<div class="card m-3">
    <div class="card-body">
    <h5 class="card-title">${coins[i].symbol.toUpperCase()} <img src="${coins[i].image.thumb}" alt="image"/></h5>                       
    <div class="form-check form-switch">
    <input class="form-check-input" data-id="${coins[i].id}" data-toggle="toggle" type="checkbox" id="${coins[i].id}-toggle" />
    </div>           
    </div>  
    <p class="card-text">${coins[i].name} </p>
    <div class="card-bottom">
    <button data-bs-toggle="collapse" data-bs-target="#more-info-${coins[i].id}" id="${coins[i].id}"
    type="checkbox" class="btn btn-primary more-info-button"> More Info </button>
    </div>
    <div id="more-info-${coins[i].id}" class="collapse row">  </div>       
    </div>`
                );
                switchToggle(coins[i].id);
                removeLoader();
            }

            //Toggle
            $(".form-check-input").click((e) => {
                showLoader();
                const id = e.target.dataset.id;

                // If the toggle is checked handle adding the coin to the selection
                if ($(`#${id}-toggle`).is(":checked")) {

                    // If the maximum number of selected coins(5 coins) is reached show a message and prevent adding more coins
                    if (selectedCoins.length === 5) {
                        const desiredCoin = id;
                        displayCoins(selectedCoins);

                        // Display a message to the user and provide option to cancel coin
                        $(".main").prepend(`
                                  <div class="col-lg-12 d-flex flex-column justify-content-center more-than-five">
                                  <div class="more-than-five-card">
                                  <h1>Please deselect a coin before adding this coin, or click cancel.</h1>
                                  </div>
                                  <button id="cancel" type="button" class="btn btn-danger align-self-center cancel"> Cancel </button>   
                                  </div>`  );

                        $(".cancel").click(() => { handleHome() })

                        // The user cancel the selection of another coin
                        $(".form-check-input").click((e) => {
                            showLoader();
                            const previousCoin = e.target.dataset.id;
                            //Delete previousCoin from selectedCoins
                            selectedCoins = selectedCoins.filter((coin) => {
                                return coin.id !== previousCoin;
                            });
                            //Add desiredCoin to selectedCoins
                            let coin = 0;
                            for (let i = 0; i < coins.length; i++) {
                                if (coins[i].id === desiredCoin) {
                                    coin = coins[i];
                                }
                            }
                            selectedCoins.push(coin);
                            saveToLocalStorageSelectedCoins();
                            handleHome();
                        });

                    } else {
                        // If the maximum limit is not reached, add the selected coin to the selection and save to local storage
                        let coin = 0;
                        for (let i = 0; i < coins.length; i++) {
                            if (coins[i].id === id) {
                                coin = coins[i];
                            }
                        }
                        selectedCoins.push(coin);
                        saveToLocalStorageSelectedCoins();
                    }

                } else {
                    // If the toggle is unchecked, remove the coin from the selection and save to local storage
                    selectedCoins = selectedCoins.filter((coin) => {
                        return coin.id !== id;
                    });
                    saveToLocalStorageSelectedCoins();
                }
                removeLoader();
            });

            let coin;
            $(".more-info-button").click(async (e) => {
                showLoader();
                try {
                    const id = e.target.id;
                    if (!$(`#${id}`).hasClass("collapsed")) {
                        // Check if the coin information is already stored in session storage
                        if (sessionStorage.getItem(`more-info-coin-${id}`) !== null) {
                            // Retrieve the coin information from session storage if available
                            let retrievedCoin = sessionStorage.getItem(`more-info-coin-${id}`);
                            console.log(retrievedCoin);
                            coin = JSON.parse(retrievedCoin);
                            console.log(coin);
                            setTimeout(() => {
                                sessionStorage.removeItem(`more-info-coin-${id}`);
                            }, 120000);
                        }
                        else {
                            // If the coin information is not in session storage, fetch it and display it
                            const coin = await getCoin(id);
                            $(`#more-info-${coin.id}`).append(` 
                              <div class="col-6">
                              <p><b>USD:</b> ${coin.market_data.current_price.usd} <b>$</b></p>
                              <p><b>EUR:</b> ${coin.market_data.current_price.eur} <b>€</b></p>
                              <p><b>ILS:</b> ${coin.market_data.current_price.ils} <b>₪</b></p>
                              </div>
                              <img class="col-6" src="${coin.image.small}" alt="coin-image" />
                             `);
                        }
                        sessionStorage.setItem(`more-info-coin-${coin.id}`, JSON.stringify(coin));
                    }
                    else {
                        $(`#more-info-${id}>*`).remove();
                    }
                } catch (error) {
                    console.log("Error:" + error);
                }
                removeLoader();
            });
        } catch (error) {
            console.log(error);
        }
    };

    //Function to display live reports
    async function liveReports() {
        try {
            resetActiveClasses();
            // Check if no coins have been selected
            if (selectedCoins.length === 0) {
                // If no coins have been selected, display an error message
                $(".main").append(`
                       <div>
                       <h1>"Please select one or more coins to view the graph."</h1>
                       </div>
    `);
            } else {
                //If coins have been selected, create a chart container
                $(".main").append(`
    <div id="chartContainer" style="height: 600px; width: 100%;"></div>
    `);
                //Set up the chart options
                var options = {
                    title: { text: "Reports cryptonite in USD" },
                    axisX: { title: "Time updates every 2 seconds" },
                    axisY: { title: "Crypto price USD" },
                    toolTip: { shared: true },
                    legend: {
                        cursor: "pointer",
                        itemclick: toggleDataSeries,
                    },
                    data: [],
                };
                //Create a new CanvasJS chart with the specified options
                var chart = new CanvasJS.Chart("chartContainer", options);
                // Create data series for each selected coin
                for (let i = 0; i < selectedCoins.length; i++) {
                    options.data.push({
                        type: "spline",
                        name: `${selectedCoins[i].name}`,
                        xValueFormatString: "hh:mm:ss",
                        showInLegend: true,
                        dataPoints: [],
                    });
                }
                // Show a loader while fetching data
                showLoader();

                // Function to update the graph with new data
                async function updateGraph() {
                    //Get coin prices in USD
                    const coinsPrices = await getCoinsValuesInUsd();
                    //Get the current time to use as a label on the graph
                    let time = new Date().toLocaleTimeString();
                    //Update the data points for each selected coin
                    for (let i = 0; i < selectedCoins.length; i++) {
                        let coin = options.data[i].dataPoints;
                        coin.push({
                            y: coinsPrices[Object.keys(coinsPrices)[i]].USD,
                            label: time,
                        });
                    }
                    //Remove the loader once data is updated
                    removeLoader();
                    //Render the updated chart
                    chart.render();
                }

                //Function to toggle data series visibility when legend items are clicked
                function toggleDataSeries(e) {
                    if (
                        typeof e.dataSeries.visible === "undefined" ||
                        e.dataSeries.visible
                    ) {
                        e.dataSeries.visible = false;
                    } else {
                        e.dataSeries.visible = true;
                    }
                    e.chart.render();
                }

                //Render the chart initially
                chart.render();
                //Set an interval to update the graph every 2 seconds
                myInterval = setInterval(() => updateGraph(), 2000);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Function to display information about Cryptonite and about my life
    function aboutMe() {
        resetActiveClasses();

        $(".main").append(`
        <div class="col-6">
        <div class="d-flex justify-content-center flex-row">        
        <div class="d-flex justify-content-between">
        <p class="masthead-subheading shadow-lg p-3 mb-5 rounded m-4">
        <b>About Project </b><br /><br />
        My code implements a simple web application to display information about cryptocurrencies,
        specifically using the CoinGecko API. The application consists of different sections, such as Home, Live Reports, and About Me, 
        and allows users to search for specific cryptocurrencies based on their symbols.
        </p>      
        <hr>
         <p class="masthead-subheading shadow-lg p-3 mb-5 rounded m-4"> 
         <b>About Me</b><br /><br />
         I'm Yoheved Haggege. I'm 28 years old and was born in Paris.
         I have a degree in Software Practical-Engineering from Ort College, Jerusalem, and a B.A. Degree in Hebrew Literature and Foreign Cultures from Open University, Paris.
         Currently, I am learning to become a FullStack Developer at "John Bryce" and will finish in September 2023.
         I am married and have 3 children.
         I love listening to music, reading, and learning new technologies.
         </p>   
         <img class="profile-picture m-1"
         src="assets/images/yoheved.png"
         alt="profile picture"/>
         </div>            
         </div>         
         </div>                  
`)
    }



    let selectedCoins = [];
    let myInterval = '';
    const showLoader = () => {
        $(".main").append(`
     <div class="loader" id="loader">
     <img src="assets/images/loading.svg" alt="loader" />
     </div>
   `);
    };
    function removeLoader() {
        $('#loader').remove();
    }

    function resetActiveClasses() {
        $(".home").removeClass("active");
        $(".about").removeClass("active");
        $(".live-reports").removeClass("active");
        $(".main>*").remove();
        clearInterval(myInterval);
    };

    function switchToggle(id) {
        // Check if the coin with the given id is present in the selectedCoins array
        if (selectedCoins.some((coin) => coin.id === id)) {
            // If the coin is selected, set the switch to true- checked
            $(`#${id}-toggle`).prop("checked", true);
        } else {
            // If the coin is not selected, set the switch to false - unchecked
            $(`#${id}-toggle`).prop("checked", false);
        }
    };

    handleHome();

    // Function to load selected coins from local storage
    function loadFromLocalStorageSelectedCoins() {
        // Check if there are selected coins stored in local storage
        if (localStorage.getItem("selected-coins") !== null) {
            // Retrieve selected coins from local storage and parse them to an array
            let retrievedSelectedCoins = localStorage.getItem("selected-coins");
            selectedCoins = JSON.parse(retrievedSelectedCoins);
        }
        // Return the array of selected coins 
        return selectedCoins;
    };

    selectedCoins = loadFromLocalStorageSelectedCoins();

    // Function to save the selected coins to local storage
    function saveToLocalStorageSelectedCoins() {
        // Store the array of selected coins in local storage after converting it to a JSON string
        localStorage.setItem("selected-coins", JSON.stringify(selectedCoins));
    };


    $(window).on("scroll", () => {
        let scrollPosition = $(window).scrollTop();

        $(".parallax-layer").each(() => {
            let speed = $(this).data("speed");
            $(this).css("transform", `translateY(${scrollPosition * speed}px)`);
        });
    });

});
