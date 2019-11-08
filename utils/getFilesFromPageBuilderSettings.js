const { get } = require("lodash");

module.exports = (data, files) => {
    const favicon = get(data, "favicon.src");
    if (favicon) {
        files[favicon] = { key: favicon.replace("/files/", "") };
    }

    const logo = get(data, "logo.src");
    if (logo) {
        files[logo] = { key: logo.replace("/files/", "") };
    }

    const social = get(data, "social.image.src");
    if (social) {
        files[social] = { key: social.replace("/files/", "") };
    }
};
