import { createGitHubIssue } from "./github";
import { getTasksFromDatabase, updateNotionIssueField } from "./notion";

; (async () => {
  const tasks = await getTasksFromDatabase();
  for await (const task of tasks) {
    const issue = await createGitHubIssue(task);
    await updateNotionIssueField(task.id, issue);
    await new Promise<void>(resolve =>
      setTimeout(() => {
        resolve()
      }, 500)
    )
  }
})();
