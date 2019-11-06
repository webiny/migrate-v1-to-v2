const path = require("path");
const execa = require("execa");
const fs = require("fs-extra");
const rimraf = require("rimraf");
const { chunk, pick, get } = require("lodash");
const { ObjectID } = require("mongodb");
const mime = require("mime-types");
const { GraphQLClient } = require("graphql-request");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const {
    getFilesFromElement,
    getFilesFromElementPreview,
    getFilesFromPageSettings,
    injectFilesIntoElement,
    injectFilesIntoElementPreview,
    injectFilesIntoPageSettings
} = require("./utils");
const { CREATE_FILES, UPLOAD_FILES } = require("./graphql");
const uploadToS3 = require("./uploadToS3");

const { FILES_LOCATION, FILES_PER_CHUNK, AUTH_TOKEN, GRAPHQL_API_URL } = process.env;

module.exports = async (dbInstance, { host, dbName }) => {
    const out = path.join(__dirname, "out");
    // rimraf.sync(out);
    await fs.ensureDir(out);

    const env = { LC_ALL: "C" };
    const opts = { stdio: "inherit", env };

    const mongoDump = collection => [
        "mongoexport",
        [
            "--uri",
            `${host}/${dbName}`,
            "--out",
            path.join(out, collection + ".json"),
            "--jsonArray",
            "--collection",
            collection
        ].filter(Boolean),
        opts
    ];

    const cmsCollections = ["CmsCategory", "CmsElement", "CmsMenu", "CmsPage"];

    const renameMap = {
        CmsCategory: "PbCategory",
        CmsElement: "PbPageElement",
        CmsMenu: "PbMenu",
        CmsPage: "PbPage"
    };

    // 1. Convert all Cms collections to PageBuilder structure
    async function convertData() {
        try {
            for (let i = 0; i < cmsCollections.length; i++) {
                const cmsCollection = cmsCollections[i];
                await execa(...mongoDump(cmsCollection), { stdio: "inherit" });
            }

            // Replace data
            for (let i = 0; i < cmsCollections.length; i++) {
                const cmsCollection = cmsCollections[i];

                // Replace `cms-` prefix
                await execa(
                    "sed",
                    ["-i.bak", '-es/"cms-/"pb-/g', `./out/${cmsCollection}.json`],
                    opts
                );

                // Replace `pb-element-` prefix
                await execa(
                    "sed",
                    ["-i.bak", '-es/"pb-element-/"/g', `./out/${cmsCollection}.json`],
                    opts
                );

                await execa(
                    "sed",
                    ["-i.bak", '-es/"pages-list-component-/"/g', `./out/${cmsCollection}.json`],
                    opts
                );

                // Replace `--webiny-cms` prefix for CSS vars
                await execa(
                    "sed",
                    ["-i.bak", "-es/--webiny-cms/--webiny-pb/g", `./out/${cmsCollection}.json`],
                    opts
                );

                if (cmsCollection === "CmsElement") {
                    // replace `pb-block-category-` prefix with an empty string
                    await execa(
                        "sed",
                        ["-i.bak", '-es/"pb-block-category-/"/g', `./out/${cmsCollection}.json`],
                        opts
                    );
                }

                if (cmsCollection === "CmsMenu") {
                    // replace `pb-menu-item-` prefix with an empty string
                    await execa(
                        "sed",
                        ["-i.bak", '-es/"pb-menu-item-/"/g', `./out/${cmsCollection}.json`],
                        opts
                    );
                }

                // Restore
                if (!["CmsPage", "CmsElement"].includes(cmsCollection)) {
                    await execa(
                        "mongoimport",
                        [
                            "--uri",
                            `${host}/${dbName}`,
                            "--drop",
                            "--collection",
                            renameMap[cmsCollection],
                            "--jsonArray",
                            "--file",
                            path.join(out, `${cmsCollection}.json`)
                        ].filter(Boolean),
                        opts
                    );
                }
            }

            // Copy settings record
            const data = await dbInstance.collection("Settings").findOne({ key: "cms" });
            if (!data) {
                return;
            }

            const newId = new ObjectID();
            data.key = "page-builder";
            data._id = newId;
            data.id = newId.toString();
            await dbInstance.collection("Settings").insertOne(data);
        } catch (err) {
            console.log(err);
        }
    }

    await convertData();

    // 2. Migrate files
    const files = {};

    // Get all images from Elements
    console.log("👀 Collection files from Elements...");
    const elementsJson = await loadJson(path.join(out, "CmsElement.json"));
    collectFromElements(elementsJson, files);

    // Get all images from Page content and settings
    console.log("👀 Collection files from Pages...");
    const pagesJson = await loadJson(path.join(out, "CmsPage.json"));
    collectFromPages(pagesJson, files);

    console.log(`Found ${Object.keys(files).length} files!`);

    Object.keys(files).forEach(key => {
        const filePath = path.resolve(FILES_LOCATION, files[key].key);
        files[key] = {
            ...files[key],
            path: filePath,
            name: files[key].key,
            size: fs.statSync(filePath).size,
            type: mime.lookup(key)
        };
    });

    // Upload files
    const client = new GraphQLClient(GRAPHQL_API_URL, {
        headers: { Authorization: AUTH_TOKEN }
    });

    // Gives an array of chunks (each consists of FILES_COUNT_IN_EACH_BATCH items).
    const filesChunks = chunk(Object.keys(files), FILES_PER_CHUNK);
    await console.log(
        `Upload files: there are total of ${filesChunks.length} chunks of ${FILES_PER_CHUNK} files to save.`
    );

    for (let i = 0; i < filesChunks.length; i++) {
        await console.log(`Upload files: started with chunk index ${i}`);
        let filesChunk = filesChunks[i];

        // 1. Get pre-signed POST payloads for current files chunk.
        const response = await client.request(UPLOAD_FILES, {
            data: filesChunk.map(key => pick(files[key], ["name", "size", "type"]))
        });

        const preSignedPostPayloads = get(response, "files.uploadFiles.data") || [];
        await console.log(
            `Upload files: received pre-signed POST payloads for ${preSignedPostPayloads.length} files.`
        );

        // 2. Use received pre-signed POST payloads to upload files directly to S3.
        const s3UploadProcess = [];
        for (let j = 0; j < filesChunk.length; j++) {
            const currentFile = filesChunk[j];
            const buffer = fs.readFileSync(files[currentFile].path);
            s3UploadProcess.push(uploadToS3(buffer, preSignedPostPayloads[j].data));
        }

        await Promise.all(s3UploadProcess);

        // 3. Now that all of the files were successfully uploaded, we create files entries in the database.
        await console.log("Upload files: saving File entries into the database...");
        const filesToCreate = filesChunk.map((item, i) => preSignedPostPayloads[i].file);
        const res = await client.request(CREATE_FILES, { data: filesToCreate });

        const createdFiles = get(res, "files.createFiles.data");

        for (let j = 0; j < filesChunk.length; j++) {
            const key = filesChunk[j];
            files[key].id = createdFiles[j].id;
            files[key].src = createdFiles[j].src;
        }
    }

    // Inject file IDs into elements
    injectFilesIntoElements(elementsJson, files);
    await writeJson(__dirname + "/out/CmsElement.json", elementsJson);

    // Inject file IDs into pages
    injectFilesIntoPages(pagesJson, files);
    await writeJson(__dirname + "/out/CmsPage.json", pagesJson);

    // Import the modified collections back to DB
    const restore = ["CmsElement", "CmsPage"];
    for (let i = 0; i < restore.length; i++) {
        await execa(
            "mongoimport",
            [
                "--uri",
                `${host}/${dbName}`,
                "--drop",
                "--collection",
                renameMap[restore[i]],
                "--jsonArray",
                "--file",
                path.join(out, `${restore[i]}.json`)
            ].filter(Boolean),
            opts
        );
    }

    console.log(`\n✅ Migration process finished!`);
};

const isValidElement = element => {
    return element && element.type;
};

// Recursively traverse element and its children
const traverse = (element, cb) => {
    if (!isValidElement(element)) {
        return;
    }

    cb(element);

    if (Array.isArray(element.elements)) {
        for (let i = 0; i < element.elements.length; i++) {
            traverse(element.elements[i], cb);
        }
    }
};

// Traverse element content and preview, and collect references to files.
function collectFromElements(json, files) {
    for (let i = 0; i < json.length; i++) {
        let element = json[i];
        traverse(element.content, contentElement => {
            getFilesFromElement(contentElement, files);
        });

        getFilesFromElementPreview(element, files);
    }
}

// Traverse page content and settings, and collect references to files.
function collectFromPages(json, files) {
    for (let i = 0; i < json.length; i++) {
        let page = json[i];
        traverse(page.content, element => {
            getFilesFromElement(element, files);
        });

        getFilesFromPageSettings(page, files);
    }
}

// Traverse Elements and inject file IDs
function injectFilesIntoElements(json, files) {
    for (let i = 0; i < json.length; i++) {
        let element = json[i];
        traverse(element.content, contentElement => {
            injectFilesIntoElement(contentElement, files);
        });
        injectFilesIntoElementPreview(element, files);
    }
}

// Traverse Pages and inject file IDs
function injectFilesIntoPages(json, files) {
    for (let i = 0; i < json.length; i++) {
        let page = json[i];
        traverse(page.content, element => {
            injectFilesIntoElement(element, files);
        });

        injectFilesIntoPageSettings(page, files);
    }
}
