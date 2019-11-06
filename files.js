const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const pick = require("lodash/pick");
const mdbid = require("mdbid");
const { get, set, unset } = require("lodash");

const createFile = data => {
    const newId = mdbid();
    return {
        ...data,
        id: newId
    };
};

(async () => {
    let newJson, json;
    const filesJson = [];

    // ✅ Done!
    newJson = [];
    json = await loadJson("./out/pages-migracija/CmsCategory.json");
    for (let i = 0; i < json.length; i++) {
        let item = json[i];
        newJson.push(pick(item, ["id", "name", "slug", "url", "layout"]));
    }

    await writeJson(__dirname + "/out/pages-migracija/pb/PbCategory.json", newJson);

    newJson = [];
    json = await loadJson("./out/pages-migracija/CmsElement.json");
    for (let i = 0; i < json.length; i++) {
        let item = json[i];
        newJson.push(pick(item, ["id", "name", "category", "content", "type", "preview"]));
    }

    // -------------------------------- SET ELEMENTS --------------------------------

    for (let i = 0; i < newJson.length; i++) {
        let element = newJson[i];
        if (typeof element.preview === "string") {
            continue;
        }

        const newId = mdbid();
        const file = {
            id: newId,
            name: element.preview.name,
            size: element.preview.size,
            type: element.preview.type,
            meta: element.preview.meta || {}
        };

        filesJson.push(file);
        element.preview = file.id;
    }

    // -------------------------------- SET CONTENT --------------------------------

    const isValidElement = element => {
        return element && element.type;
    };

    const plugins = [
        {
            async setStorageValue(element) {
                const src = get(element, "data.settings.background.image.src");
                if (src) {
                    let file = createFile({ name: null, type: null, size: null });
                    set(element, "data.settings.background.image.file", file.id);
                    unset(element, "data.settings.background.image.src");
                    filesJson.push(file);
                }
            }
        },
        {
            async setStorageValue(element) {
                if (element.type !== "image") {
                    return;
                }

                const src = get(element, "data.image.src");
                if (src) {
                    if (src.startsWith("data:")) {
                        return;
                    }

                    let file = createFile({
                        name: get(element, "data.image.name"),
                        type: get(element, "data.image.type"),
                        size: get(element, "data.image.size"),
                        meta: get(element, "data.image.meta") || {}
                    });

                    filesJson.push(file);
                    unset(element, "data.image.name");
                    unset(element, "data.image.type");
                    unset(element, "data.image.size");
                    unset(element, "data.image.meta");
                    set(element, "data.image.file", file.id);
                }
            }
        }
    ];

    const asyncModifiers = async element => {
        if (!isValidElement(element)) {
            return;
        }

        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            await plugin.setStorageValue(element);
        }

        if (Array.isArray(element.elements)) {
            for (let i = 0; i < element.elements.length; i++) {
                await asyncModifiers(element.elements[i]);
            }
        }
    };

    try {
        for (let i = 0; i < newJson.length; i++) {
            let element = newJson[i];
            await asyncModifiers(element.content);
        }
    } catch (e) {
        console.log(e);
    }

    // ------------------------------------------------
    await writeJson(__dirname + "/out/pages-migracija/pb/PbElement.json", newJson);
    await writeJson(__dirname + "/out/pages-migracija/pb/File.json", filesJson);
    process.exit();
    // ------------------------------------------------

    await writeJson(__dirname + "/out/pages-migracija/pb/PbElement.json", newJson);

    // 🛑️ Missing!
    newJson = [];
    json = await loadJson("./out/pages-migracija/pb/CmsPage.json");
    for (let i = 0; i < json.length; i++) {
        let item = json[i];
        newJson.push(
            pick(item, [
                "id",
                "category",
                "title",
                "url",
                "content",
                "settings",
                "version",
                "parent",
                "locked",
                "published"
            ])
        );
    }

    await writeJson(__dirname + "/out/pages-migracija/pb/PbPage.json", newJson);

    // 🛑️ Missing!
    json = await loadJson("./out/pages-migracija/pb/CmsMenu.json");
    await writeJson(
        __dirname + "/out/pages-migracija/pb/PbMenu.json",
        json.map(item => {
            return pick(item, ["id", "title", "slug", "description", "items"]);
        })
    );

    await writeJson(__dirname + "/out/pages-migracija/pb/File.json", filesJson);

    process.exit();
})();
