module.exports = {
    UPLOAD_FILES: /* GraphQL */ `
        mutation UploadFiles($data: [UploadFileInput]!) {
            files {
                uploadFiles(data: $data) {
                    data {
                        data
                        file {
                            name
                            type
                            size
                            key
                        }
                    }
                    error {
                        message
                    }
                }
            }
        }
    `,

    CREATE_FILES: /* GraphQL */ `
        mutation CreateFiles($data: [FileInput]!) {
            files {
                createFiles(data: $data) {
                    data {
                        id
                        name
                        src
                    }
                    error {
                        message
                    }
                }
            }
        }
    `
};
