import { Page } from "./page";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { TitlePropertyValue } from "@notionhq/client/build/src/api-types";
import { InputPropertyValueMap } from "@notionhq/client/build/src/api-endpoints";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types";


const notion = new Client({ auth: process.env["NOTION_KEY"] });

const n2m = new NotionToMarkdown({ notionClient: notion });

const DATABASE_ID = process.env["NOTION_DATABASE_ID"];
const TEAM_NAME = process.env["TEAM_NAME"];
const TEAM_NAME_PROPERTY = process.env["TEAM_NAME_PROPERTY"];
const PROPERTY_TITLE = process.env["PROPERTY_TITLE"];
const PROPERTY_NO = process.env["PROPERTY_NO"];
const PROPERTY_GITHUB = process.env["PROPERTY_GITHUB"];

export const getTasksFromDatabase = async () => {
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
        const mdblocks = await n2m.pageToMarkdown(page.id);
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

export const updateNotionIssueField = async (pageId: string, issue: RestEndpointMethodTypes["issues"]["create"]["response"]) => {
  const propertyValues: InputPropertyValueMap = {};
  propertyValues[PROPERTY_NO] = {
    type: "number",
    number: issue.data.number,
  };
  propertyValues[PROPERTY_GITHUB] = {
    type: "url",
    url: issue.data.html_url,
  };

  notion.pages.update({
    page_id: pageId,
    properties: propertyValues,
  });
}