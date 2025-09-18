(async () => {
    const url = "https://www.camelina-hub.org/api/assay/trait/data";

    const payload = {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJndWVzdEB1bnR3aXN0LWh1Yi5vcmciLCJyb2xlIjoiUmV2aWV3ZXIiLCJleHAiOjE3NTgxMTgxMDB9.PN_ercNTT-ES5SG2Zqnqn377ZxLfPppAs9TZ7X5bb74",
        "traitList": [
            {
                "tableName": "stem_biometrics",
                "variableName": "fw (g)",
                "study_identifier": "UNTWIST2.1"
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST', // Specify the request method
            headers: {
                'Content-Type': 'application/json' // Tell the server we're sending JSON
            },
            body: JSON.stringify(payload) // Convert the JS object to a JSON string
        });

        if (!response.ok) {
            // If the server responded with an error (e.g., 404, 500)
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the JSON response from the server
        const data = await response.json();
        
        // Log the successful response data to the console
        console.log('✅ Success:', data);

    } catch (error) {
        // Log any errors that occurred during the fetch
        console.error('❌ Error:', error);
    }
})();