const { get } = require("lodash");

module.exports = (page, files) => {
    const giSrc = get(page, "settings.general.image.src");
    if (giSrc && !giSrc.startsWith("data:")) {
        files[giSrc] = { key: giSrc.replace("/files/", "") };
    }

    const siSrc = get(page, "settings.social.image.src");
    if (siSrc && !siSrc.startsWith("data:")) {
        files[siSrc] = { key: siSrc.replace("/files/", "") };
    }

    const videoSrc = get(page, "settings.additional.video.src");
    if (videoSrc) {
        files[videoSrc] = { key: videoSrc.replace("/files/", "") };
    }

    const imageSrc = get(page, "settings.additional.image.src");
    if (imageSrc && !imageSrc.startsWith("data:")) {
        files[imageSrc] = { key: imageSrc.replace("/files/", "") };
    }
};
