const got = require("got");
const FormData = require("form-data");

module.exports = async (buffer, preSignedPostPayload) => {
    const formData = new FormData();
    Object.keys(preSignedPostPayload.fields).forEach(key => {
        formData.append(key, preSignedPostPayload.fields[key]);
    });

    formData.append("file", buffer);

    return got(preSignedPostPayload.url, {
        method: "post",
        body: formData
    });
};
