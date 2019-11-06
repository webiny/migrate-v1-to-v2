const { get, set } = require("lodash");

module.exports = (page, files) => {
    [setGeneral, setSocial, setAdditionalVideo, setAdditionalImage].forEach(fn => fn(page, files));
};

function setGeneral(page, files) {
    const giSrc = get(page, "settings.general.image.src");

    if (giSrc && giSrc.startsWith("data:")) {
        return;
    }

    if (giSrc) {
        set(page, "settings.general.image", files[giSrc].id);
    }
}

function setSocial(page, files) {
    const siSrc = get(page, "settings.social.image.src");

    if (siSrc && siSrc.startsWith("data:")) {
        return;
    }

    if (siSrc) {
        set(page, "settings.social.image", files[siSrc].id);
    }
}

function setAdditionalVideo(page, files) {
    const videoSrc = get(page, "settings.additional.video.src");
    if (videoSrc) {
        set(page, "settings.additional.video", files[videoSrc].id);
    }
}

function setAdditionalImage(page, files) {
    const imageSrc = get(page, "settings.additional.image.src");
    if (imageSrc) {
        set(page, "settings.additional.image", files[imageSrc].id);
    }
}
