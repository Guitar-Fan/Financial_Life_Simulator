import { execSync } from "node:child_process";
import { cp, mkdir, rm, access, copyFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");

const staticFiles = [
  "index.html",
  "main.html",
  "INVESTORPOLY.html",
  "Map.html",
  "tax_life_journey.html",
  "tax_policy_simulator.html",
  "2dbakeryenvironment.html",
  "VERSION.md",
  "Bakery2.png"
];

const staticDirs = ["assets", "js"];

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(source, destination) {
  if (!(await exists(source))) {
    return;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function copyDirIfExists(source, destination) {
  if (!(await exists(source))) {
    return;
  }
  await cp(source, destination, { recursive: true });
}

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const fileName of staticFiles) {
    const source = path.join(root, fileName);
    const destination = path.join(distDir, fileName);
    await copyIfExists(source, destination);
  }

  for (const dirName of staticDirs) {
    const source = path.join(root, dirName);
    const destination = path.join(distDir, dirName);
    await copyDirIfExists(source, destination);
  }

  execSync("npm --prefix stock-simulator ci --no-audit --no-fund", {
    cwd: root,
    stdio: "inherit"
  });

  execSync("npm --prefix stock-simulator run build", {
    cwd: root,
    stdio: "inherit"
  });

  await copyDirIfExists(
    path.join(root, "stock-simulator", "dist"),
    path.join(distDir, "stock-simulator")
  );

  console.log("Built deploy bundle at dist/");
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
