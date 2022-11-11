import { Client } from "@notionhq/client";
import { InputPropertyValueMap } from "@notionhq/client/build/src/api-endpoints";
import { TitlePropertyValue } from "@notionhq/client/build/src/api-types";
import { NotionToMarkdown } from "notion-to-md";

import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env["REPO_GITHUB_TOKEN"] });
const notion = new Client({ auth: process.env["NOTION_KEY"] });
const n2m = new NotionToMarkdown({ notionClient: notion });

const DATABASE_ID = process.env["NOTION_DATABASE_ID"];
const TEAM_NAME = process.env["TEAM_NAME"];
const TEAM_NAME_PROPERTY = process.env["TEAM_NAME_PROPERTY"];
const PROPERTY_TITLE = process.env["PROPERTY_TITLE"];
const PROPERTY_NO = process.env["PROPERTY_NO"];
const PROPERTY_GITHUB = process.env["PROPERTY_GITHUB"];

type Page = {
  id: string;
  title: string;
  content: string;
};

const createGitHubIssues = async (tasks: Page[]) => {
  for await (const [_, task] of Object.entries(tasks)) {
    const createdIssue = await octokit.rest.issues.create({
      owner: process.env["REPO_GITHUB_OWNER"],
      repo: process.env["REPO_GITHUB_REPO"],
      title: task.title,
      body: task.content,
    });

    const propertyValues: InputPropertyValueMap = {};
    propertyValues[PROPERTY_NO] = {
      type: "number",
      number: createdIssue.data.number,
    };
    propertyValues[PROPERTY_GITHUB] = {
      type: "url",
      url: createdIssue.data.html_url,
    };

    notion.pages.update({
      page_id: task.id,
      properties: propertyValues,
    });

    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 500)
    )
  }
}

const getTasksFromDatabase = async () => {
  const tasks: Page[] = [];
  const getPageOfTasks = async (cursor: string | undefined) => {
    const current_pages = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: TEAM_NAME_PROPERTY,
            text: {
              equals: TEAM_NAME,
            },
          },
          {
            property: PROPERTY_NO,
            number: {
              is_empty: true,
            },
          },
        ],
      },
      start_cursor: cursor,
    });
    console.log("pages count: ", current_pages.results.length);

    for await (const page of current_pages.results) {
      if (page.object === "page") {
        const title = page.properties[PROPERTY_TITLE] as TitlePropertyValue;
        const mdblocks = await n2m.pageToMarkdown("target_page_id");
        const mdString = n2m.toMarkdownString(mdblocks);
        tasks.push({
          id: page.id,
          title: title.title[0].plain_text,
          content: mdString,
        });
      }
    }

    if (current_pages.has_more) {
      await getPageOfTasks(current_pages.next_cursor);
    }
  };
  await getPageOfTasks(undefined);
  return tasks;
};

async function main() {
  const tasks = await getTasksFromDatabase();
  await createGitHubIssues(tasks).catch(console.error);
}

try {
  main();
} catch (error) {
  console.error(error);
}