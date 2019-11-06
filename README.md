# migrate-v1-to-v2

This tool is created for projects that used Webiny v1 and were hosted on DigitalOcean and similar VPS services.

## How to migrate?

You will need the Webiny v2 API URL to use this tool.

Preparation:
- Create a new Webiny v2 project.
- The `MONGODB_SERVER` and `MONGODB_NAME` should point to the same MongoDB database you use for the v1 project.
- Deploy your new API

On your existing server:  
- Clone this repo on your server.
- Copy `example.env` to `.env` and insert your variable values.
- The `FILES_LOCATION` should point to the folder where your files are located.
- Run `yarn migrate`.
