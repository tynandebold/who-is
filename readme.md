# Who's That?
A Slack slash command that takes a collegue's name and queries an API to return pertinent work-related information about them.

## Development

Prerequisites:
- You need to have admin ownership in a Slack organization to be able to create apps, slash commands, and add them to the org.
- [Sign into or create a Slack account, then create an app.](https://api.slack.com/apps)
- Once your app is created, you need to do a few things:
  - In the `Basic Information` section, you should add a Slash command, configure permissions, and install the app to your workspace

To develop locally:
1. Install the dependencies and start the app :
```sh
$ npm install
$ npm start
```
2. Expose and secure the local server to the public internet using something like [ngrok](https://ngrok.com/) (Slack requires connections to be `https`):
```sh
$ ngrok http 9001
```
3. Take the secure `Forwarding` url and add it to your slash command's configuration, accessible within your App via the `Slash Commands` section in the [Slack API](https://api.slack.com/apps) (example url: https://5dbb2bd0.ngrok.io)

## Deployment

The application is deployed with [Now](https://zeit.co/now) CLI, where I'm signed in and have setup environment variables and secrets. Those things won't be posted here. 