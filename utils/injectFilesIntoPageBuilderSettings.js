const { get, set, isPlainObject } = require("lodash");

module.exports = (data, files) => {
    [setFavicon, setLogo, setSocial].forEach(fn => fn(data, files));
};

function setFavicon(data, files) {
    const image = get(data, "favicon");

    if (isPlainObject(image)) {
        if (image.src && image.src.startsWith("data:")) {
            return;
        }

        if (image.src) {
            set(data, "favicon", files[image.src].id);
        } else {
            set(data, "favicon", null);
        }
    }
}

function setLogo(data, files) {
    const image = get(data, "logo");

    if (isPlainObject(image)) {
        if (image.src && image.src.startsWith("data:")) {
            return;
        }

        if (image.src) {
            set(data, "logo", files[image.src].id);
        } else {
            set(data, "logo", null);
        }
    }
}

function setSocial(data, files) {
    const image = get(data, "social.image");

    if (isPlainObject(image)) {
        if (image.src && image.src.startsWith("data:")) {
            return;
        }

        if (image.src) {
            set(data, "social.image", files[image.src].id);
        } else {
            set(data, "social.image", null);
        }
    }
}

