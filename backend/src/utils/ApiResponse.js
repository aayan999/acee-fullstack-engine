class ApiResponse {
    constructor(data, message = 'Success') {
        this.statusCode = 200;
        this.data = data;
        this.message = message;
        this.success = true;
    }
}

export { ApiResponse };