#!/usr/bin/env node

'use strict';

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const cpr = require("cpr");
const rimraf = require("rimraf");

// Check if a tool is present.
function isPresent(dep) {
  try {
    execSync(dep, {stdio: 'ignore'});
    return true;
  } catch (err) {
    return false;
  }
}

// Run a tool
function run(cmd, args, opts) {
  const output = spawnSync(cmd, args, opts);

  if (output.error != null) {
    throw output.error;
  }

  if (output.status !== 0) {
    throw new Error("Bad error code when running `" + cmd + " " + args.join(" ") + "`: " + output.status);
  }
}

// Check required tools
if (!isPresent("git --version")) {
  console.log('\n git is required, see: https://git-scm.com/downloads');
  process.exit(1);
}

if (!isPresent("cargo --version")) {
  console.log('\n Rust/Cargo is required, see: https://www.rust-lang.org/tools/install');
  process.exit(1);
}

const args = process.argv.slice(2);

let folderName = '.';

// Make a dir for the app
if (args.length >= 1) {
  folderName = args[0];
  
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
}

console.log(" Creating a new Yew app in `" + folderName + "`. ");

let gitFolder = path.join(folderName, ".git-clone");

// This uses --no-tags and --depth 1 in order to make the cloning faster
run("git", ["clone", "--no-tags", "--depth", "1", "https://github.com/jetli/create-yew-app.git", gitFolder]);

// Copies the yew-app folder
cpr(path.join(gitFolder, "crates/yew-app"), folderName, {}, function (err, files) {
  // Removes the git folder regardless of whether cpr succeeded or not
  rimraf.sync(gitFolder);

  if (err) {
    throw err;

  } else {
    console.log(" Success! 🦀 Rust + 🕸 WebAssembly + Yew = ❤️ ");
    console.log(" Installing dependencies... ");
    
    // Install npm deps
    run("npm", ["install"], { cwd: folderName });

    // Install wasm-pack
    if (!isPresent("wasm-pack --version")) {
      run("cargo", ["install", "wasm-pack"]);
    }

    console.log(" Installed dependencies ✅ ");
    console.log();
    console.log(` Success! 🎉 Created ${folderName} at ${folderName}`);
    console.log(' Inside that directory, you can run several commands:');
    console.log();
    console.log('   npm start');
    console.log('     Starts the development server.');
    console.log();
    console.log('   npm run build');
    console.log('     Bundles the app into static files for production.');
    console.log();
    console.log('   npm run test');
    console.log('     Starts the test runner.');
    console.log();
    console.log(' We suggest that you begin by typing:');
    console.log();
    console.log('   cd', folderName);
    console.log('   npm start');
    console.log();
    console.log(' Happy hacking!');
  }
});