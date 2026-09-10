#!/usr/bin/env node
"use strict";
// Validate the proposed policy, NOT the remote repository's protection state.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const policy = JSON.parse(fs.readFileSync(path.join(root, ".github/main-ruleset.json"), "utf8"));

function checkPolicy(value) {
  assert.equal(value.name, "main-validated-pr");
  assert.equal(value.target, "branch");
  assert.equal(value.enforcement, "active");
  assert.deepEqual(value.bypass_actors, []);
  assert.deepEqual(value.conditions, {ref_name: {include: ["refs/heads/main"], exclude: []}});
  const rules = new Map(value.rules.map(rule => [rule.type, rule]));
  assert.equal(rules.size, value.rules.length, "duplicate rule type");
  assert.deepEqual([...rules.keys()].sort(), ["deletion", "non_fast_forward", "pull_request", "required_status_checks"]);
  assert.deepEqual(rules.get("pull_request").parameters, {
    dismiss_stale_reviews_on_push: false,
    require_code_owner_review: false,
    require_last_push_approval: false,
    required_approving_review_count: 0,
    required_review_thread_resolution: true,
  });
  assert.deepEqual(rules.get("required_status_checks").parameters, {
    do_not_enforce_on_create: false,
    required_status_checks: [{context: "validate", integration_id: 15368}],
    strict_required_status_checks_policy: true,
  });
  assert.deepEqual(rules.get("deletion"), {type: "deletion"});
  assert.deepEqual(rules.get("non_fast_forward"), {type: "non_fast_forward"});
}

checkPolicy(policy);
const workflow = fs.readFileSync(path.join(root, ".github/workflows/validate-browser.yml"), "utf8");
assert.match(workflow, /^  validate:\s*$/m, "required check no longer matches the workflow job");
assert.match(workflow, /^  validate:\s*\n    name: validate\s*$/m, "required context must match the explicit job name");
const mutations = [
  p => {p.target = "tag";},
  p => {p.enforcement = "disabled";},
  p => {p.bypass_actors = [{actor_type: "RepositoryRole", actor_id: 5, bypass_mode: "always"}];},
  p => {p.conditions.ref_name.include = ["~ALL"];},
  p => {p.conditions.ref_name.exclude = ["refs/heads/main"];},
  p => {p.rules = p.rules.filter(rule => rule.type !== "pull_request");},
  p => {p.rules = p.rules.filter(rule => rule.type !== "required_status_checks");},
  p => {p.rules[0].parameters.required_approving_review_count = 1;},
  p => {p.rules[0].parameters.require_last_push_approval = true;},
  p => {p.rules[0].parameters.required_review_thread_resolution = false;},
  p => {p.rules[1].parameters.required_status_checks[0].context = "not-the-real-check";},
  p => {delete p.rules[1].parameters.required_status_checks[0].integration_id;},
  p => {p.rules[1].parameters.strict_required_status_checks_policy = false;},
  p => {p.rules.push(p.rules[0]);},
  p => {p.rules = p.rules.filter(rule => rule.type !== "non_fast_forward");},
  p => {p.rules = p.rules.filter(rule => rule.type !== "deletion");},
];
for (const mutate of mutations) {
  const changed = structuredClone(policy);
  mutate(changed);
  assert.throws(() => checkPolicy(changed), assert.AssertionError);
}
console.log(`PASS proposed ruleset and ${mutations.length} negative controls; remote protection is NOT verified by this offline test`);
