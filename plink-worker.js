importScripts("/plink.js");
var apiEndpoint = "/api"; //"https://www.camelina-hub.org/api";

function parseQassoc(fileContent, delimiter) {
const rows = fileContent.split("\n");
const header = rows
.shift()
.split(delimiter)
.filter((value) => value !== "");
const resultArray = [];

rows.forEach((row) => {
const columns = row.split(delimiter).filter((value) => value !== "");
const obj = {};

columns.forEach((column, index) => {
    const key = header[index];
    const value = column;
    obj[key] = value;
});

resultArray.push(obj);
});

return resultArray;
}

function isSubsetOf(subset, array) {
return subset.every((element) => array.includes(element));
}

onmessage = async (e) => {
if (e.data.cmd === "runGWAS") {
const originalConsoleLog = console.log;

console.log = function (...args) {
    // Capture the console output
    const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");

    // Post each captured message to the main thread
    postMessage({ cmd: "message", res: message });

    // Call the original console.log
    originalConsoleLog.apply(console, args);
};
const token = e.data.token;
const fam = e.data.fam;
const spp = e.data.spp;
const correction = e.data.correction;
const apiEndpoint = e.data.apiEndpoint;
const phenotype = e.data.phenotype;
const pcsToInclude = e.data.pcsToInclude;

postMessage({ cmd: "message", res: `Running Plink` });
postMessage({ cmd: "message", res: `Target dataset:   ${spp}` });
postMessage({ cmd: "message", res: `Target phenotype: ${phenotype}` });
var fileNames = {
    "plink.bed": "Plink%2Fplink.bed", // this is the largest file, put at the first place to avoid fetching problems
    // "plink.fam": "Plink.fam",
    "plink.bim": "Plink%2Fplink.bim",
    "plink.cov": "Plink%2Fplink.cov"
};
Plink().then((Module) => {
    postMessage({ cmd: "message", res: "Fetching input data" });

    // Function to handle errors during data fetching
    const handleFetchError = (fileName, error) => {
    console.error(`Error fetching data for ${fileName}:`, error);
    };
    const retryOptions = {
    maxRetries: 10, // Maximum number of retries
    retryInterval: 1000, // Retry interval in milliseconds
    };

    const fetchAndCreateDataFile = async (fileName, dbName) => {
    if (fileName && dbName) {           
    let url = `${apiEndpoint}/getBucketObjectData?bucket_name=${spp}&object_name=${dbName}&token=${token}`;

    try {
            const response = await fetch(url, {
                method: "POST",
            });
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch ${fileName}. Status: ${response.status}`
                );
            }

            const contentType = response.headers.get("content-type");
            const data = await (contentType && contentType.startsWith("text")
                ? response.text()
                : response.arrayBuffer());
            return { fileName, data };
        } catch (error) {
            // Handle errors during data fetching
            console.error("Error fetching data:", error);
        }
    };
}

    const onDataFetchSuccess = () => {
    // console.log('Data fetched successfully for all files!');

    const plinkBedPath = "/plink.bed";
    const plinkBimPath = "/plink.bim";

    const checkFileExistence = (path) => {
        const fileInfo = Module.FS.analyzePath(path);
        return fileInfo.exists;
    };

    const checkFileSizeStability = (path, initialSize, retryCount) => {
        const fileInfo = Module.FS.analyzePath(path);
        const currentSize = fileInfo.size;

        if (currentSize === initialSize) {
        // File size is stable, indicating that the file is fully created
        // console.log('File size stable. Running performGWAS()');
        // console.log('File dir', Module.FS.readdir("."));
        // Add your additional functions here
        performGWAS();
        } else {
        // File size changed, retry after a specified interval
        // console.log(`Retry ${retryCount + 1}: File size changed. Waiting...`);
        setTimeout(
            () => checkFileSizeStability(path, initialSize, retryCount + 1),
            1000
        );
        }
    };

    // Check if 'plink.bed' and 'plink.bim' exist in the filesystem
    const plinkBedExists = checkFileExistence(plinkBedPath);
    const plinkBimExists = checkFileExistence(plinkBimPath);

    if (plinkBedExists && plinkBimExists) {
        // Record the initial file sizes
        const initialSizeBed = Module.FS.analyzePath(plinkBedPath).size;
        const initialSizeBim = Module.FS.analyzePath(plinkBimPath).size;

        // Check file size stability
        checkFileSizeStability(plinkBedPath, initialSizeBed, 0);
    } else {
        console.log("Files do not exist yet. Waiting...");
        // Retry fetch if files do not exist
        retryFetch(0);
    }
    };

    const retryFetch = (retryCount) => {
    if (retryCount < retryOptions.maxRetries) {
        // Retry after a specified interval
        // console.log(`Retry ${retryCount + 1}/${retryOptions.maxRetries}: Files do not exist yet. Waiting...`);
        setTimeout(() => {
        // Call the fetch function or perform any necessary action to retry
        fetchAndCreateDataFile()
            .then(() => onDataFetchSuccess())
            .catch((error) => {
            console.error("Error during data fetching:", error);
            });
        }, retryOptions.retryInterval);
    } else {
        // Maximum retries reached, handle accordingly
        // console.log(`Max retries reached. Unable to fetch files.`);
        // Implement further logic or error handling as needed
    }
    };

    // Function to be executed when all data is successfully fetched and files are created
    const performGWAS = () => {
    if (correction == "without") {
        postMessage({
        cmd: "message",
        res: "Running GWAS without correction for population structure",
        });

        // Module.callMain(["--bfile", "plink", "--assoc", "--allow-no-sex"]);
        Module.callMain(["--bfile", "plink", "--assoc", "--allow-no-sex",]);

        postMessage({ cmd: "message", res: `Parsing output` });
    } else {
        postMessage({
        cmd: "message",
        res: "Running GWAS with correction for population structure",
        });

        function generateCovString(pcsToInclude) {
            if (pcsToInclude <= 0) {
              return "";
            }
          
            let covString = "";
            pcsToInclude.forEach(pc =>  {
              covString += "COV" + pc + ","
            })

            return covString;
          }

        let covariates = generateCovString(pcsToInclude)

        // console.log(Module.FS.readdir("."))

        Module.callMain([
        "--bfile",
        "plink",
        "--linear",
        "--covar",
        "plink.cov",
        "--covar-number",
        `${pcsToInclude.join(',')}`,
        // "--covar-name",
        // `${covariates}`,
        "--allow-no-sex",
        "--standard-beta",
        "--hide-covar",
        // a very hard lesson learned 'check your input data again and again'
        ]);
        postMessage({ cmd: "message", res: `Parsing output` });
    }

    // console.log(Module.FS.readdir("."))

    if (isSubsetOf(["plink.assoc"], Module.FS.readdir("."))) {
        var string = new TextDecoder().decode(
        Module.FS.readFile("/plink.assoc")
        );
    } else if (isSubsetOf(["plink.qassoc"], Module.FS.readdir("."))) {
        var string = new TextDecoder().decode(
        Module.FS.readFile("/plink.qassoc")
        );
    } else if (isSubsetOf(["plink.assoc.linear"], Module.FS.readdir("."))) {
        var string = new TextDecoder().decode(
        Module.FS.readFile("/plink.assoc.linear")
        );
    }
    // console.log('string', string)
    if (string != "") {
        const multiArray = parseQassoc(string, " ");
        var keysToKeep = ["SNP", "P"];
        var filteredArray = multiArray
        .filter((obj) => obj["P"] !== "NA")
        .map((obj) => {
            const newObj = {};
            for (const key of keysToKeep) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = obj[key];
            }
            }
            return newObj;
        });
        postMessage({ cmd: "processed", res: filteredArray });
    } else {
        postMessage({
        cmd: "processed",
        res: "No significant results found",
        });
    }
    };

    // Fetch and create data files for each entry in fileNames
    const fetchPromises = Object.keys(fileNames).map((fileName) => {
    let dbName = fileNames[fileName];
    return fetchAndCreateDataFile(fileName, dbName);
    });

    // Wait for all fetch promises to resolve
    Promise.all(fetchPromises)
    .then((fileDataArray) => {
        // Create data files after all fetch promises are resolved
        fileDataArray.forEach(({ fileName, data }) => {
        if (data) {
            if (typeof data === "string") {
            // Text data
            Module.FS.createDataFile("/", fileName, data, true, true);
            } else {
            const blob = new Blob([data], {
                type: "application/octet-stream",
            });
            const reader = new FileReader();
            reader.onload = () => {
                const fileContents = reader.result;
                Module.FS.createDataFile(
                "/",
                fileName,
                fileContents,
                true,
                true
                );
            };
            reader.readAsBinaryString(blob);
            }
        }
        });

        Module.FS.createDataFile("/", 'plink.fam', fam, true, true);
        // Call the success function when all data is successfully fetched and files are created
        onDataFetchSuccess();
    })
    .catch((error) => {
        // Handle errors if any of the fetch promises fail
        console.error("Error during data fetching:", error);
    });
});

console.log = originalConsoleLog;
}

if (e.data.cmd === "runMDS") {

    const originalConsoleLog = console.log;

    console.log = function (...args) {
        // Capture the console output
        const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" ");

        // Post each captured message to the main thread
        postMessage({ cmd: "message", res: message });

        // Call the original console.log
        originalConsoleLog.apply(console, args);
    };

    const token = e.data.token;
    const fam = "plink";
    const spp = e.data.spp;
    const k = e.data.k;
    const apiEndpoint = e.data.apiEndpoint;


    postMessage({ cmd: 'message', res: `Running MDS with Plink` })
    postMessage({ cmd: 'message', res: `Target dataset:   ${spp}` })


    var fileNames = {
        "plink.bed": "Plink%2Fplink.bed",  // this is the largest file, put at the first place to avoid fetching problems 
        "plink.fam": "Plink%2F" + fam + ".fam",
        "plink.bim": "Plink%2Fplink.bim",
        "plink.genome": "Plink%2Fplink.genome"
    };

    Plink().then((Module) => {
        postMessage({ cmd: 'message', res: 'Fetching input data' });

        // Function to handle errors during data fetching
        const handleFetchError = (fileName, error) => {
            console.error(`Error fetching data for ${fileName}:`, error);
        };
        const retryOptions = {
            maxRetries: 10,        // Maximum number of retries
            retryInterval: 1000,   // Retry interval in milliseconds
        };

        const fetchAndCreateDataFile = async (fileName, dbName) => {
            if(fileName && dbName){
                let url = `${apiEndpoint}/getBucketObjectData?bucket_name=${spp}&object_name=${dbName}&token=${token}`;
                try {
                    const response = await fetch(url, {
                        method: "POST",
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${fileName}. Status: ${response.status}`);
                    }
    
                    const contentType = response.headers.get("content-type");
                    const data = await (contentType && contentType.startsWith("text") ? response.text() : response.arrayBuffer());
                    return { fileName, data };
                } catch (error) {
                    // Handle errors during data fetching
                    console.error('Error fetching data:', error);
                }
    
            }
        };

        const onDataFetchSuccess = () => {
            // console.log('Data fetched successfully for all files!');

            const plinkBedPath = "/plink.bed";
            const plinkBimPath = "/plink.bim";

            const checkFileExistence = (path) => {
                const fileInfo = Module.FS.analyzePath(path);
                return fileInfo.exists;
            };

            const checkFileSizeStability = (path, initialSize, retryCount) => {
                const fileInfo = Module.FS.analyzePath(path);
                const currentSize = fileInfo.size;

                if (currentSize === initialSize) {
                    // File size is stable, indicating that the file is fully created
                    // console.log('File size stable. Running performMDS()');
                    // console.log('File dir', Module.FS.readdir("."));
                    // Add your additional functions here
                    performMDS();
                } else {
                    // File size changed, retry after a specified interval
                    // console.log(`Retry ${retryCount + 1}: File size changed. Waiting...`);
                    setTimeout(() => checkFileSizeStability(path, initialSize, retryCount + 1), 1000);
                }
            };

            // Check if 'plink.bed' and 'plink.bim' exist in the filesystem
            const plinkBedExists = checkFileExistence(plinkBedPath);
            const plinkBimExists = checkFileExistence(plinkBimPath);

            if (plinkBedExists && plinkBimExists) {
                // Record the initial file sizes
                const initialSizeBed = Module.FS.analyzePath(plinkBedPath).size;
                const initialSizeBim = Module.FS.analyzePath(plinkBimPath).size;

                // Check file size stability
                checkFileSizeStability(plinkBedPath, initialSizeBed, 0);
            } else {
                // console.log('Files do not exist yet. Waiting...');
                // Retry fetch if files do not exist
                retryFetch(0);
            }
        };

        const retryFetch = (retryCount) => {
            if (retryCount < retryOptions.maxRetries) {
                // Retry after a specified interval
                // console.log(`Retry ${retryCount + 1}/${retryOptions.maxRetries}: Files do not exist yet. Waiting...`);
                setTimeout(() => {
                    // Call the fetch function or perform any necessary action to retry
                    fetchAndCreateDataFile()
                        .then(() => onDataFetchSuccess())
                        .catch((error) => {
                            console.error('Error during data fetching:', error);
                        });
                }, retryOptions.retryInterval);
            } else {
                // Maximum retries reached, handle accordingly
                // console.log(`Max retries reached. Unable to fetch files.`);
                // Implement further logic or error handling as needed
            }
        };

        // Function to be executed when all data is successfully fetched and files are created
        const performMDS = () => {
            postMessage({ cmd: 'message', res: 'Fetching input data is complete' })
            postMessage({ cmd: 'message', res: "Running MDS" })

            Module.callMain([

                "--bfile",
                "plink",
                "--read-genome",
                "plink.genome",
                "--cluster",
                // "--ppc",
                // "0.0001",
                "--K",
                k,
                "--mds-plot",
                "2",
            ]);

            postMessage({ cmd: 'message', res: `Parsing output` })

            var string = new TextDecoder().decode(
                Module.FS.readFile("/plink.mds")
            );
            const multiArray = parseQassoc(string, " ");
            postMessage({ cmd: 'processed', res: multiArray });
        }

        // Fetch and create data files for each entry in fileNames
        const fetchPromises = Object.keys(fileNames).map((fileName) => {
            let dbName = fileNames[fileName];
            return fetchAndCreateDataFile(fileName, dbName);
        });

        // Wait for all fetch promises to resolve
        Promise.all(fetchPromises)
            .then((fileDataArray) => {
                // Create data files after all fetch promises are resolved
                fileDataArray.forEach(({ fileName, data }) => {
                    if (data) {
                        if (typeof data === "string") {
                            // Text data
                            Module.FS.createDataFile("/", fileName, data, true, true);
                        } else {

                            const blob = new Blob([data], {
                                type: "application/octet-stream",
                            });
                            const reader = new FileReader();
                            reader.onload = () => {
                                const fileContents = reader.result;
                                Module.FS.createDataFile(
                                    "/",
                                    fileName,
                                    fileContents,
                                    true,
                                    true
                                );
                            };
                            reader.readAsBinaryString(blob);

                        }
                    }
                });

                // Call the success function when all data is successfully fetched and files are created
                onDataFetchSuccess();
            })
            .catch((error) => {
                // Handle errors if any of the fetch promises fail
                console.error('Error during data fetching:', error);
            });
    });

    console.log = originalConsoleLog;

}

if (e.data.cmd === "runSummaryStatistics") {
const originalConsoleLog = console.log;

console.log = function (...args) {
    // Capture the console output
    const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");

    // Post each captured message to the main thread
    postMessage({ cmd: "message", res: message });

    // Call the original console.log
    originalConsoleLog.apply(console, args);
};

const token = e.data.token;
const fam = "Straw_yield(g_per_plants)_INRAE";
const spp = e.data.spp;
const statistics = e.data.statistics;
const threshold = e.data.threshold || 0;
const apiEndpoint = e.data.apiEndpoint;

postMessage({
    cmd: "message",
    res: `Computing Summary Statistics with Plink`,
});
postMessage({ cmd: "message", res: `Target dataset:   ${spp}` });

var fileNames = {
    "plink.bed": "Plink%2Fplink.bed", // this is the largest file, put at the first place to avoid fetching problems
    "plink.fam": "Plink%2F" + fam + ".fam",
    "plink.bim": "Plink%2Fplink.bim",
    "plink.genome": "Plink%2Fplink.genome",
};

Plink().then((Module) => {
    postMessage({ cmd: "message", res: "Fetching input data" });

    // Function to handle errors during data fetching
    const handleFetchError = (fileName, error) => {
    console.error(`Error fetching data for ${fileName}:`, error);
    };
    const retryOptions = {
    maxRetries: 10, // Maximum number of retries
    retryInterval: 1000, // Retry interval in milliseconds
    };

    const fetchAndCreateDataFile = (fileName, dbName) => {
    let url = `${apiEndpoint}/getBucketObjectData?bucket_name=${spp}&object_name=${dbName}&token=${token}`;

    return fetch(url, {
        method: "POST",
    })
        .then((response) => {
        if (!response.ok) {
            throw new Error(
            `Failed to fetch ${fileName}. Status: ${response.status}`
            );
        }

        const contentType = response.headers.get("content-type");
        return contentType && contentType.startsWith("text")
            ? response.text()
            : response.arrayBuffer();
        })
        .then((data) => {
        return { fileName, data };
        })
        .catch((error) => {
        // Handle errors during data fetching
        console.error("Error fetching data:", error);
        });
    };

    const onDataFetchSuccess = () => {
    // console.log('Data fetched successfully for all files!');
    const plinkBedPath = "/plink.bed";
    const plinkBimPath = "/plink.bim";
    const checkFileExistence = (path) => {
        const fileInfo = Module.FS.analyzePath(path);
        return fileInfo.exists;
    };
    const checkFileSizeStability = (path, initialSize, retryCount) => {
        const fileInfo = Module.FS.analyzePath(path);
        const currentSize = fileInfo.size;

        if (currentSize === initialSize) {
        // File size is stable, indicating that the file is fully created
        // console.log('File size stable. Running performMDS()');
        // console.log('File dir', Module.FS.readdir("."));
        // Add your additional functions here

        if (statistics.includes("all")) {
            calculateHWE(threshold);
            calculateAF();
            calculateLD();
        } else {
            if (statistics.includes("Heterozygosity")) {
            console.log("implement Heterozygosity");
            } else if (statistics.includes("HWE")) {
            calculateHWE(threshold);
            } else if (statistics.includes("AF")) {
            console.log("implement AF");
            } else {
            console.log("No option selected");
            }
        }
        } else {
        // File size changed, retry after a specified interval
        // console.log(`Retry ${retryCount + 1}: File size changed. Waiting...`);
        // File size changed, retry after a specified interval
        console.log(
            `Retry ${retryCount + 1}: File size changed. Waiting...`
        );
        setTimeout(
            () => checkFileSizeStability(path, initialSize, retryCount + 1),
            1000
        );
        }
    };

    // Check if 'plink.bed' and 'plink.bim' exist in the filesystem
    const plinkBedExists = checkFileExistence(plinkBedPath);
    const plinkBimExists = checkFileExistence(plinkBimPath);

    if (plinkBedExists && plinkBimExists) {
        // Record the initial file sizes
        const initialSizeBed = Module.FS.analyzePath(plinkBedPath).size;
        const initialSizeBim = Module.FS.analyzePath(plinkBimPath).size;

        // Check file size stability
        checkFileSizeStability(plinkBedPath, initialSizeBed, 0);
    } else {
        // console.log('Files do not exist yet. Waiting...');
        // Retry fetch if files do not exist
        retryFetch(0);
    }
    };

    const retryFetch = (retryCount) => {
    if (retryCount < retryOptions.maxRetries) {
        // Retry after a specified interval
        // console.log(`Retry ${retryCount + 1}/${retryOptions.maxRetries}: Files do not exist yet. Waiting...`);
        setTimeout(() => {
        // Call the fetch function or perform any necessary action to retry
        fetchAndCreateDataFile()
            .then(() => onDataFetchSuccess())
            .catch((error) => {
            console.error("Error during data fetching:", error);
            });
        }, retryOptions.retryInterval);
    } else {
        // Maximum retries reached, handle accordingly
        // console.log(`Max retries reached. Unable to fetch files.`);
        // Implement further logic or error handling as needed
    }
    };

    // Function to be executed when all data is successfully fetched and files are created
    const calculateHWE = (threshold) => {
    postMessage({ cmd: "message", res: "Fetching input data is complete" });
    postMessage({ cmd: "message", res: "Calculating HWE" });
    Module.callMain(["--bfile", "plink", "--hardy", "--allow-no-sex"]); // the resulting reports all variants, with or without this flag "--hwe", "0",
    postMessage({ cmd: "message", res: `Parsing output` });
    var string = new TextDecoder().decode(Module.FS.readFile("/plink.hwe"));
    const multiArray = parseQassoc(string, " ");
    var keysToKeep = ["SNP", "P"];

    if (threshold != 0) {
        var finalArray = multiArray
        .filter(
            (obj) =>
            obj["P"] !== "NA" &&
            parseFloat(obj["P"]) <= parseFloat(threshold)
        )
        .map((obj) => {
            const newObj = {};
            for (const key of keysToKeep) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = obj[key];
            }
            }
            return newObj;
        });
        postMessage({ cmd: "processedHWE", res: finalArray });
    } else {
        var finalArray = multiArray
        .filter((obj) => obj["P"] !== "NA")
        .map((obj) => {
            const newObj = {};
            for (const key of keysToKeep) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = obj[key];
            }
            }
            return newObj;
        });
        postMessage({ cmd: "processedHWE", res: finalArray });
    }
    };

    const calculateAF = () => {
    postMessage({ cmd: "message", res: "Fetching input data is complete" });
    postMessage({ cmd: "message", res: "Calculating Alle frequency" });
    Module.callMain(["--bfile", "plink", "--freq"]);
    postMessage({ cmd: "message", res: `Parsing output` });
    var string = new TextDecoder().decode(Module.FS.readFile("/plink.frq"));
    const multiArray = parseQassoc(string, " ");
    var keysToKeep = ["SNP", "MAF"];
    var filteredArray = multiArray
        .filter((obj) => obj["MAF"] !== "NA")
        .map((obj) => {
        const newObj = {};
        for (const key of keysToKeep) {
            if (obj.hasOwnProperty(key)) {
            newObj[key] = obj[key];
            }
        }
        return newObj;
        });
    postMessage({ cmd: "processedAF", res: filteredArray });
    };

    const calculateLD = () => {
    postMessage({ cmd: "message", res: "Fetching input data is complete" });
    postMessage({ cmd: "message", res: "Calculating Alle frequency" });
    Module.callMain(["--bfile", "plink", "--ld-window-r2", "0.2"]);
    postMessage({ cmd: "message", res: `Parsing output` });
    var string = new TextDecoder().decode(Module.FS.readFile("/plink.ld"));
    const multiArray = parseQassoc(string, " ");
    // var keysToKeep = ["SNP","MAF"];
    // var filteredArray = multiArray
    //     .filter((obj) => obj["MAF"] !== "NA")
    //     .map((obj) => {
    //         const newObj = {};
    //         for (const key of keysToKeep) {
    //             if (obj.hasOwnProperty(key)) {
    //                 newObj[key] = obj[key];
    //             }
    //         }
    //         return newObj;
    //     });
    console.log(multiArray);
    postMessage({ cmd: "processedAF", res: multiArray });
    };

    // Fetch and create data files for each entry in fileNames
    const fetchPromises = Object.keys(fileNames).map((fileName) => {
    let dbName = fileNames[fileName];
    return fetchAndCreateDataFile(fileName, dbName);
    });

    // Wait for all fetch promises to resolve
    Promise.all(fetchPromises)
    .then((fileDataArray) => {
        // Create data files after all fetch promises are resolved
        fileDataArray.forEach(({ fileName, data }) => {
        if (data) {
            if (typeof data === "string") {
            // Text data
            Module.FS.createDataFile("/", fileName, data, true, true);
            } else {
            const blob = new Blob([data], {
                type: "application/octet-stream",
            });
            const reader = new FileReader();
            reader.onload = () => {
                const fileContents = reader.result;
                Module.FS.createDataFile(
                "/",
                fileName,
                fileContents,
                true,
                true
                );
            };
            reader.readAsBinaryString(blob);
            }
        }
        });

        // Call the success function when all data is successfully fetched and files are created
        onDataFetchSuccess();
    })
    .catch((error) => {
        // Handle errors if any of the fetch promises fail
        console.error("Error during data fetching:", error);
    });
});

console.log = originalConsoleLog;
}

};
