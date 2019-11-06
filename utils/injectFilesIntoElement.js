const { get, set } = require("lodash");

module.exports = (element, files) => {
    [setBackground, setImage, setCustomVideo, setCarouselImages].forEach(fn => fn(element, files));
};

function setBackground(element, files) {
    const src = get(element, "data.settings.background.image.src");

    if (src && src.startsWith("data:")) {
        return;
    }

    if (src) {
        delete element.data.settings.background.image.src;
        set(element, "data.settings.background.image.file", files[src].id);
    }
}

function setImage(element, files) {
    const src = get(element, "data.image.src");

    if (src && src.startsWith("data:")) {
        return;
    }

    if (src) {
        delete element.data.image.src;
        set(element, "data.image.file", files[src].id);
    }
}

function setCustomVideo(element, files) {
    const video = get(element, "data.videoUrl");
    if (video && video.startsWith("/files/")) {
        set(element, "data.videoUrl", files[video].src);
    }

    const cover = get(element, "data.coverUrl");
    if (cover && cover.startsWith("/files/")) {
        set(element, "data.coverUrl", files[cover].src);
    }
}

function setCarouselImages(element, files) {
    const images = get(element, "data.images");
    if (Array.isArray(images)) {
        element.data.images = images.map(image => {
            return {
                ...image,
                id: files[image.src].id,
                name: files[image.src].name,
                src: files[image.src].src
            };
        });
    }
}
