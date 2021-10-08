export enum RequestMethod {
    GET = 0,
    POST,
    PUT,
    DELETE,
}

const RequestMethodMap = {
    [RequestMethod.GET]: "GET",
    [RequestMethod.POST]: "POST",
    [RequestMethod.PUT]: "PUT",
    [RequestMethod.DELETE]: "DELETE",
};

export const makeRequest = (
    endPoint: string,
    callback: (data: { [key: string]: any }, error?: string) => void,
    method: RequestMethod = RequestMethod.GET,
    data?: object
): void => {
    fetch(`${process.env["REACT_APP_SERVER_ADDR"]}:${process.env["REACT_APP_SERVER_PORT"]}${endPoint}`, {
        method: RequestMethodMap[method],
        ...(data && {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data["result"] === "error") {
                callback({}, data["message"]);
            } else {
                callback(data);
            }
        })
        .catch((error) => {
            callback({}, error);
        });
};
