const { get } = require("lodash");

module.exports = (element, files) => {
    const src = get(element, "preview.src");
    if (src && !src.startsWith("data:")) {
        files[src] = { key: src.replace("/files/", ""), meta: { private: true } };
    }
};
