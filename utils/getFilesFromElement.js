const { get } = require("lodash");

module.exports = (element, files) => {
    [getFromBackground, getFromImage, getCustomVideo, getCarouselImages].forEach(fn =>
        fn(element, files)
    );
};

function getFromBackground(element, files) {
    let src = get(element, "data.settings.background.image.src");
    if (src) {
        files[src] = { key: src.replace("/files/", "") };
    }
}

function getFromImage(element, files) {
    const src = get(element, "data.image.src");
    if (src && !src.startsWith("data:")) {
        files[src] = { key: src.replace("/files/", "") };
    }
}

function getCustomVideo(element, files) {
    const video = get(element, "data.videoUrl");
    if (video && video.startsWith("/files/")) {
        files[video] = { key: video.replace("/files/", "") };
    }

    const cover = get(element, "data.coverUrl");
    if (cover && cover.startsWith("/files/")) {
        files[cover] = { key: cover.replace("/files/", "") };
    }
}

function getCarouselImages(element, files) {
    const images = get(element, "data.images");
    if (Array.isArray(images)) {
        images.forEach(image => {
            files[image.src] = { key: image.name };
        });
    }
}
