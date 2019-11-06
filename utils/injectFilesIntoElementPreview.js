const { get, set } = require("lodash");

module.exports = (element, files) => {
    const src = get(element, "preview.src");
    if (src) {
        set(element, "preview", files[src].id);
    }
};
