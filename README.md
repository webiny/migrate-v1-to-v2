# migrate-v1-to-v2

This tool is created for projects that used Webiny v1 and were hosted on DigitalOcean and similar VPS services.

## How to migrate?

> WARNING: use at your own responsibility!! Create a backup copy of your database and do a test run against a copy you're not afraid to mess up.    

You will need the Webiny v2 API URL to use this tool.

Preparation:
- Create a new Webiny v2 project.
- The `MONGODB_SERVER` and `MONGODB_NAME` should point to a copy of an existing MongoDB database you use for the v1 project.
- Deploy your new API

On your existing server:  
- Clone this repo on your server.
- Copy `example.env` to `.env` and insert your variable values.
- The `FILES_LOCATION` should point to the folder where your files are located.
- Run `yarn migrate`.

## React plugins
You will have to migrate the React plugins, if you have them, as well. Notable changes in v2 are:
- `CMS` is now renamed to `PageBuilder` and so are all the plugin names. It is now `pb-....`.
- we migrated to `hooks` instead of `HOC`s
- Webiny packages are now scoped, and look like this: `@webiny/xy`
- Page Builder element plugins no longer store the plugin name to the DB. Instead, each element plugin now has a `elementType` key which goes to DB and that is how we pair the plugin with the element that gets stored to DB.

There are lots of examples in our own codebase. If you are stuck with something, get in touch via Github.

## This doesn't really work
This tool was tested against a moderately customized Webiny project. Of course, it may not migrate all the custom things you have in your project. That is why you are free to dig into the code and add handling for your custom stuff. If you need help, let us know.
