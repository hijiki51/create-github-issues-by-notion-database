## About the Integration

- Create GitHub issues from Notion database.
- Put links and backlinks to each other.

## Running Locally

### 1. Setup your local project

```zsh
git clone git@github.com:YusukeKokubo/create-github-issues-by-notion-database.git
npm install
```

### 2. Set your environment variables in a `.env` file

```zsh
NOTION_KEY= <your-notion-api-key>
NOTION_DATABASE_ID=<your-notion-database-id>
REPO_GITHUB_TOKEN=<your-github-token>
REPO_GITHUB_OWNER=<your-github-owner>
REPO_GITHUB_REPO=<your-github-repository>

TEAM_NAME=<team-name-for-your-tasks-in-database>
TEAM_NAME_PROPERTY=<property-name-for-team-name-in-database>
PROPERTY_TITLE=<property-name-for-title-in-database>
PROPERTY_NO=<property-name-for-github-issues-no>
PROPERTY_GITHUB=<property-name-for-github-issue-url>
```

You can create your Notion API key [here](https://www.notion.com/my-integrations).

Also You must share a database with your integration. 
See Step2. https://developers.notion.com/docs/getting-started

### 3. Add Properties into the Notion Database

Add a property with the same name as the name set in `.env` to the Notion database as well.
Check `PROPERTY_NO`, `PROPERTY_GITHUB`

These properites should be empty.

### 4. Run code

```zsh
npm run issues:create
```

Check the database.
