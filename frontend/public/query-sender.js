/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        // TODO: implement!
        const xhr = new XMLHttpRequest();
        const url = "http://localhost:4321/";
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type', 'application/json');

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        }
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(JSON.stringify(query));
    });
};
