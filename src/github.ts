// import { InputPropertyValueMap } from "@notionhq/client/build/src/api-endpoints";
import { ProjectV2Item } from "@octokit/graphql-schema";
import { Octokit } from "octokit";
import { Page } from "./page";

const octokit = new Octokit({ auth: process.env["REPO_GITHUB_TOKEN"] });

// const PROPERTY_GITHUB = process.env["PROPERTY_GITHUB"];



// TODO: milestoneとprojectに紐づける
export const createGitHubIssue = async (task: Page) => {

  const issue = await octokit.rest.issues.create({
    owner: process.env["REPO_GITHUB_OWNER"],
    repo: process.env["REPO_GITHUB_REPO"],
    title: task.title,
    body: task.content,
    milestone: 1, // TODO
  });

  // https://docs.github.com/en/graphql/reference/input-objects#addprojectv2itembyidinput

  const item = await octokit.graphql<{ item: ProjectV2Item }>({
    query: `mutation AddProjectV2ItemByIdInput($input: AddProjectV2ItemByIdInput!) {
      addProjectV2ItemById(input: $input) {
        clientMutationId
        item
      }
    }`,
    input: {
      projectId: process.env["REPO_GITHUB_PROJECT_ID"],
      contentId: issue.data.id,
    },
  })

  await octokit.graphql<{ item: ProjectV2Item }>({
    query: `mutation AddProjectV2ItemByIdInput($input: UpdateProjectV2ItemFieldValueInput!) {
      updateProjectV2ItemFieldValue(input: $input) {
        clientMutationId
        item
      }
    }`,
    input: {
      projectId: process.env["REPO_GITHUB_PROJECT_ID"],
      fieldId: process.env["REPO_GITHUB_PROJECT_FIELD_ID"],
      itemId: item.item.id,
      value: {
        singleSelectOptionId: "TODO", //TODO:
      }
    },
  })
  return issue
}
