import { spawn } from "node:child_process";

const scope = process.env.VERCEL_SCOPE || "mikes-hub-vas-projects";
const stagingDomain = process.env.PROMPTIFY_STAGING_DOMAIN || "staging.usepromptify.org";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `Command failed with exit code ${code}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function extractDeploymentUrl(output) {
  const matches = output.match(/https:\/\/[^\s]+\.vercel\.app/g);
  if (!matches?.length) {
    return null;
  }

  return matches[matches.length - 1];
}

async function main() {
  const deploy = await run("vercel", ["deploy", "-y", "--scope", scope]);
  const deploymentUrl = extractDeploymentUrl(deploy.stdout);

  if (!deploymentUrl) {
    throw new Error("Could not find the preview deployment URL in the Vercel output.");
  }

  await run("vercel", ["alias", "set", deploymentUrl, stagingDomain, "--scope", scope]);
  console.log(`\nStaging is ready at https://${stagingDomain}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
