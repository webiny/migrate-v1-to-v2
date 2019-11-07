const { get, set, isPlainObject } = require("lodash");

module.exports = (page, files) => {
    [setGeneral, setSocial, setAdditionalVideo, setAdditionalImage].forEach(fn => fn(page, files));
};

function setGeneral(page, files) {
    const image = get(page, "settings.general.image");

    if (isPlainObject(image)) {
        if (image.src && image.src.startsWith("data:")) {
            return;
        }

        if (image.src) {
            set(page, "settings.general.image", files[image.src].id);
        } else {
            set(page, "settings.general.image", null);
        }
    }
}

function setSocial(page, files) {
    const image = get(page, "settings.social.image");

    if (isPlainObject(image)) {
        if (image.src && image.src.startsWith("data:")) {
            return;
        }

        if (image.src) {
            set(page, "settings.social.image", files[image.src].id);
        } else {
            set(page, "settings.social.image", null);
        }
    }
}

function setAdditionalVideo(page, files) {
    const videoSrc = get(page, "settings.additional.video.src");
    if (videoSrc) {
        set(page, "settings.additional.video", files[videoSrc].id);
    }
}

function setAdditionalImage(page, files) {
    const image = get(page, "settings.additional.image");
    if (isPlainObject(image)) {
        if (image.src && image.src.startsWith("data:")) {
            return;
        }

        if (image.src) {
            set(page, "settings.additional.image", files[image.src].id);
        } else {
            set(page, "settings.additional.image", null);
        }
    }
}
